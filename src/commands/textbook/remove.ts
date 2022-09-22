// Dependencies
import { ChatInputCommandInteraction, SlashCommandSubcommandBuilder } from "discord.js";
import { Textbook } from "../../modules/Textbook.js";

// Slash Command
export const SlashCommand = new SlashCommandSubcommandBuilder()
    .setName("remove")
    .setDescription("Remove a textbook")
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

    // Remove
    await textbook.remove()

    //
    return interaction.editReply("Done!")
}