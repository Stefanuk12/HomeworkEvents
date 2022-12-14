// Dependencies
import { RowDataPacket } from "mysql2"
import config from "../config.js"
import { Database } from "./Database.js"
import { DevExecute } from "./Utilities.js"
import log from "fancy-log"

// Vars
export const TextbookCache: Textbook[] = [] // should reflect the database

//
export const TextbookSearchAttributes = ["Subject", "Title", "ISBN"]
export interface ITextbook {
    Guild: string
    Subject: string
    Title: string
    ISBN: string
    Link?: string
}
export interface ITextbookRow extends ITextbook, RowDataPacket { }
export interface Textbook extends ITextbook { }
export class Textbook {
    // Constructor
    constructor(Data: ITextbook) {
        Object.assign(this, Data)
    }

    // Grabs a textbook (based upon type)
    static async getOf(Guild: string, Type: keyof Textbook, Value: string, UseCache: boolean = true, ReturnAll: boolean = false) {
        // Logging
        DevExecute(log.warn, `Attempting to grab textbook of type ${Type} (${Value}) in guild ${Guild}`)

        // Attempt to get it from the cache
        const CachedBook = TextbookCache.filter(textbook => textbook[Type] == Value && textbook.Guild == Guild)
        if (CachedBook.length > 0 && UseCache) {
            DevExecute(log.info, `Retrieved textbooks of type ${Type} (${Value}) with count ${CachedBook.length} from cache with guild ${Guild}`)
            return CachedBook
        }

        // Query the database
        const [result] = await Database.Connection.query<ITextbookRow[]>(`SELECT * FROM \`textbook\` WHERE \`${Type}\`=? AND \`Guild\`=?`, [Value, Guild])

        // Check we got a result
        if (result.length == 0) {
            const Message = `Textbooks with type ${Type} (${Value}) was not found in database with guild ${Guild}`
            DevExecute(log.error, Message)
            return Message
        }

        // Convert from objects to classes
        const textbooks = result.map((value) => {
            return new Textbook(value)
        })

        // Cache the results
        CachedBook.forEach((value) => {
            // Add if not in cache
            if (!TextbookCache.find(textbook => textbook == value && textbook.Guild == Guild))
                TextbookCache.push(value)
        })

        // Return
        return textbooks
    }

    // Refreshes the entire cache
    static async refresh() {
        // Logging
        DevExecute(log.warn, "Attempting to refresh textbook cache")

        // Query the database for each textbook
        const [result] = await Database.Connection.query<ITextbookRow[]>("SELECT * FROM `textbook` WHERE 1")

        // Empty the current cache
        TextbookCache.splice(0, TextbookCache.length)

        // Add each result
        for (const TextbookDB of result) {
            // Create an object, and cache it
            DevExecute(log.info, `Added textbook (${TextbookDB.ISBN}) to cache with guild ${TextbookDB.Guild}`)
            TextbookCache.push(
                new Textbook(TextbookDB)
            )
        }
    }

    // Grabs a textbook
    static async get(Guild: string, ISBN: string, UseCache: boolean = true) {
        return await Textbook.getOf(Guild, "ISBN", ISBN, UseCache)
    }

    static async list(Guild: string, UseCache: boolean = true) {
        // Logging
        DevExecute(log.warn, `Attempting to list available textbooks in guild ${Guild}`)

        // Attempt to get it from the cache
        if (UseCache) {
            const CachedBooks = TextbookCache.filter(textbook => textbook.Guild == Guild)
            DevExecute(log.info, `Received textbooks from cache with guild ${Guild}`)
            return CachedBooks
        }

        // Query the database for each textbook
        const [result] = await Database.Connection.query<ITextbookRow[]>("SELECT * FROM `textbook` WHERE `Guild`=?", [Guild])

        // Return the result
        DevExecute(log.info, `Received textbooks from database with guild ${Guild}`)
        return result.map(textbook => new Textbook(textbook))
    }

    // Add a textbook to the database/cache
    static async add(Data: ITextbook, ModifyCache: boolean = true) {
        // Logging
        DevExecute(log.warn, `Attempting to add textbook (${Data.ISBN}) to database${ModifyCache ? " and cache" : ""} with guild ${Data.Guild}`)

        // Create the textbook object
        const textbook = new Textbook(Data)

        // Make sure it already does not exist
        if (await Textbook.get(Data.Guild, Data.ISBN) instanceof Textbook) {
            // Add it to the cache
            if (ModifyCache && !TextbookCache.find(tb => tb == textbook)) {
                TextbookCache.push(textbook)
            }

            // Output
            const Message = `Textbook (${Data.ISBN}) was already within the database with guild ${Data.Guild}`
            DevExecute(log.error, Message)
            throw (new Error(Message))
        }

        // Add it to the database
        await Database.Connection.query("INSERT INTO `textbook` (`Guild`, `Subject`, `Title`, `ISBN`, `Link`) VALUES (?, ?, ?, ?, ?)", [Data.Guild, Data.Subject, Data.Title, Data.ISBN, Data.Link])
        DevExecute(log.info, `Added textbook (${Data.ISBN}) to database with guild ${Data.Guild}`)

        // Modifying cache after this point
        if (!ModifyCache)
            return

        // Make sure does not exist already
        if (TextbookCache.find(tb => tb == textbook))
            return

        // Add it
        TextbookCache.push(textbook)
        DevExecute(log.info, `Added textbook (${Data.ISBN}) to cache with guild ${Data.Guild}`)
    }
    async add(ModifyCache: boolean = true) {
        return await Textbook.add(this, ModifyCache)
    }

    // Removing a textbook from the database/cache
    static async remove(Data: ITextbook, ModifyCache: boolean = true) {
        // Logging
        DevExecute(log.warn, `Attempting to remove textbook (${Data.ISBN}) from database${ModifyCache ? " and cache" : ""} with guild ${Data.Guild}`)

        // Make sure it already exists
        const textbooks = await Textbook.get(Data.Guild, Data.ISBN)
        if (typeof (textbooks) == "string") {
            const Message = `Textbook (${Data.ISBN}) does not exist within database with guild ${Data.Guild}`
            DevExecute(log.error, Message)
            throw (new Error(Message))
        }


        // Remove it from the database
        await Database.Connection.query("DELETE FROM `textbook` WHERE `ISBN`=? AND `Guild`=?", [Data.ISBN, Data.Guild])
        DevExecute(log.info, `Removed textbook (${Data.ISBN}) from database with guild ${Data.Guild}`)

        // Modifying cache after this point
        if (!ModifyCache)
            return

        // Make sure already exists
        const TextbookI = TextbookCache.findIndex(tb => tb.ISBN == Data.ISBN && tb.Guild == Data.Guild)
        if (TextbookI == -1)
            return

        // Remove it
        TextbookCache.splice(TextbookI, 1)
        DevExecute(log.info, `Removed textbook (${Data.ISBN}) from cache with guild ${Data.Guild}`)
    }
    async remove(ModifyCache: boolean = true) {
        return await Textbook.remove(this, ModifyCache)
    }
}

// Refresh the cache periodically
function delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
(async () => {
    while (true) {
        await Textbook.refresh()
        await delay(config.TextbookRefreshDelay * 60 * 1000)
    }
})()
