// Dependencies
import { ChatInputCommandInteraction, SlashCommandSubcommandBuilder } from "discord.js";
import { Textbook } from "../../modules/Textbook.js";
import log from "fancy-log"
import { DevExecute } from "../../modules/Utilities.js";

// Slash Command
export const SlashCommand = new SlashCommandSubcommandBuilder()
    .setName("remove")
    .setDescription("Remove a textbook")
    .addStringOption(input => input
        .setName("isbn")
        .setDescription("The textbook's ISBN number")
        .setRequired(true)    
    )
    .addIntegerOption(input => input
        .setName("count")
        .setDescription("The amount of results to remove")
        .setMinValue(1)
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
    const RemoveCount = interaction.options.getInteger("count", true)

    // Check the class exists
    const textbooks = await Textbook.get(guildId, ISBN)
    if (typeof(textbooks) == "string") {
        DevExecute(log.error, textbooks)
        throw(new Error(textbooks))
    }

    // Remove
    const CappedCount = RemoveCount > textbooks.length ? textbooks.length : RemoveCount
    for (let i = 0; i < CappedCount; i++) {
        await textbooks[i].remove()
    }

    //
    return interaction.editReply("Done!")
}