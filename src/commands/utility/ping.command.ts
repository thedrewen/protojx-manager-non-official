import { ApplicationIntegrationType, ButtonInteraction, ButtonStyle, ChatInputCommandInteraction, CommandInteraction, ComponentType, ContainerBuilder, InteractionContextType, MessageFlags, SlashCommandBuilder } from "discord.js";

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

        const container = new ContainerBuilder()
            .addTextDisplayComponents((textDisplay) => textDisplay.setContent(`🏓 Latency is ${Date.now() - interaction.createdTimestamp}ms. API Latency : ${interaction.client.ws.ping}ms`))
            .addSeparatorComponents((s) => s)
            .addSectionComponents((section) => 
                section
                    .addTextDisplayComponents((textDisplay) =>
                        textDisplay
                            .setContent('Oh, that\'s a beautiful button!')
                    )
                    .setButtonAccessory((button) => 
                        button
                            .setCustomId('testClick')
                            .setLabel('Click Me !')
                            .setStyle(ButtonStyle.Success)
                    )
            )

        // await interaction.reply();
        await interaction.reply({
                components: [container],
                flags: MessageFlags.IsComponentsV2
        })
    },
    buttons: [
        {id: 'testClick', handle: (interaction : ButtonInteraction) => {
            interaction.reply({content: 'Ho !', flags: [MessageFlags.Ephemeral]})
        }}
    ]
}