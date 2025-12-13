import { ApplicationIntegrationType, ChatInputCommandInteraction, InteractionContextType, MessageFlags, SlashCommandBuilder } from "discord.js";
import { CommandDefinition } from "../../type";
import { AppDataSource } from "../../data-source";
import { Follow } from "../../entity/follow.entity";
import statusService from "../../services/status.service";

const cmd: CommandDefinition = {
    data: new SlashCommandBuilder()
        .setName('follow')
        .setDescription('Enables/disables the receipt of service status notifications.')
        .addStringOption((o) =>
            o.setName('service')
                .setDescription('Select a service to follow')
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
        const userRepo = AppDataSource.getRepository(Follow);
        const hostvalue = interaction.options.getString('service');

        const services = await statusService.serviceRepo.find();
        const realHost = services.find((v) => v.notify && v.name == hostvalue);

        if (!hostvalue || !realHost) {
            await interaction.reply({ content: '⚠️ Host not found !', flags: [MessageFlags.Ephemeral] });
        } else {
            let follow = await userRepo.findOne({ where: { user_discord: interaction.user.id, service: { id: realHost.id } } });
            if (!follow) {
                follow = new Follow();
                follow.user_discord = interaction.user.id;
                follow.service = realHost;
                await userRepo.save(follow);
            }

            follow.enable = !follow.enable;

            await userRepo.save(follow);

            await interaction.reply({ content: `✅ Notification successfully ${follow.enable ? 'enabled 🔔' : 'disabled 🔕'} for ${realHost.name}!`, flags: [MessageFlags.Ephemeral] });

            if (follow.enable) {
                await interaction.user.send({ content: `🔔 Notifications have been successfully enabled for ${realHost.name} ! To disable: /follow host:${realHost.name}` })
            }
        }
    },
    autocompletes: [
        {
            name: 'service',
            execute: async (interaction) => {

                const services = await statusService.serviceRepo.find({where: {notify: true}});

                interaction.respond(services.map((v) => ({name: v.name, value: v.name})));
            }
        }
    ]
}

export default cmd;