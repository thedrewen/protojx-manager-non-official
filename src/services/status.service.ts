import ping from "ping";
import * as cron from 'cron';
import { ActivityType, Client, ContainerBuilder, MessageFlags } from "discord.js";
import { InfraType } from "../type";
import { AppDataSource } from "../data-source";
import { HostsLog } from "../entity/hostslog.entity";
import { Repository } from "typeorm";
import { Follow } from "../entity/follow.entity";
import { Guild } from "../entity/guild.entity";
import dayjs, { Dayjs } from "dayjs";
import { Canvas } from "canvas";
import { Service } from "../entity/service.entity";

type Nofity = {time: Date, name : string, alive : boolean, type : string, host: Service};

export class StatusService {

    private client: Client | null = null;
    private hostsLogRepo: Repository<HostsLog>;
    private followRepo: Repository<Follow>;
    private guildRepo: Repository<Guild>;
    public serviceRepo: Repository<Service>;

    constructor() {

        this.hostsLogRepo = AppDataSource.getRepository(HostsLog);
        this.followRepo = AppDataSource.getRepository(Follow);
        this.guildRepo = AppDataSource.getRepository(Guild);
        this.serviceRepo = AppDataSource.getRepository(Service);

        setTimeout(async () => {
            await this.fetch()
            this.updateClientStatus();
        }, 3000);
        const cronJob = new cron.CronJob('*/2 * * * *', async () => {

            // ? cleanup logs
            const oneMonthAgo = new Date();
            oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
            this.hostsLogRepo.
                createQueryBuilder()
                .delete()
                .from(HostsLog)
                .where("created_at < :date", { date: oneMonthAgo })
                .execute();
            
            // ? Get status
            try {
                await this.fetch();
                await this.updateClientStatus();

                // ? Message Live 
                const guilds = await this.guildRepo.find();
            
                guilds.forEach(async (gdb) => {
                    if(this.client) {
                        try {
                            const guild = await this.client.guilds.fetch(gdb.guild_id);
                            const channel = await guild.channels.fetch(gdb.persistent_message_channel_id);
                            if(channel?.isSendable())  {
                                const message = await channel.messages.fetch(gdb.persistent_message_id);
                                await message.edit({components: [await this.getUpdatedContainer(true)]});
                            }
                        } catch (error) {
                            console.log(error + ' GuildIdInDB : '+gdb.id); 
                        }
                    }
                });
                
                console.log('Status check completed at:', new Date().toISOString());
            } catch (error) {
                console.error('Error during status check:', error);
            }
        });
        cronJob.start();
        console.log('Status monitoring started - checking every 2 minutes');
    }

    setClient(client: Client) {
        this.client = client;
        this.client.user?.setActivity({ name: '💭 Server load and status...' })
    }

    public async getStatusImageBar(host: string) {

        const datas = await this.hostsLogRepo.createQueryBuilder()
            .where('host = :host AND created_at > :date', {host, date: dayjs().subtract(1, 'week').toDate()}).getMany();
        
        const uptimes : { up: boolean, date: Dayjs }[] = datas.map((log) => {

            return {
                up: log.status,
                date: dayjs(log.created_at)
            }
        });

        const now = dayjs();
        const week = now.clone().subtract(1, 'week');

        const canvas = new Canvas(500, 10, "image");
        const ctx = canvas.getContext('2d');

        ctx.fillStyle = "#27FF00";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        const maxTime = (now.unix() - week.unix());
        const ranges: { min: number, max: number }[] = [];

        let minTime: number | null = null;
        uptimes.map((element, index) => {
            const positionForMaxTime = (element.date.unix() - week.unix());
            const percent = Math.round((positionForMaxTime / maxTime) * 100);

            if (ranges.length == 0 && minTime == null) {
                if (element.up && minTime == null) {
                    ranges.push({
                        min: 0,
                        max: percent
                    });
                } else {
                    minTime = percent;
                }
            } else {
                if (!element.up) {
                    minTime = percent;
                    
                    if(minTime != null && index == uptimes.length - 1) {
                        ranges.push({
                            min: minTime,
                            max: 100
                        });
                    } 
                } else {
                    if (minTime) {
                        ranges.push({
                            min: minTime,
                            max: percent
                        });
                    }
                }
            }
        });
        ctx.fillStyle = '#ff0000';
        ranges.map((value) => {
            ctx.fillRect(value.min * 5, 0, value.max * 5 - value.min * 5, canvas.height);
        });

        return canvas.toBuffer('image/png');
    }

    private async updateClientStatus() {
        if (this.client) {
            const hosts_db = await this.serviceRepo.find();
            const hosts = hosts_db.length;
            const hostsAlive = hosts_db.filter((h) => h.alive).length;

            this.client.user?.setActivity({
                name: (
                    hosts == hostsAlive ? '✅ All services are online.' : `📛 ${hosts - hostsAlive} service${hosts - hostsAlive > 1 ? 's' : ''} offline.`
                ), type: ActivityType.Watching
            });
        }
    }

