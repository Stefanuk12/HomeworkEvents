// Dependencies
import { ChatInputCommandInteraction, EmbedBuilder, SlashCommandSubcommandBuilder } from "discord.js";
import { Textbook } from "../../modules/Textbook.js";
import { DevExecute, getBaseEmbed, PaginationEmbed } from "../../modules/Utilities.js";
import log from "fancy-log"

// Slash Command
export const SlashCommand = new SlashCommandSubcommandBuilder()
    .setName("list")
    .setDescription("List the available textbooks");

//
export async function Callback(interaction: ChatInputCommandInteraction) {
    // Make sure we have the guild
    const guild = interaction.guild
    if (!guild) {
        const Message = "Could not grab guild"
        throw (new Error(Message))
    }
    const guildId = guild.id

    // Grab the textbooks
    const textbooks = await Textbook.list(guildId)
    DevExecute(log.info, `Got textbooks (${textbooks.length}) from guild ${guildId}`)

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
