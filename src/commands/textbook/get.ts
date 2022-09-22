// Dependencies
import { ChatInputCommandInteraction, SlashCommandSubcommandBuilder } from "discord.js";
import { Textbook } from "../../modules/Textbook.js";
import { getBaseEmbed } from "../../modules/Utilities.js";

// Slash Command
export const SlashCommand = new SlashCommandSubcommandBuilder()
    .setName("get")
    .setDescription("Grab a textbook by its ISBN number")
    .addStringOption(input => input
        .setName("isbn")
        .setDescription("The textbook's ISBN number")
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

    // Grab the code
    const ISBN = interaction.options.getString("isbn", true)

    // Check the class exists
    const textbook = await Textbook.get(guildId, ISBN)
    if (!textbook) {
        const Message = `Textbook ${ISBN} does not exist within guild ${guildId}`
        throw(new Error(Message))
    }

    //
    const embed = getBaseEmbed(interaction.user, "Success")
        .addFields(
            {name: "Subject", value: textbook.Subject, inline: true},
            {name: "Title", value: textbook.Title, inline: true},
            {name: "Link", value: textbook.Link || "N/A Link", inline: false}
        )
    return interaction.editReply({
        embeds: [embed]
    })
}