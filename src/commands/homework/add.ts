// Dependencies
import { ComponentType, ActionRowBuilder, ChatInputCommandInteraction, GuildScheduledEventEntityType, GuildScheduledEventPrivacyLevel, ModalBuilder, ModalSubmitInteraction, SelectMenuBuilder, SlashCommandSubcommandBuilder, TextInputBuilder, TextInputStyle } from "discord.js";
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
    const useTextboook = new ActionRowBuilder<TextInputBuilder>().addComponents(new TextInputBuilder()
        .setCustomId("homeworkUseTB")
        .setLabel("Do you want to specify a textbook? (1/0)")
        .setMaxLength(1)
        .setRequired(false)
        .setValue("0")
        .setStyle(TextInputStyle.Short));

    // Add each actionrow to modal
    modal.addComponents(Title, DueIn, Request, useTextboook)

    // Return
    return modal
}

//
export async function ModalCallback(interaction: ModalSubmitInteraction) {
    // Make sure we have the guild
    const guild = interaction.guild
    if (!guild) {
        const Message = "Could not grab guild"
        throw (new Error(Message))
    }
    const guildId = guild.id

    // Get the data
    const Title = interaction.fields.getTextInputValue("homeworkTitle")
    const strDueIn = interaction.fields.getTextInputValue("homeworkDue")
    const Request = interaction.fields.getTextInputValue("homeworkRequest")
    const ShouldUseTextbook = interaction.fields.getTextInputValue("homeworkUseTB") == "1"

    // Grab the class code
    let ClassCode: string
    {
        // Grab our classes
        const classes = await Class.list(guildId)
        const class_options = classes.map(cclass => {
            return {
                label: `${cclass.Subject} | ${cclass.Teacher || "No Teacher"}`,
                description: cclass.Room || "No Class",
                value: cclass.Code,
            }
        })

        // Prompt the user for the code
        const row = new ActionRowBuilder<SelectMenuBuilder>()
            .addComponents(
                new SelectMenuBuilder()
                    .setCustomId("homeworkClass")
                    .setPlaceholder("Select a Class")
                    .addOptions(...class_options)
            );
        const message = await interaction.reply({
            ephemeral: true,
            content: "Please select a class to assign to",
            components: [row],
            fetchReply: true
        })

        // Grab the response
        const Response = await message.awaitMessageComponent({
            filter: (i) => {
                i.deferUpdate()
                return i.user.id === interaction.user.id
            },
            time: 60000,
            componentType: ComponentType.SelectMenu,
        }).catch(_ => {
            throw (new Error("Timed out."))
        })

        // Set
        ClassCode = Response.values[0]

        // Make sure is defined
        if (!ClassCode) {
            const Message = "Did not recieve class code"
            throw (new Error(Message))
        }
    }

    // Grab the textbook
    let ISBN: string | undefined
    if (ShouldUseTextbook) {
        // Grab our classes
        const textbooks = await Textbook.list(guildId)
        const textbook_options = textbooks.map(textbook => {
            return {
                label: textbook.Title,
                description: textbook.Subject,
                value: textbook.ISBN,
            }
        })

        // Prompt the user for the textbook
        const row = new ActionRowBuilder<SelectMenuBuilder>()
            .addComponents(
                new SelectMenuBuilder()
                    .setCustomId("homeworkISBN")
                    .setPlaceholder("Select a Textbook")
                    .addOptions(...textbook_options)
            );
        const message = await interaction.editReply({
            content: "Please select a textbook",
            components: [row]
        })

        // Grab the response
        const Response = await message.awaitMessageComponent({
            filter: (i) => {
                i.deferUpdate()
                return i.user.id === interaction.user.id
            },
            time: 60000,
            componentType: ComponentType.SelectMenu
        }).catch(err => {
            throw (new Error("Timed out."))
        })

        // Set
        ISBN = Response.values[0]

        // Make sure is defined
        if (!ISBN) {
            const Message = "Did not recieve class code"
            throw (new Error(Message))
        }
    }

    // Vars
    const DueIn = parseInt(strDueIn)

    // Check due in
    if (isNaN(DueIn)) {
        const Message = "Invalid due in (NaN)"
        DevExecute(log.error, Message)
        throw (new Error(Message))
    } else if (DueIn < 0) {
        const Message = "Invalid due in (negative)"
        DevExecute(log.error, Message)
        throw (new Error(Message))
    }

    // Grab class data
    const Classes = await Class.get(guildId, ClassCode)
    if (typeof (Classes) == "string") {
        DevExecute(log.error, Classes)
        throw (new Error(Classes))
    }
    const ClassData = Classes[0]

    // Grab textbook
    let textbook
    if (ShouldUseTextbook && ISBN) {
        textbook = await Textbook.get(guildId, ISBN)
        if (typeof (textbook) == "string") {
            DevExecute(log.error, textbook)
            throw (new Error(textbook))
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
    return interaction.editReply({
        content: "Done!",
        components: []
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
        throw (new Error("Ran out of time"))
    })

    //
    await ModalCallback(ModalSubmit)
}
