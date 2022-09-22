// Dependencies
import { Client, IntentsBitField } from 'discord.js'
import config from './config.js'

// Create the client
export const client = new Client({
    intents: [IntentsBitField.Flags.Guilds]
})

// Start
import("./handlers/events.js")

// List of token sources
let token_sources = [
    config.BotConfig.Token,
    process.env.TOKEN, // Fallback to environment variable if available
]

// Get token
let token = ""
for (let i = 0; i < token_sources.length; i++) {
    const source = token_sources[i];

    if (source !== undefined && source !== "") {
        token = source
        break
    }
}

// Login
client.login(token)
