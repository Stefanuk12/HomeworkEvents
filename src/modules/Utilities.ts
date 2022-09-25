// Dependencies
import { User, EmbedBuilder, ChatInputCommandInteraction, ButtonBuilder, ButtonStyle, ActionRowBuilder, MessageActionRowComponentBuilder, MessageType, APIButtonComponentWithCustomId, EmbedFooterOptions, APIEmbedFooter } from "discord.js"

// Vars
const env = process.env.NODE_ENV || 'development'

// Condition type
export type Condition = "Success" | "Error" | "Neutral"

// So I do not need to do the same thing so many times
export const FooterWatermark = "Developed by Stefanuk12#5820"
export function getBaseEmbed(user?: User, condition: Condition = "Neutral") {
    // Vars
    const convert = {
        "Success": 0x90ee90,
        "Error": 0xff9696,
        "Neutral": 0x808080
    }

    // Create Embed
    const Embed = new EmbedBuilder()
        .setTitle(condition == "Neutral" ? "sex" : condition)
        .setColor(convert[condition])
        .setFooter({
            text: FooterWatermark
        });

    // Custom Embed if user is provided
    if (user) {
        // lil circle of thing yes
        if (Embed.data.footer) {
            Embed.data.footer.icon_url = user.avatarURL() || user.defaultAvatarURL
        }
    }

    // Return
    return Embed
}

// Executes a function, if in development
export function DevExecute(f: Function, ...args: any[]) {
    if (env == "development")
        f(...args)
}

// Only sets defined properties
export function SetFooter(embed: EmbedBuilder, data: APIEmbedFooter) {
    // Set the footer directly
    if (!embed.data.footer) {
        embed.data.footer = data
        return embed
    }

    // Loop through the data
    let k: keyof APIEmbedFooter
    for (k in data) {
        // Make sure the value exists and set
        const v = data[k]
        if (v != undefined)
            embed.data.footer[k] = v
    }

    // Return the embed
    return embed
}

//
export async function PaginationEmbed(
    interaction: ChatInputCommandInteraction, 
    Pages: EmbedBuilder[], 
    ButtonList: ButtonBuilder[] = [
        new ButtonBuilder()
            .setCustomId("prevButton")
            .setEmoji({name: "⬅"})
            .setLabel("Back")
            .setStyle(ButtonStyle.Danger),
        new ButtonBuilder()
            .setCustomId("nextButton")
            .setEmoji({name: "➡"})
            .setLabel("Next")
            .setStyle(ButtonStyle.Success),
    ], 
    timeout: number = 120000) {
    // Make sure there are only two buttons
    if (ButtonList.length != 2) {
        let error = new Error("Two buttons are needed")
        throw (error)
    }

    // Make sure are not link buttons
    for (const button of ButtonList) {
        if (button.data.style == ButtonStyle.Link) {
            let error = new Error("Link buttons are not supported")
            throw (error)
        }
    }

    // Vars
    const Previous = ButtonList[0]
    const Next = ButtonList[1]

    let Page = 0
    const Row = <ActionRowBuilder<MessageActionRowComponentBuilder>>new ActionRowBuilder()
        .addComponents(ButtonList)

    // Defer the reply if it hasn't already
    if (!interaction.deferred) {
        await interaction.deferReply({
            ephemeral: true,
            fetchReply: true
        })
    }

    // Replying
    const CurrentPage = await interaction.editReply({
        embeds: [SetFooter(Pages[Page], {
            text: `Page ${Page + 1} / ${Pages.length}  •  ${FooterWatermark}`
        })],
        components: [Row]
    })

    // Make sure is a command
    if (CurrentPage.type != MessageType.ChatInputCommand) {
        let error = new Error("Link buttons are not supported")
        throw (error)
    }

    // Collector Logic
    const Collector = CurrentPage.createMessageComponentCollector({
        filter: (button) => { return button.customId === (ButtonList[0].data as APIButtonComponentWithCustomId).custom_id || button.customId === (ButtonList[1].data as APIButtonComponentWithCustomId).custom_id },
        time: timeout
    })

    Collector.on("collect", async (button) => {
        const PageLength = Pages.length - 1

        // Decrement page
        if (button.customId == (Previous.data as APIButtonComponentWithCustomId).custom_id) {
            Page = Page > 0 ? Page - 1 : PageLength
            // Increment page
        } else if (button.customId == (Next.data as APIButtonComponentWithCustomId).custom_id) {
            Page = Page < PageLength ? Page + 1 : 0
        }

        // So the button itself doesn't complain
        if (!button.deferred)
            await button.deferUpdate()

        // Reply
        await interaction.editReply({
            embeds: [SetFooter(Pages[Page], {
                text: `Page ${Page + 1} / ${Pages.length}  •  ${FooterWatermark}`
            })],
            components: [Row]
        })

        // Reset
        Collector.resetTimer()
    })

    Collector.on("end", async (_, reason) => {
        // Make sure reason is not messageDelete
        if (reason == "messageDelete") {
            return
        }

        // Disable
        const DisabledRow = <ActionRowBuilder<MessageActionRowComponentBuilder>>new ActionRowBuilder()
            .addComponents(
                Previous.setDisabled(true),
                Next.setDisabled(true)
            )

        await interaction.editReply({
            components: [DisabledRow]
        })
    })

    // Return
    return CurrentPage
}