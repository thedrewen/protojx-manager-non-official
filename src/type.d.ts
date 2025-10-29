import { ButtonInteraction, ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";

export type Host = { host: string, name: string, alive: boolean, type: 'ping' | 'website' };
export type CommandDefinition = { data: SlashCommandBuilder, execute: (interaction: ChatInputCommandInteraction) => void, buttons?: { id: string, handle: (interaction: ButtonInteraction) => void}[]};