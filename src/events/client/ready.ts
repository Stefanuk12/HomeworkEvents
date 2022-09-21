// Dependencies
import { client } from "../../index.js"
import { Client, Snowflake, SlashCommandBuilder, ContextMenuCommandBuilder } from 'discord.js'
import { GetContextCommands, GetSlashCommands, InitialiseCommands } from "slashcommandhandler"
import log from "fancy-log"

// Delete all current commands
export async function DeleteCommands(Client: Client, guildId?: Snowflake){
    // Make sure the client is ready
    if (!Client.isReady()){
        let error = new Error("Client is not ready yet")
        throw(error)
    }

    // Vars
    let CommandManager = Client.application.commands;
    await (await Client.application.commands.fetch()).find(c => c.name == "name")?.delete()
    // Delete all existing commands
    let Commands = await CommandManager.fetch()
    for (const [_, command] of Commands){
        await command.delete()
    }
    
    // Make sure we were given the guild id
    if (guildId) {
        // Get the guild
        let guild = await client.guilds.fetch(guildId)

        // Make sure it exists
        if (guild) {
            // Delete each command
            let GuildCommands = await CommandManager.fetch({
                guildId: guildId
            })
            for (const [_, command] of GuildCommands){
                await command.delete()
            }
        }
    }
}

// Initialise
async function initialise(Client: Client, allSlashCommands: SlashCommandBuilder[], allContextCommands: ContextMenuCommandBuilder[], guildId?: Snowflake, Delete: boolean = false, Create: boolean = false){
    // Make sure the client is ready
    if (!Client.isReady()){
        let error = new Error("Client is not ready yet")
        throw(error)
    }

    // Vars
    let CommandManager = Client.application.commands

    // Delete commands
    if (Delete){
        log.warn("Deleting slash commands...")
        await DeleteCommands(Client, guildId)
        log.info("Deleted slash commands.")
    }

    // Add commands
    if (Create) {
        let Commands = []
        log.warn("Initialising slash commands...")
        for (const SlashCommand of allSlashCommands){
            // Vars
            const result = await CommandManager.create(SlashCommand, guildId)

            // Add
            Commands.push(result)
        }
        log.info("Initialised slash commands")
        log.warn("Initialising context commands...")
        for (const ContextCommands of allContextCommands){
            // Add it
            const result = await CommandManager.create(ContextCommands, guildId)

            // Add
            Commands.push(result)
        }
        log.info("Initialised context commands")
    }
}

//
client.on("ready", async () => {
    //
    log.info("Client is ready")
    log.warn("Bot starting...")

    //
    log.warn("Parsing all slash commands...")

    const CommandsPath = new URL("../../commands", import.meta.url).pathname.substring(process.platform == "win32" ? 1 : 0)
    await InitialiseCommands(CommandsPath, CommandsPath, true)
    
    log.info("Parsed all slash commands")

    //
    log.warn("Getting all slash commands...")
    const allSlashCommands = GetSlashCommands()
    log.info("Got all slash commands")
    log.warn("Getting all context commands...")
    const allContextCommands = GetContextCommands()
    log.info("Got all context commands")

    // Initialise all the functions
    await initialise(client, allSlashCommands, allContextCommands, undefined, false, true)

    //
    log.info("Bot ready!")
})