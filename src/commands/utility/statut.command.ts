import { ApplicationIntegrationType, ChatInputCommandInteraction, CommandInteraction, ContainerBuilder, EmbedBuilder, InteractionContextType, MessageFlags, SlashCommandBuilder } from "discord.js";
import ping from "ping";
import statusService from "../../services/status.service";
import { CommandDefinition, InfraType } from "../../type";
import { secureHeapUsed } from "crypto";

const cmd : CommandDefinition = {
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

        const hostTexts = statusService.hosts.map((s) => {
            return {type: s.type, value: `- ${s.name} : ${s.alive ? `${process.env.EMOJI_STATUS_ONLINE} Online` : `${process.env.EMOJI_STATUS_OFFLINE} Offline`}`};
        });

        const container = new ContainerBuilder()
            .setAccentColor(0x0000ed)
            .addTextDisplayComponents((text) => text.setContent('# Status of protojx servers'))
        
        const sections : {title: string, type: InfraType, thumbnail: string}[] = [
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
                            text.setContent('## '+sectionData.title+'\n'+hostTexts.filter((v) => v.type == sectionData.type).map((v) => v.value).join('\n'))
                    )
                    .setThumbnailAccessory(
                        (acc) => 
                            acc.setURL(sectionData.thumbnail)
                    )
            )
        });

        const now = new Date();
        container.addTextDisplayComponents((text) => text.setContent(`${now.getDate()}-${now.getMonth() + 1}-${now.getFullYear()} ${(now.getHours()+'').padStart(2, "0")}:${(now.getMinutes()+'').padStart(2, "0")}`))
    
        await interaction.editReply({components: [container], flags: MessageFlags.IsComponentsV2});
    }
}

export default cmd;