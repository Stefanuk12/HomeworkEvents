// Dependencies
import { RowDataPacket } from "mysql2"
import config from "../config.js"
import { Database } from "./Database.js"
import { DevExecute } from "./Utilities.js"
import log from "fancy-log"

// Vars
export const TextbookCache: Textbook[] = [] // should reflect the database

//
export interface ITextbook {
    Guild: string
    Subject: string
    Title: string
    ISBN: string
    Link?: string
}
export interface ITextbookRow extends ITextbook, RowDataPacket {}
export interface Textbook extends ITextbook {}
export class Textbook {
    // Constructor
    constructor(Data: ITextbook) {
        Object.assign(this, Data)
    }

    // Grabs a textbook
    static async get(Guild: string, ISBN: string, UseCache: boolean = true) {
        // Logging
        DevExecute(log.warn, `Attempting to grab textbook (${ISBN}) in guild ${Guild}`)
        
        // Attempt to get it from the cache
        const CachedBook = TextbookCache.find(textbook => textbook.ISBN == ISBN && textbook.Guild == Guild)
        if (CachedBook && UseCache) {
            DevExecute(log.info, `Retrieved textbook (${ISBN}) from cache with guild ${Guild}`)
            return CachedBook
        }
            

        // Query the database
        const [result] = await Database.Connection.query<ITextbookRow[]>("SELECT * FROM `textbook` WHERE `ISBN`=? AND `Guild`=?", [ISBN, Guild])

        // Check we got a result
        const TextbookDB = result[0]
        if (!TextbookDB) {
            DevExecute(log.error, `Textbook (${ISBN}) was not found in database with guild ${Guild}`)
            return
        }
            
        // Create an object and cache it, then return
        const textbook = new Textbook(TextbookDB)
        TextbookCache.push(textbook)
        DevExecute(log.info, `Added textbook (${ISBN}) to cache with guild ${Guild}`)
        return textbook
    }

    // Refreshes the entire cache
    static async refresh() {
        // Logging
        DevExecute(log.warn, "Attempting to refresh textbook cache")

        // Query the database for each textbook
        const [result] = await Database.Connection.query<ITextbookRow[]>("SELECT * FROM `textbook` WHERE 1")

        // Empty the current cache
        TextbookCache.splice(0, Textbook.length)

        // Add each result
        for (const TextbookDB of result) {
            // Create an object, and cache it
            DevExecute(log.info, `Added textbook (${TextbookDB.ISBN}) to cache with guild ${TextbookDB.Guild}`)
            TextbookCache.push(
                new Textbook(TextbookDB)
            )
        }
    }

    // Add a textbook to the database/cache
    static async add(Data: ITextbook, ModifyCache: boolean = true) {
        // Logging
        DevExecute(log.warn, `Attempting to add textbook (${Data.ISBN}) to database${ModifyCache ? " and cache" : ""} with guild ${Data.Guild}`)

        // Create the textbook object
        const textbook = new Textbook(Data)

        // Make sure it already does not exist
        if (await Textbook.get(Data.ISBN)) {
            // Add it to the cache
            if (ModifyCache && !TextbookCache.find(tb => tb == textbook)) {
                TextbookCache.push(textbook)
            }

            // Output
            const Message = `Textbook (${Data.ISBN}) was already within the database with guild ${Data.Guild}`
            DevExecute(log.error, Message)
            throw(new Error(Message))
        } 

        // Add it to the database
        await Database.Connection.query("INSERT INTO `textbook` (`Guild`, `Subject`, `Title`, `ISBN`) VALUES (?, ?, ?, ?)", [Data.Guild, Data.Subject, Data.Title, Data.ISBN])
        DevExecute(log.info, `Added textbook (${Data.ISBN}) to database with guild ${Data.Guild}`)

        // Modifying cache after this point
        if (!ModifyCache)
            return

        // Make sure does not exist already
        if (!TextbookCache.find(tb => tb == textbook))
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
        if (!await Textbook.get(Data.ISBN)) {
            const Message = `Textbook (${Data.ISBN}) does not exist within database with guild ${Data.Guild}`
            DevExecute(log.error, Message)
            throw(new Error(Message))
        }
            

        // Remove it from the database
        await Database.Connection.query("DELETE FROM `textbook` WHERE `ISBN`=? AND `Guild`=?", [Data.ISBN, Data.Guild])
        DevExecute(log.info, `Removed textbook (${Data.ISBN}) from database with guild ${Data.Guild}`)

        // Modifying cache after this point
        if (!ModifyCache)
            return

        // Create the textbook object
        const textbook = new Textbook(Data)

        // Make sure already exists
        const TextbookI = TextbookCache.indexOf(textbook)
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
    return new Promise( resolve => setTimeout(resolve, ms) );
}
(async () => {
    while (true) {
        await Textbook.refresh()
        await delay(config.TextbookRefreshDelay * 60 * 1000)
    }
})()