import { ApplicationIntegrationType, ChatInputCommandInteraction, InteractionContextType, MessageFlags, SlashCommandBuilder } from "discord.js";
import { CommandDefinition } from "../../type";
import { AppDataSource } from "../../data-source";
import { Follow } from "../../entity/follow.entity";
import statusService from "../../services/status.service";

const cmd : CommandDefinition = {
    data: new SlashCommandBuilder()
        .setName('follow')
        .setDescription('Enables/disables the receipt of service status notifications.')
        .setIntegrationTypes(
            ApplicationIntegrationType.UserInstall
        )
        .setContexts(
            InteractionContextType.BotDM,
            InteractionContextType.Guild,
            InteractionContextType.PrivateChannel
        )
        .addStringOption((option) => 
            option
            .setRequired(true)
            .addChoices(...statusService.hosts.filter((v) => v.notify).map((s) => ({name: s.name, value: s.host})))
            .setName('host')
            .setDescription('Host enable/disable.')
        ),
    async execute(interaction : ChatInputCommandInteraction) {
        const userRepo = AppDataSource.getRepository(Follow);
        const hostvalue = interaction.options.getString('host');

        const realHost = statusService.hosts.filter((v) => v.host == hostvalue);
        if(!hostvalue || realHost.length == 0) {
            await interaction.reply({content: '⚠️ Host not found !', flags: [MessageFlags.Ephemeral]});
        }else{
            let follow = await userRepo.findOne({where: {user_discord: interaction.user.id, host: hostvalue}});
            if(!follow) {
                follow = new Follow();
                follow.user_discord = interaction.user.id;
                follow.host = hostvalue;
                await userRepo.save(follow);
            }
            
            follow.enable = !follow.enable;

            await userRepo.save(follow);

            await interaction.reply({content: `✅ Notification successfully ${follow.enable ? 'enabled 🔔' : 'disabled 🔕'} for ${realHost[0]?.name}!`, flags: [MessageFlags.Ephemeral]});

            if(follow.enable) {
                await interaction.user.send({content: `🔔 Notifications have been successfully enabled for ${realHost[0]?.name} ! To disable: /follow host:${realHost[0]?.name}`})
            }
        }
    }
}

export default cmd;