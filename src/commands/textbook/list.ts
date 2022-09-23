// Dependencies
import { ChatInputCommandInteraction, SlashCommandSubcommandBuilder } from "discord.js";
import { Textbook } from "../../modules/Textbook.js";
import { DevExecute, getBaseEmbed } from "../../modules/Utilities.js";
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

    const textbooks = await Textbook.list(guildId)

    DevExecute(log.info, `Got textbooks (${textbooks.length}) from guild ${guildId}`)

    // Construct embed
    let embed = getBaseEmbed(interaction.user, "Success")
    if (textbooks.length > 0) {
        embed = embed.addFields(
            ...textbooks.map(textbook => {
                let formatted = `**ISBN:** ${textbook.ISBN}`
                formatted += `\n**Subject:** ${textbook.Subject}`
                formatted += `\n**Link:** ${textbook.Link || "N/A Link"}`
                return {
                    name: textbook.Title,
                    value: formatted,
                    inline: true,
                }
            }),
        )
    }
    else {
        embed = embed.setDescription("No textbooks found!")
    }

    return interaction.editReply({
        embeds: [embed]
    })
}