    private async fetchAlive(service: Service, notifs : Nofity[]) {

        const latestLog = await this.hostsLogRepo.findOne({ where: { service }, order: { created_at: 'DESC' } });

        // ? Ping and Request Hosts
        if (service.ping_type === 'ping') {
            let res = await ping.promise.probe(service.host, { timeout: 10 });
            service.alive = res.alive;
        } else if (service.ping_type === 'website') {
            try {
                const response = await fetch(service.host, { method: 'HEAD', signal: AbortSignal.timeout(10000) });
                service.alive = response.ok;
            } catch (error) {
                service.alive = false;
            }
        }

        // ? Notification System :
        if (!latestLog || latestLog.status != service.alive) {
            const log = new HostsLog();
            log.service = service;
            log.status = service.alive;

            this.hostsLogRepo.save(log);

            if(latestLog && service.notify) {
                notifs.push({alive: service.alive, name: service.name, time: new Date(), type: service.type, host: service});
            }
        }

        this.serviceRepo.save(service);

        return service;
    }

    private async fetch(max = 1, notifs : Nofity[] = []) {

        const max_ping = 3;

        const services = await this.serviceRepo.find();
        const hosts = services.filter((value, index) => index < max * max_ping && index >= (max - 1) * max_ping);

        const fetchPromises = hosts.map(host => this.fetchAlive(host, notifs));
        const updatedHosts = await Promise.all(fetchPromises);

        updatedHosts.forEach((updatedHost, index) => {
            const originalIndex = (max - 1) * max_ping + index;
            if (originalIndex < services.length) {
                services[originalIndex] = updatedHost;
            }
        });

        if (services.length > max * max_ping) {
            await this.fetch(max + 1, notifs);
        }else if(notifs.length > 0){
            // ? Notification System (part 2 !):
            const container = new ContainerBuilder()
                .addTextDisplayComponents((t) => t.setContent(`### 🔔 Status change alert`));
            
            notifs.map(async (n) => {
                container.addSeparatorComponents((s)=>s);
                container.addTextDisplayComponents((text) => text.setContent(`${n.alive ? process.env.EMOJI_STATUS_ONLINE : process.env.EMOJI_STATUS_OFFLINE} **${n.name}** is now **${n.alive ? 'online' : 'offline'}**\n🏷️ Type : ${n.type}\n🕒 Time : <t:${Math.round(new Date().getTime()/1000)}:R>`));
            });

            const users = await this.followRepo.find({where: {enable: true}});
            const hosts = notifs.map((n) => n.host);
            const users_ids : string[] = [];
            console.log("Sending notifs...")
            users.filter(v => hosts.map((h) => h.id).includes(v.serviceId)).forEach(async (user) => {
                if(!users_ids.includes(user.user_discord)) {
                    users_ids.push(user.user_discord)
                    try {
                        const userdc = await this.client?.users.fetch(user.user_discord);
                        if(userdc) {
                            userdc.send({components: [container], flags: [MessageFlags.IsComponentsV2]})
                        }
                    } catch (error) {}
                }
            });
        }
    }

    public async getUpdatedContainer(live : boolean = false): Promise<ContainerBuilder> {
        const services = await this.serviceRepo.find({order: {id: 'ASC'}});
        
        const hostTexts = services.map((s) => {
            return { type: s.type, value: `- ${s.name} : ${s.alive ? `${process.env.EMOJI_STATUS_ONLINE} Online` : `${process.env.EMOJI_STATUS_OFFLINE} Offline`}` };
        });

        const container = new ContainerBuilder()
            .setAccentColor(0x0000ed)
            .addTextDisplayComponents((text) => text.setContent('# Status of Protojx services'+(live ? ' (live)' : '')));

        const sections: { title: string, type: InfraType, thumbnail: string }[] = [
            {
                title: 'Websites',
                type: 'website',
                thumbnail: 'https://protojx.com/assets/img/home2/agent.png'
            },
            {
                title: 'Ryzens',
                type: 'ryzen',
                thumbnail: 'https://iconape.com/wp-content/png_logo_vector/ryzen.png'
            },
            {
                title: 'Xeons',
                type: 'xeon',
                thumbnail: 'https://upload.wikimedia.org/wikipedia/commons/3/31/Intel-Xeon-Badge-2024.jpg'
            },
            {
                title: 'Games',
                type: 'games',
                thumbnail: 'https://protojx.com/assets/img/hero-img.png'
            },
            {
                title: 'Routers\n-# *The data displayed here is not real data but demonstration data. (Beta)*',
                type: 'router',
                thumbnail: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRMnCmtQRkLlcD1Cb6vKXz6NOxAu79vzmq2pRqpNYxpTJa5JQEsouhqnVn7cyl6ivYSyzY&usqp=CAU'
            }
        ]

        sections.map((sectionData) => {
            container.addSeparatorComponents((s) => s)
            container.addSectionComponents(
                (section) =>
                    section.addTextDisplayComponents(
                        (text) =>
                            text.setContent('## ' + sectionData.title + '\n' + hostTexts.filter((v) => v.type == sectionData.type).map((v) => v.value).join('\n'))
                    )
                    .setThumbnailAccessory(
                        (acc) =>
                            acc.setURL(sectionData.thumbnail)
                    )
            )
        });

        container.addSeparatorComponents((s) => s);
        container.addTextDisplayComponents((text) => text.setContent(`:globe_with_meridians: Website Status : https://statut.protojx.com/\n${live ? 'Last update : ' : ''}<t:${dayjs().unix()}:f> - Receive automatic notifications when there is an outage with /follow !`));

        return container;
    }
}

export default new StatusService();