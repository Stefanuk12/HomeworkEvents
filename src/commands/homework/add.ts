// Dependencies
import { ActionRowBuilder, ChatInputCommandInteraction, GuildScheduledEventEntityType, GuildScheduledEventPrivacyLevel, ModalBuilder, ModalSubmitInteraction, SlashCommandSubcommandBuilder, TextInputBuilder, TextInputStyle } from "discord.js";
import config from "../../config.js";
import { Class } from "../../modules/Class.js";
import { Textbook } from "../../modules/Textbook.js";
import { DevExecute } from "../../modules/Utilities.js";
import log from "fancy-log"

// Slash Command
export const SlashCommand = new SlashCommandSubcommandBuilder()
    .setName("add")
    .setDescription("Create a new homework event");

//
export const NoDefer = true

//
export function GetModal() {
    // Use a modal to get all of the required data
    const modal = new ModalBuilder()
        .setCustomId("homeworkModal")
        .setTitle("Homework Create");

    const Class = new ActionRowBuilder<TextInputBuilder>().addComponents(new TextInputBuilder()
        .setCustomId("homeworkClass")
        .setLabel("Class Code")
        .setRequired(true)
        .setStyle(TextInputStyle.Short));
    const Title = new ActionRowBuilder<TextInputBuilder>().addComponents(new TextInputBuilder()
        .setCustomId("homeworkTitle")
        .setLabel("Title")
        .setRequired(true)
        .setStyle(TextInputStyle.Short));
    const DueIn = new ActionRowBuilder<TextInputBuilder>().addComponents(new TextInputBuilder()
        .setCustomId("homeworkDue")
        .setLabel("How many days until due?")
        .setRequired(true)
        .setStyle(TextInputStyle.Short));
    const Request = new ActionRowBuilder<TextInputBuilder>().addComponents(new TextInputBuilder()
        .setCustomId("homeworkRequest")
        .setLabel("What have you been asked to do, in detail?")
        .setRequired(true)
        .setStyle(TextInputStyle.Paragraph));

    // Optional data
    const textbook = new ActionRowBuilder<TextInputBuilder>().addComponents(new TextInputBuilder()
        .setCustomId("homeworkISBN")
        .setLabel("Textbook ISBN")
        .setMaxLength(13)
        .setRequired(false)
        .setStyle(TextInputStyle.Short));

    // Add each actionrow to modal
    modal.addComponents(Class, Title, DueIn, Request, textbook)

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
    const ClassCode = interaction.fields.getTextInputValue("homeworkClass")
    const Title = interaction.fields.getTextInputValue("homeworkTitle")
    const strDueIn = interaction.fields.getTextInputValue("homeworkDue")
    const Request = interaction.fields.getTextInputValue("homeworkRequest")
    const ISBN = interaction.fields.getTextInputValue("homeworkISBN")
    const ShouldUseTextbook = ISBN.length != 0

    // Vars
    const DueIn = parseInt(strDueIn)

    // Check due in
    if (isNaN(DueIn)) {
        const Message = "Invalid due in (NaN)"
        DevExecute(log.error, Message)
        throw(new Error(Message))
    } else if (DueIn < 0) {
        const Message = "Invalid due in (negative)"
        DevExecute(log.error, Message)
        throw(new Error(Message))
    }

    // Grab class data
    const Classes = await Class.get(guildId, ClassCode)
    if (typeof(Classes) == "string") {
        DevExecute(log.error, Classes)
        throw(new Error(Classes))
    }
    const ClassData = Classes[0]

    // Grab textbook
    let textbook
    if (ShouldUseTextbook) {
        textbook = await Textbook.get(guildId, ISBN)
        if (typeof(textbook) == "string") {
            DevExecute(log.error, textbook)
            throw(new Error(textbook))
        }
        textbook = textbook[0]
    }

    // Parse the description
    const Description = config.Description
        .replaceAll("%CLASSSUBJECT%", ClassData.Subject)
        .replaceAll("%CLASSCODE%", ClassData.Code)
        .replaceAll("%CLASSTEACHER%", ClassData.Teacher || "N/A")
        .replaceAll("%CLASSROOM%", ClassData.Room || "N/A")
        .replaceAll("%TEXTBOOKTITLE%", textbook?.Title || "N/A")
        .replaceAll("%TEXTBOOKLINK%", textbook?.Link || "https://google.com/")
        .replaceAll("%REQUEST%", Request);

    // Calculate the dates
    let Start = new Date()
    if (DueIn != 0) {
        Start.setDate(Start.getDate() + DueIn)
        Start.setHours(8, 0, 0, 0)
    } else {
        Start.setMinutes(Start.getMinutes() + 1)
    }
    const End = new Date(Start)
    End.setHours(23, 59, 59, 99)

    // Create the event
    await guild.scheduledEvents.create({
        name: `${ClassCode} | ${Title}`,
        scheduledStartTime: Start,
        scheduledEndTime: End,
        privacyLevel: GuildScheduledEventPrivacyLevel.GuildOnly,
        entityType: GuildScheduledEventEntityType.External,
        description: Description,
        entityMetadata: {
            location: "School"
        }
    })

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