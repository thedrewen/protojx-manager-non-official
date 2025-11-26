import { ButtonInteraction, ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";

export type InfraType = 'website' | 'ryzen' | 'xeon' | 'games' | 'router';
export type CommandDefinition = { data: SlashCommandBuilder | SlashCommandOptionsOnlyBuilder, execute: (interaction: ChatInputCommandInteraction) => void, buttons?: { id: string, handle: (interaction: ButtonInteraction) => void}[]};