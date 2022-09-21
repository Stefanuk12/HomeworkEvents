// Dependencies
import { User, EmbedBuilder } from "discord.js"

// Vars
const env = process.env.NODE_ENV || 'development'

// Condition type
export type Condition = "Success" | "Error" | "Neutral"

// So I do not need to do the same thing so many times
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
            text: "Sereine Bot - Developed by Stefanuk12#5820"
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