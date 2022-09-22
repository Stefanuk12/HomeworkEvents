// Dependencies
import { ActionRowBuilder, ChatInputCommandInteraction, GuildScheduledEventEntityType, GuildScheduledEventPrivacyLevel, ModalBuilder, ModalSubmitInteraction, SlashCommandSubcommandBuilder, TextInputBuilder, TextInputStyle } from "discord.js";
import config from "../../config.js";
import { Class } from "../../modules/Class.js";
import { Textbook } from "../../modules/Textbook.js";

// Slash Command
export const SlashCommand = new SlashCommandSubcommandBuilder()
    .setName("add")
    .setDescription("Create a new homework event");

//
export function GetHomeworkAddModal() {
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
        .setRequired(false)
        .setStyle(TextInputStyle.Paragraph));

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

    // Type checks
    const ShouldUseTextbook = ISBN != "N/A"
    if (isNaN(parseInt(strDueIn))) {
        const Message = "Invalid due date (not a number)"
        throw(new Error(Message))
    }

    // Vars
    const DueIn = parseInt(strDueIn)

    // Grab class data
    const ClassData = await Class.get(guildId, ClassCode)
    if (!ClassData) {
        const Message = "Invalid class code (does not exist)"
        throw(new Error(Message))
    }
        

    // Grab textbook
    let textbook
    if (ShouldUseTextbook) {
        textbook = await Textbook.get(guildId, ISBN)
        if (!textbook) {
            const Message = "Invalid textbook ISBN (does not exist)"
            throw(new Error(Message))
        }
    }

    // Parse the description
    const Description = config.Description
    Description.replaceAll("%CLASSSUBJECT%", ClassData.Subject)
    Description.replaceAll("%CLASSCODE%", ClassData.Code)
    Description.replaceAll("%CLASSTEACHER%", ClassData.Teacher || "N/A")
    Description.replaceAll("%CLASSROOM%", ClassData.Room || "N/A")
    Description.replaceAll("%TEXTBOOKTITLE%", textbook?.Title || "N/A")
    Description.replaceAll("%TEXTBOOKLINK%", textbook?.Link || "https://google.com/")
    Description.replaceAll("%REQUEST%", Request)

    // Create
    const Now = new Date()
    const Start = Now.getDay()
    const End = Now.setDate(Start + DueIn)
    await guild.scheduledEvents.create({
        name: `${ClassCode}: ${Title}`,
        scheduledStartTime: Start,
        scheduledEndTime: End,
        privacyLevel: GuildScheduledEventPrivacyLevel.GuildOnly,
        entityType: GuildScheduledEventEntityType.External,
        description:Description
    })

    //
    return interaction.editReply("Done!")
}

//
export async function Callback(interaction: ChatInputCommandInteraction) {
    // Grab the modal
    const modal = GetHomeworkAddModal()

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