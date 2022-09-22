// Dependencies
import { ActionRowBuilder, ChatInputCommandInteraction, ModalBuilder, ModalSubmitInteraction, SlashCommandSubcommandBuilder, TextInputBuilder, TextInputStyle } from "discord.js";
import { Class } from "../../modules/Class.js";
import log from "fancy-log"
import { DevExecute } from "../../modules/Utilities.js";

// Slash Command
export const SlashCommand = new SlashCommandSubcommandBuilder()
    .setName("add")
    .setDescription("Create a new class");

//
export const NoDefer = true

//
export function GetModal() {
    // Use a modal to get all of the required data
    const modal = new ModalBuilder()
        .setCustomId("classModal")
        .setTitle("Class Create")

    const Subject = new ActionRowBuilder<TextInputBuilder>().addComponents(new TextInputBuilder()
        .setCustomId("classSubject")
        .setLabel("Subject")
        .setRequired(true)
        .setStyle(TextInputStyle.Short));
    const Code = new ActionRowBuilder<TextInputBuilder>().addComponents(new TextInputBuilder()
        .setCustomId("classCode")
        .setLabel("Code Identifier")
        .setRequired(true)
        .setStyle(TextInputStyle.Short));

    // Optional data
    const Teacher = new ActionRowBuilder<TextInputBuilder>().addComponents(new TextInputBuilder()
        .setCustomId("classTeacher")
        .setLabel("Teacher")
        .setRequired(false)
        .setStyle(TextInputStyle.Short));
    const Room = new ActionRowBuilder<TextInputBuilder>().addComponents(new TextInputBuilder()
        .setCustomId("classRoom")
        .setLabel("Room")
        .setRequired(false)
        .setStyle(TextInputStyle.Short));

    // Add each actionrow to modal
    modal.addComponents(Subject, Code, Teacher, Room)

    // Return
    return modal
}

//
export async function ModalCallback(interaction: ModalSubmitInteraction) {
    // Make sure we have the guild
    const guild = interaction.guild
    if (!guild) {
        const Message = "Could not grab guild"
        throw(new Error(Message))
    }
    const guildId = guild.id

    // Get the data
    const Subject = interaction.fields.getTextInputValue("classSubject")
    const Code = interaction.fields.getTextInputValue("classCode")
    const Teacher = interaction.fields.getTextInputValue("classTeacher")
    const Room = interaction.fields.getTextInputValue("classRoom")

    // Make sure class does not exist
    if (await Class.get(guildId, Code)) {
        const Message = `Class (${Code}) already exists within guild ${guildId}`
        DevExecute(log.info, Message)
        throw(new Error(Message))
    }

    // Create the object
    const cclass = new Class({
        Guild: guildId,
        Subject,
        Code,
        Teacher,
        Room
    })
    await cclass.add()

    //
    return interaction.reply({
        content: "Done!",
        ephemeral: true
    })
}

//
export async function Callback(interaction: ChatInputCommandInteraction) {
    // Grab the modal
    const modal = GetModal()

    // Show it
    await interaction.showModal(modal)

    // Wait for a submit
    const ModalSubmit = await interaction.awaitModalSubmit({
        time: 60000
    })

    // catch timeout

    //
    await ModalCallback(ModalSubmit)
}
