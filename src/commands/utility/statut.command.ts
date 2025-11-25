import { ApplicationIntegrationType, AttachmentBuilder, ChatInputCommandInteraction, InteractionContextType, MessageFlags, SlashCommandBuilder } from "discord.js";
import statusService from "../../services/status.service";
import { CommandDefinition} from "../../type";

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
        let status = await statusService.getStatusImageBar('154.16.254.10');
        const attachment = new AttachmentBuilder(status, {name: 'status.png'});
        await interaction.editReply({components: [await statusService.getUpdatedContainer()], flags: MessageFlags.IsComponentsV2, files: [attachment]});
    }
}

export default cmd;