// Dependencies
import { ChatInputCommandInteraction, SlashCommandSubcommandBuilder } from "discord.js";
import { Textbook, TextbookSearchAttributes } from "../../modules/Textbook.js";
import { DevExecute, getBaseEmbed, PaginationEmbed } from "../../modules/Utilities.js";
import log from "fancy-log"

// Slash Command
export const SlashCommand = new SlashCommandSubcommandBuilder()
    .setName("get")
    .setDescription("Grab a textbook")
    .addStringOption(input => input
        .setName("type")
        .setDescription("The search term type")
        .setChoices(
            ...TextbookSearchAttributes.map((value, _index, _arr) => {
                return {
                    name: value, value: value, inline: false
                }
            })
        )    
        .setRequired(true)
    )
    .addStringOption(input => input
        .setName("value")
        .setDescription("The search term value")
        .setRequired(true)    
    );

//
export async function Callback(interaction: ChatInputCommandInteraction) {
    // Make sure we have the guild
    const guild = interaction.guild
    if (!guild) {
        const Message = "Could not grab guild"
        throw(new Error(Message))
    }
    const guildId = guild.id

    // Vars
    const Type = <keyof Textbook>interaction.options.getString("type", true)
    const Value = interaction.options.getString("value", true)

    // Check the textbook exists (with search term)
    const textbooks = await Textbook.getOf(guildId, Type, Value)
    if (typeof(textbooks) == "string") {
        DevExecute(log.error, textbooks)
        throw(new Error(textbooks))
    }

    // Create the pages
    const Pages = []
    for (let i = 0; i < textbooks.length; i++) {
        const textbook = textbooks[i]

        Pages.push(
            getBaseEmbed(interaction.user, "Success")
                .setTitle(textbook.Title)
                .addFields(
                    {name: "Subject", value: textbook.Subject, inline: false},
                    {name: "ISBN", value: textbook.ISBN, inline: false},
                    {name: "Link", value: textbook.Link || "N/A", inline: false}
                )
        )
    }

    // Pages
    await PaginationEmbed(interaction, Pages)
}