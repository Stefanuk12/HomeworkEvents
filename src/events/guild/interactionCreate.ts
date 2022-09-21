// Dependencies
import { ButtonInteraction, ChatInputCommandInteraction, ContextMenuCommandInteraction } from "discord.js"
import { client } from "../../index.js"
import * as events from "events"
import CommandInteractionListener, { ContextInteractionListener } from "slashcommandhandler"

// Vars
export const EventHandler = new events.EventEmitter()

//
async function handleCommandInteration(interaction: ChatInputCommandInteraction) {
    if (await CommandInteractionListener(interaction))
        EventHandler.emit("onCommandInteract", interaction)
}

//
function handleButtonInteraction(interaction: ButtonInteraction) {
    EventHandler.emit("onButtonInteract", interaction)
}

//
async function handleContextCommandInteraction(interaction: ContextMenuCommandInteraction) {
    if (await ContextInteractionListener(interaction))
        EventHandler.emit("onContextCommandInteract", interaction)
}

//
client.on("interactionCreate", async (interaction) => {
    // Make sure it is a command
    if (interaction.isCommand() && interaction.isChatInputCommand()){
        return await handleCommandInteration(interaction)
    } 

    // Make sure it is a button
    if (interaction.isButton()){
        return handleButtonInteraction(interaction)
    }

    // Make sure it is a context command
    if (interaction.isContextMenuCommand())
        return await handleContextCommandInteraction(interaction)
})