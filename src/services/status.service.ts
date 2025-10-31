import ping from "ping";
import * as cron from 'cron';
import { ActivityType, Client } from "discord.js";
import { Host } from "../type";
import { loadEnvFile } from "process";
import { configDotenv } from "dotenv";

configDotenv();

export class StatusService {

    private EMOJI_RYZEN : string = process.env.EMOJI_RYZEN as string;
    private EMOJI_XEON : string = process.env.EMOJI_XEON as string;

    public hosts: Host[] = [
            {
                'host': 'https://protojx.com',
                'name': 'Protojx Website 🌐',
                alive: false,
                type: 'website'
            },
            {
                'host': 'https://manager.protojx.com',
                'name': 'Espace Client 💻',
                alive: false,
                type: 'website'
            },
            {
                host: '5.178.99.4',
                name: 'RYZEN 01 ' + this.EMOJI_RYZEN,
                alive: false,
                type: 'ping'
            },
            {
                host: '5.178.99.6',
                name: 'RYZEN 02 ' + this.EMOJI_RYZEN,
                alive: false,
                type: 'ping'
            },
            {
                host: '5.178.99.5',
                name: 'RYZEN 03 ' + this.EMOJI_RYZEN,
                alive: false,
                type: 'ping'
            },
            {
                host: '154.16.254.10',
                name: 'RYZEN7 04 ' + this.EMOJI_RYZEN,
                alive: false,
                type: 'ping'
            },
            {
                host: '5.178.99.177',
                name: 'XEON 01 (2697A V4) ' + this.EMOJI_XEON,
                alive: false,
                type: 'ping'
            },
            {
                host: '5.178.99.248',
                name: 'XEON 02 (2687W V4) ' + this.EMOJI_XEON,
                alive: false,
                type: 'ping'
            },
            {
                host: '5.178.99.53',
                name: 'RYZEN-GAME 01 👾',
                alive: false,
                type: 'ping'
            },
            {
                host: '5.178.99.63',
                name: 'XEON-GAME 01 👾',
                alive: false,
                type: 'ping'
            }
        ];

    private client: Client | null = null;

    constructor() {

        setTimeout(async () => {
            await this.fetch()
            this.updateClientStatus();
        }, 3000);
        const cronJob = new cron.CronJob('*/2 * * * *', async () => {
            try {
                await this.fetch();
                await this.updateClientStatus();
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

    private async fetch(max = 1): Promise<Host[]> {

        const max_ping = 3;

        const hosts = this.hosts.filter((value, index) => index < max * max_ping && index >= (max - 1) * max_ping);
        async function fetchAlive(host: Host) {
            if (host.type === 'ping') {
                let res = await ping.promise.probe(host.host, { timeout: 10 });
                host.alive = res.alive;
            } else if (host.type === 'website') {
                try {
                    const response = await fetch(host.host, { method: 'HEAD', signal: AbortSignal.timeout(10000) });
                    host.alive = response.ok;
                } catch (error) {
                    host.alive = false;
                }
            }
            return host;
        }

        const fetchPromises = hosts.map(host => fetchAlive(host));
        const updatedHosts = await Promise.all(fetchPromises);

        updatedHosts.forEach((updatedHost, index) => {
            const originalIndex = (max - 1) * max_ping + index;
            if (originalIndex < this.hosts.length) {
                this.hosts[originalIndex] = updatedHost;
            }
        });

        if (this.hosts.length > max * max_ping) {
            await this.fetch(max + 1);
        }

        return this.hosts;
    }
}

export default new StatusService();