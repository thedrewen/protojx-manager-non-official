import { ApplicationIntegrationType, ChatInputCommandInteraction, CommandInteraction, EmbedBuilder, InteractionContextType, SlashCommandBuilder } from "discord.js";
import ping from "ping";
import statusService from "../../services/status.service";
import { CommandDefinition } from "../../type";

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
        
        const embed = new EmbedBuilder();
        embed.setTitle('Status of protojx servers');
        embed.setColor(0xffffff);
        embed.setTimestamp(new Date());
        embed.setThumbnail(interaction.client.user.avatarURL())

        for(let host of statusService.hosts){
            embed.addFields({name: host.name, value: host.alive ? `${process.env.EMOJI_STATUS_ONLINE} Online` : `${process.env.EMOJI_STATUS_OFFLINE} Offline`, inline: false});
        }
        
        await interaction.editReply({embeds: [embed]});
    }
}

export default cmd;