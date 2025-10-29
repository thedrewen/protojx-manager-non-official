import { ApplicationIntegrationType, ChatInputCommandInteraction, CommandInteraction, InteractionContextType, SlashCommandBuilder } from "discord.js";

export default {
    data: new SlashCommandBuilder()
        .setName('ping')
        .setDescription('Pong again!')
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
        await interaction.reply(`🏓 Latency is ${Date.now() - interaction.createdTimestamp}ms. API Latency : ${interaction.client.ws.ping}ms`);
    }
}