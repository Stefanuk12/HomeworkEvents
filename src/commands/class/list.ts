// Dependencies
import { ChatInputCommandInteraction, SlashCommandSubcommandBuilder } from "discord.js";
import { Class } from "../../modules/Class.js";
import { DevExecute, getBaseEmbed } from "../../modules/Utilities.js";
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

    const classes = await Class.list(guildId)

    DevExecute(log.info, `Got classes (${classes.length}) from guild ${guildId}`)

    // Construct embed
    let embed = getBaseEmbed(interaction.user, "Success")
    if (classes.length > 0) {
        embed = embed.addFields(
            ...classes.map(cclass => {
                let formatted = `**Subject:** ${cclass.Subject}`
                formatted += `\n**Room:** ${cclass.Room || "N/A Room"}`
                formatted += `\n**Teacher:** ${cclass.Teacher || "N/A Teacher"}`
                return {
                    name: cclass.Code,
                    value: formatted,
                    inline: true,
                }
            }),
        )
    }
    else {
        embed = embed.setDescription("No classes found!")
    }
    return interaction.editReply({
        embeds: [embed]
    })
}
