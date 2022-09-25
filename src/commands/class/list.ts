// Dependencies
import { ChatInputCommandInteraction, SlashCommandSubcommandBuilder } from "discord.js";
import { Class } from "../../modules/Class.js";
import { DevExecute, getBaseEmbed, PaginationEmbed } from "../../modules/Utilities.js";
import log from "fancy-log"

// Slash Command
export const SlashCommand = new SlashCommandSubcommandBuilder()
    .setName("list")
    .setDescription("List the available classes");

//
export async function Callback(interaction: ChatInputCommandInteraction) {
    // Make sure we have the guild
    const guild = interaction.guild
    if (!guild) {
        const Message = "Could not grab guild"
        throw (new Error(Message))
    }
    const guildId = guild.id

    // Grab the classes
    const classes = await Class.list(guildId)
    if (classes.length == 0) {
        const Message = "No classes found in guild " + guildId
        throw (new Error(Message))
    }
    DevExecute(log.info, `Got classes (${classes.length}) from guild ${guildId}`)

    // Create the pages
    const Pages = []
    for (let i = 0; i < classes.length; i++) {
        const cclass = classes[i]

        Pages.push(
            getBaseEmbed(interaction.user, "Success")
                .setTitle(cclass.Code)
                .addFields(
                    {name: "Subject", value: cclass.Subject, inline: false},
                    {name: "Teacher", value: cclass.Teacher || "N/A", inline: false},
                    {name: "Room", value: cclass.Room || "N/A", inline: false}
                )
        )
    }

    // Pages
    await PaginationEmbed(interaction, Pages)
}
