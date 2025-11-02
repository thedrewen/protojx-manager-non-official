import ping from "ping";
import * as cron from 'cron';
import { ActivityType, Client, ContainerBuilder, MessageFlags } from "discord.js";
import { Host, InfraType } from "../type";
import { AppDataSource } from "../data-source";
import { HostsLog } from "../entity/hostslog.entity";
import { Repository } from "typeorm";
import { Follow } from "../entity/follow.entity";
import { Guild } from "../entity/guild.entity";

type Nofity = {time: Date, name : string, alive : boolean, type : InfraType};

export class StatusService {

    public hosts: Host[] = [
        {
            'host': 'https://protojx.com',
            'name': 'Protojx Website',
            alive: false,
            ping_type: 'website',
            type: 'website',
            notify: false
        },
        {
            'host': 'https://manager.protojx.com',
            'name': 'Espace Client',
            alive: false,
            ping_type: 'website',
            type: 'website',
            notify: false
        },
        {
            host: '5.178.99.4',
            name: 'RYZEN 01',
            alive: false,
            ping_type: 'ping',
            type: 'ryzen',
            notify: true
        },
        {
            host: '5.178.99.6',
            name: 'RYZEN 02',
            alive: false,
            ping_type: 'ping',
            type: 'ryzen',
            notify: true
        },
        {
            host: '5.178.99.5',
            name: 'RYZEN 03',
            alive: false,
            ping_type: 'ping',
            type: 'ryzen',
            notify: true
        },
        {
            host: '154.16.254.10',
            name: 'RYZEN7 04',
            alive: false,
            ping_type: 'ping',
            type: 'ryzen',
            notify: true
        },
        {
            host: '5.178.99.177',
            name: 'XEON 01 (2697A V4)',
            alive: false,
            ping_type: 'ping',
            type: 'xeon',
            notify: true
        },
        {
            host: '5.178.99.248',
            name: 'XEON 02 (2687W V4)',
            alive: false,
            ping_type: 'ping',
            type: 'xeon',
            notify: true
        },
        {
            host: '5.178.99.53',
            name: 'RYZEN-GAME 01',
            alive: false,
            ping_type: 'ping',
            type: 'games',
            notify: true
        },
        {
            host: '5.178.99.63',
            name: 'XEON-GAME 01',
            alive: false,
            ping_type: 'ping',
            type: 'games',
            notify: true
        }
    ];

    private client: Client | null = null;
    private hostsLogRepo: Repository<HostsLog>;
    private followRepo: Repository<Follow>;
    private guildRepo: Repository<Guild>;

    constructor() {

        this.hostsLogRepo = AppDataSource.getRepository(HostsLog);
        this.followRepo = AppDataSource.getRepository(Follow);
        this.guildRepo = AppDataSource.getRepository(Guild);

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
                                await message.edit({components: [this.getUpdatedContainer(true)]});
                            }
                        } catch (error) {}
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

    private async updateClientStatus() {
        if (this.client) {
            const hosts = this.hosts.length;
            const hostsAlive = this.hosts.filter((h) => h.alive).length;

            this.client.user?.setActivity({
                name: (
                    hosts == hostsAlive ? '✅ All services are online.' : `📛 ${hosts - hostsAlive} service${hosts - hostsAlive > 1 ? 's' : ''} offline.`
                ), type: ActivityType.Watching
            });
        }
    }

    private async fetchAlive(host: Host, notifs : Nofity[]) {

        const latestLog = await this.hostsLogRepo.findOne({ where: { host: host.host }, order: { created_at: 'DESC' } });

        // ? Ping and Request Hosts
        if (host.ping_type === 'ping') {
            let res = await ping.promise.probe(host.host, { timeout: 10 });
            host.alive = res.alive;
        } else if (host.ping_type === 'website') {
            try {
                const response = await fetch(host.host, { method: 'HEAD', signal: AbortSignal.timeout(10000) });
                host.alive = response.ok;
            } catch (error) {
                host.alive = false;
            }
        }

        // ? Notification System :
        if (!latestLog || latestLog.status != host.alive) {
            const log = new HostsLog();
            log.host = host.host;
            log.status = host.alive;

            this.hostsLogRepo.save(log);

            if(latestLog && host.notify) {
                notifs.push({alive: host.alive, name: host.name, time: new Date(), type: host.type});
            }
        }

        return host;
    }

    private async fetch(max = 1, notifs : Nofity[] = []) {

        const max_ping = 3;

        const hosts = this.hosts.filter((value, index) => index < max * max_ping && index >= (max - 1) * max_ping);

        const fetchPromises = hosts.map(host => this.fetchAlive(host, notifs));
        const updatedHosts = await Promise.all(fetchPromises);

        updatedHosts.forEach((updatedHost, index) => {
            const originalIndex = (max - 1) * max_ping + index;
            if (originalIndex < this.hosts.length) {
                this.hosts[originalIndex] = updatedHost;
            }
        });

        if (this.hosts.length > max * max_ping) {
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
            users.forEach(async (user) => {
                try {
                    const userdc = await this.client?.users.fetch(user.user_discord);
                    if(userdc) {
                        userdc.send({components: [container], flags: [MessageFlags.IsComponentsV2]})
                    }
                } catch (error) {}
            });
        }
    }

    public getUpdatedContainer(live : boolean = false): ContainerBuilder {
        const hostTexts = this.hosts.map((s) => {
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

        const now = new Date();
        container.addTextDisplayComponents((text) => text.setContent(`${live ? 'Last update : ' : ''}${now.getDate()}-${now.getMonth() + 1}-${now.getFullYear()} ${(now.getHours() + '').padStart(2, "0")}:${(now.getMinutes() + '').padStart(2, "0")} - Receive automatic notifications when there is an outage with /follow !`));

        return container;
    }
}

export default new StatusService();