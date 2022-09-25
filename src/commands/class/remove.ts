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
    const Code = interaction.options.getString("code", true)
    const RemoveCount = interaction.options.getInteger("count", true)

    // Check the class exists
    const classes = await Class.get(guildId, Code)
    if (typeof(classes) == "string") {
        throw(new Error(classes))
    }

    // Remove
    const CappedCount = RemoveCount > classes.length ? classes.length : RemoveCount
    for (let i = 0; i < CappedCount; i++) {
        await classes[i].remove()
    }

    //
    return interaction.editReply("Done!")
}