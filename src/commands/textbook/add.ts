// Dependencies
import { ActionRowBuilder, ChatInputCommandInteraction, ModalBuilder, ModalSubmitInteraction, SlashCommandSubcommandBuilder, TextInputBuilder, TextInputStyle } from "discord.js";
import { Textbook } from "../../modules/Textbook.js";
import { DevExecute } from "../../modules/Utilities.js";
import log from "fancy-log"

// Slash Command
export const SlashCommand = new SlashCommandSubcommandBuilder()
    .setName("add")
    .setDescription("Create a new textbook");

//
export const NoDefer = true

//
export function GetModal() {
    // Use a modal to get all of the required data
    const modal = new ModalBuilder()
        .setCustomId("textbookCreate")
        .setTitle("Textbook Create")

    const Subject = new ActionRowBuilder<TextInputBuilder>().addComponents(new TextInputBuilder()
        .setCustomId("textbookSubject")
        .setLabel("Subject")
        .setRequired(true)
        .setStyle(TextInputStyle.Short));
    const Title = new ActionRowBuilder<TextInputBuilder>().addComponents(new TextInputBuilder()
        .setCustomId("textbookTitle")
        .setLabel("Book Title")
        .setRequired(true)
        .setStyle(TextInputStyle.Short));
    const ISBN = new ActionRowBuilder<TextInputBuilder>().addComponents(new TextInputBuilder()
        .setCustomId("textbookISBN")
        .setLabel("ISBN")
        .setRequired(true)
        .setStyle(TextInputStyle.Short));

    // Optional data
    const Link = new ActionRowBuilder<TextInputBuilder>().addComponents(new TextInputBuilder()
        .setCustomId("textbookLink")
        .setLabel("Link to purchase/download")
        .setRequired(false)
        .setStyle(TextInputStyle.Short));

    // Add each actionrow to modal
    modal.addComponents(Subject, Title, ISBN, Link)

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
    const Subject = interaction.fields.getTextInputValue("textbookSubject")
    const Title = interaction.fields.getTextInputValue("textbookTitle")
    const ISBN = interaction.fields.getTextInputValue("textbookISBN")
    const Link = interaction.fields.getTextInputValue("textbookLink")

    // Make sure class does not eixst
    if (await Textbook.get(guildId, ISBN) instanceof Textbook) {
        const Message = `Textbook (${ISBN}) already exists within guild ${guildId}`
        DevExecute(log.error, Message)
        throw(new Error(Message))
    }
        
    // Create the object
    const cclass = new Textbook({
        Guild: guildId,
        Subject,
        Title,
        ISBN,
        Link
    })
    await cclass.add()

    //
    return interaction.reply({
        ephemeral: true,
        content: "Done!"
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
        filter: i => i.user.id === interaction.user.id,
        time: 180000 // 3 minutes
    }).catch(() => {
        throw(new Error("Ran out of time"))
    })

    //
    await ModalCallback(ModalSubmit)
}
