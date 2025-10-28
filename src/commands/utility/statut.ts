import { ApplicationIntegrationType, ChatInputCommandInteraction, CommandInteraction, EmbedBuilder, InteractionContextType, SlashCommandBuilder } from "discord.js";
import ping from "ping";

export default {
    data: new SlashCommandBuilder()
        .setName('status')
        .setDescription('Give statut of servers.')
        .setIntegrationTypes(
            ApplicationIntegrationType.GuildInstall,
            ApplicationIntegrationType.UserInstall
        )
        .setContexts(
            InteractionContextType.BotDM,
            InteractionContextType.Guild,
            InteractionContextType.PrivateChannel
        ),
    async execute(interaction : ChatInputCommandInteraction) {
        await interaction.deferReply();

        const hosts : {host: string, name: string, alive: boolean, type: 'ping' | 'website'}[] = [
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
                host: 'node.thedrewen.com',
                name: 'Ryzen 9 (Unknow ID) 🖥️',
                alive: false,
                type: 'ping'
            },
            {
                host: 'node.under-scape.com',
                name: 'Xeon (Unknow ID) 🖥️',
                alive: false,
                type: 'ping'
            },
            {
                host: 'panel.protojx.com',
                name: 'Game Ryzen 👾',
                alive: false,
                type: 'ping'
            }
        ]

        async function fetchAlive(host: {host: string, name: string, alive: boolean, type: 'ping' | 'website'}) {
            if(host.type === 'ping'){
                let res = await ping.promise.probe(host.host, {timeout: 3});
                host.alive = res.alive;
            }else if(host.type === 'website'){
                try {
                    const response = await fetch(host.host, { method: 'HEAD', signal: AbortSignal.timeout(3000) });
                    host.alive = response.ok;
                } catch (error) {
                    host.alive = false; 
                }
            }
            return host;
        }

        const fetchPromises = hosts.map(host => fetchAlive(host));
        const hosts_ = await Promise.all(fetchPromises);
        
        const embed = new EmbedBuilder();
        embed.setTitle('Status of protojx servers');
        embed.setColor(0xffffff);
        embed.setTimestamp(new Date());
        embed.setThumbnail(interaction.client.user.avatarURL())

        for(let host of hosts_){
            embed.addFields({name: host.name, value: host.alive ? '<a:online:1432684754276323431> Online' : '<a:offline:1432684900175183882> Offline', inline: false});
        }
        
        await interaction.editReply({embeds: [embed]});
    }
}