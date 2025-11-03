import { ApplicationIntegrationType, ChannelType, ContainerBuilder, MessageFlags, PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import { CommandDefinition } from "../../type";
import statusService from "../../services/status.service";
import { AppDataSource } from "../../data-source";
import { Guild } from "../../entity/guild.entity";

const cmd : CommandDefinition = {
    data: new SlashCommandBuilder()
        .setName('live_status')
        .setDescription('Generate a permanent status message that updates every 2 minutes.')
        .addChannelOption((option) => option
            .setName('channel')
            .setDescription('The message will be generated')
            .addChannelTypes(ChannelType.GuildText)
            .setRequired(true)
        )
        .setIntegrationTypes(
            ApplicationIntegrationType.GuildInstall
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    async execute(interaction) {
        await interaction.deferReply({flags: [MessageFlags.Ephemeral]});
        
        const channel_options = await interaction.options.getChannel("channel");
        if(channel_options && interaction.guildId){
            const channel = await interaction.guild?.channels.fetch(channel_options?.id);
            
            if(channel?.isSendable()) {
                let message;
                try {
                    message = await channel.send({components: [statusService.getUpdatedContainer(true)], flags: [MessageFlags.IsComponentsV2]});
                } catch (error) {
                    await interaction.editReply({content: 'An error has occurred. Please check the permissions for the channel.', flags: [MessageFlags.Ephemeral]});
                    return;
                }

                try {
                    const guildRepo = AppDataSource.getRepository(Guild);

                    let guild = await guildRepo.findOne({where: {guild_id: interaction.guildId}});

                    if(guild) {
                        const messageId = guild.persistent_message_id;
                        const channelId = guild.persistent_message_channel_id;

                       try {
                            const beforeChannel = await interaction.guild?.channels.fetch(channelId);
                            if(beforeChannel && beforeChannel.isSendable()) {
                                try {
                                    const beforeMessage = await beforeChannel.messages.fetch(messageId);
                                    const container = new ContainerBuilder()
                                        .addTextDisplayComponents((t) => t.setContent('This message is no longer valid!'));
                                    beforeMessage.edit({components: [container]});
                                } catch (error) {}
                            }
                        } catch (error) {
                        
                       }
                    }else{
                        guild = new Guild();
                        guild.guild_id = interaction.guildId;
                    }
                    
                    guild.persistent_message_channel_id = channel.id;
                    guild.persistent_message_id = message.id;

                    await guildRepo.save(guild);

                    await interaction.editReply('Message successfully generated!')
                } catch (error) {
                    interaction.editReply('An error has occured ! '+error);
                }
            }else{
                interaction.editReply('The selected channel is invalid!');
            }
        }else{
            interaction.editReply('The selected channel is invalid!');
        }
    },
}

export default cmd;