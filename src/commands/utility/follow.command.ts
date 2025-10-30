import { ApplicationIntegrationType, ChatInputCommandInteraction, InteractionContextType, MessageFlags, SlashCommandBuilder } from "discord.js";
import { CommandDefinition } from "../../type";
import { AppDataSource } from "../../data-source";
import { Follow } from "../../entity/follow.entity";

const cmd : CommandDefinition = {
    data: new SlashCommandBuilder()
        .setName('follow')
        .setDescription('Enables/disables the receipt of service status notifications.')
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
        const userRepo = AppDataSource.getRepository(Follow);

        let follow = await userRepo.findOne({where: {user_discord: interaction.user.id}});
        if(!follow) {
            follow = new Follow();
            follow.user_discord = interaction.user.id;
            await userRepo.save(follow);
        }
        
        follow.enable = !follow.enable;

        await userRepo.save(follow);

        await interaction.reply({content: `✅ Notification successfully ${follow.enable ? 'enabled 🔔' : 'disabled 🔕'}!`, flags: [MessageFlags.Ephemeral]});

        if(follow.enable) {
            await interaction.user.send({content: '🔔 Notifications have been successfully enabled! To disable: /follow'})
        }
    }
}

export default cmd;