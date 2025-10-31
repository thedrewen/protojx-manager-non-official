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
        await interaction.editReply({components: [statusService.getUpdatedContainer()], flags: MessageFlags.IsComponentsV2});
    }
}

export default cmd;