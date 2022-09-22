// Dependencies
import { ChatInputCommandInteraction, SlashCommandSubcommandBuilder } from "discord.js";
import { Class } from "../../modules/Class.js";

// Slash Command
export const SlashCommand = new SlashCommandSubcommandBuilder()
    .setName("remove")
    .setDescription("Remove a class")
    .addStringOption(input => input
        .setName("code")
        .setDescription("The class code")
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
    const Code = interaction.options.getString("code", true)

    // Check the class exists
    const cclass = await Class.get(guildId, Code)
    if (!cclass) {
        const Message = `Class ${Code} does not exist within guild ${guildId}`
        throw(new Error(Message))
    }

    // Remove
    await cclass.remove()

    //
    return interaction.editReply("Done!")
}