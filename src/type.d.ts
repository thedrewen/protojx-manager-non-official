import { ButtonInteraction, ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";

export type InfraType = 'website' | 'ryzen' | 'xeon' | 'games';
export type Host = {
    host: string,
    name: string,
    alive: boolean, 
    ping_type: 'ping' | 'website',
    type: InfraType,
    notify: boolean;
};
export type CommandDefinition = { data: SlashCommandBuilder | SlashCommandOptionsOnlyBuilder, execute: (interaction: ChatInputCommandInteraction) => void, buttons?: { id: string, handle: (interaction: ButtonInteraction) => void}[]};