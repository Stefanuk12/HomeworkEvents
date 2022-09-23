// Dependencies
import { Client, IntentsBitField } from 'discord.js'
import config from './config.js'

// Create the client
export const client = new Client({
    intents: [IntentsBitField.Flags.Guilds]
})

// Start
import("./handlers/events.js")

// Login
client.login(process.env.BOT_TOKEN || config.BotConfig.Token)
