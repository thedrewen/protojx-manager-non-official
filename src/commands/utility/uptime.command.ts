import { ApplicationIntegrationType, ChatInputCommandInteraction, ContainerBuilder, InteractionContextType, MessageFlags, SlashCommandBuilder } from "discord.js";
import { CommandDefinition } from "../../type";
import statusService from "../../services/status.service";

const cmd: CommandDefinition = {
    data: new SlashCommandBuilder()
        .setName('uptime')
        .setDescription('Get more info for a host.')
        .addStringOption((o) =>
            o.setName('service')
                .setDescription('Select a service')
                .setRequired(true)
                .setAutocomplete(true)
        )
        .setIntegrationTypes(
            ApplicationIntegrationType.UserInstall
        )
        .setContexts(
            InteractionContextType.BotDM,
            InteractionContextType.Guild,
            InteractionContextType.PrivateChannel
        ),
    async execute(interaction: ChatInputCommandInteraction) {
        const hostvalue = interaction.options.getString('service');
        const realHost = await statusService.serviceRepo.findOne({where: {name: hostvalue+''}});
        if (!hostvalue || !realHost) {
            await interaction.reply({ content: '⚠️ Host not found !', flags: [MessageFlags.Ephemeral] });
        } else {
            const img = await statusService.getStatusImageBar(realHost.id);

            const container = new ContainerBuilder()
                .setAccentColor(0x0000ed)
                .addTextDisplayComponents((t) => t
                    .setContent(`##  ${realHost.alive ? `${process.env.EMOJI_STATUS_ONLINE}` : `${process.env.EMOJI_STATUS_OFFLINE}`} ${realHost.name}\nService status over 7 days :`)
                )
                .addMediaGalleryComponents((m) =>
                    m.addItems((i) => i.setURL('attachment://uptime.png'))
                );

            await interaction.reply({components: [container], flags: [MessageFlags.IsComponentsV2], files: [{attachment: img, name: 'uptime.png'}]})
        }
    },
    autocompletes: [
        {
            name: 'service',
            execute: async (interaction) => {
                const services = await statusService.serviceRepo.find({order: {id: 'ASC'}});
                interaction.respond(services.map((v) => ({name: v.name, value: v.name})));
            }
        }
    ]
}

export default cmd;