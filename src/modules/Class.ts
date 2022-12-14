// Dependencies
import { RowDataPacket } from "mysql2"
import config from "../config.js"
import { Database } from "./Database.js"
import { DevExecute } from "./Utilities.js"
import log from "fancy-log"

// Vars
export const ClassCache: Class[] = [] // should reflect the database

//
export interface IClass {
    Guild: string
    Subject: string
    Code: string
    Teacher?: string
    Room?: string
}
export interface IClassRow extends IClass, RowDataPacket { }
export interface Class extends IClass { }
export class Class {
    // Constructor
    constructor(Data: IClass) {
        Object.assign(this, Data)
    }

    // Grabs a class (based upon type)
    static async getOf(Guild: string, Type: keyof Class, Value: string, UseCache: boolean = true) {
        // Logging
        DevExecute(log.warn, `Attempting to grab classes of type ${Type} (${Value}) in guild ${Guild}`)

        // Attempt to get it from the cache
        const CachedClass = ClassCache.filter(cclass => cclass[Type] == Value && cclass.Guild == Guild)
        if (CachedClass.length > 0 && UseCache) {
            DevExecute(log.info, `Retrieved classes of type ${Type} (${Value}) with count ${CachedClass.length} from cache with guild ${Guild}`)
            return CachedClass
        }

        // Query the database
        const [result] = await Database.Connection.query<IClassRow[]>(`SELECT * FROM \`class\` WHERE \`${Type}\`=? AND \`Guild\`=?`, [Value, Guild])

        // Check we got a result
        if (result.length == 0) {
            const Message = `Classes with type ${Type} (${Value}) was not found in database with guild ${Guild}`
            DevExecute(log.error, Message)
            return Message
        }

        // Convert from objects to classes
        const classes = result.map((value) => {
            return new Class(value)
        })

        // Cache the results
        CachedClass.forEach((value) => {
            // Add if not in cache
            if (!CachedClass.find(textbook => textbook == value && textbook.Guild == Guild))
                CachedClass.push(value)
        })

        // Return
        return classes
    }

    // Grabs a class
    static async get(Guild: string, Code: string, UseCache: boolean = true) {
        return await Class.getOf(Guild, "Code", Code, UseCache)
    }

    // Refreshes the entire cache
    static async refresh() {
        // Logging
        DevExecute(log.warn, "Attempting to refresh class cache")

        // Query the database for each class
        const [result] = await Database.Connection.query<IClassRow[]>("SELECT * FROM `class` WHERE 1")

        // Empty the current cache
        ClassCache.splice(0, ClassCache.length)

        // Add each result
        for (const ClassDB of result) {
            // Create an object, and cache it
            DevExecute(log.info, `Added class (${ClassDB.ISBN}) to cache in guild ${ClassDB.Guild}`)
            ClassCache.push(
                new Class(ClassDB)
            )
        }
    }

    static async list(Guild: string, UseCache: boolean = true) {
        // Logging
        DevExecute(log.warn, `Attempting to list available classes in guild ${Guild}`)

        // Attempt to get it from the cache
        if (UseCache) {
            const CachedClasses = ClassCache.filter(cclass => cclass.Guild == Guild)
            DevExecute(log.info, `Received classes from cache with guild ${Guild}`)
            return CachedClasses
        }

        // Query the database for each class
        const [result] = await Database.Connection.query<IClassRow[]>("SELECT * FROM `class` WHERE `Guild`=?", [Guild])

        // Return the result
        DevExecute(log.info, `Received classes from database with guild ${Guild}`)
        return result.map(cclass => new Class(cclass))
    }

    // Add a class to the database/cache
    static async add(Data: IClass, ModifyCache: boolean = true) {
        // Logging
        DevExecute(log.warn, `Attempting to add class (${Data.Code}) to database${ModifyCache ? " and cache" : ""}`)

        // Create the class object
        const cclass = new Class(Data)

        // Make sure it already does not exist
        if (await Class.get(Data.Guild, Data.Code) instanceof Class) {
            // Add it to the cache
            if (ModifyCache && !ClassCache.find(cl => cl == cclass)) {
                ClassCache.push(cclass)
            }

            // Output
            const Message = `Class (${Data.Code}) was already within the database with guild ${Data.Guild}`
            DevExecute(log.error, Message)
            throw (new Error(Message))
        }

        // Add it to the database
        await Database.Connection.query("INSERT INTO `class` (`Guild` , `Subject`, `Code`, `Teacher`, `Room`) VALUES (?, ?, ?, ?, ?)", [Data.Guild, Data.Subject, Data.Code, Data.Teacher, Data.Room])
        DevExecute(log.info, `Added class (${Data.Code}) to database`)

        // Modifying cache after this point
        if (!ModifyCache)
            return

        // Make sure does not exist already
        if (ClassCache.find(cl => cl == cclass))
            return

        // Add it
        ClassCache.push(cclass)
        DevExecute(log.info, `Added class (${Data.Code}) to cache in guild ${Data.Guild}`)
    }
    async add(ModifyCache: boolean = true) {
        return await Class.add(this, ModifyCache)
    }

    // Removing a class from the database/cache
    static async remove(Data: IClass, ModifyCache: boolean = true) {
        // Logging
        DevExecute(log.warn, `Attempting to remove class (${Data.Code}) from database${ModifyCache ? " and cache" : ""} in guild ${Data.Guild}`)

        // Make sure it already exists
        const classes = await Class.get(Data.Guild, Data.Code)
        if (typeof (classes) == "string") {
            const Message = `Class (${Data.Code}) does not exist within database in guild ${Data.Guild}`
            DevExecute(log.error, Message)
            throw (new Error(Message))
        }

        // Remove it from the database
        await Database.Connection.query("DELETE FROM `class` WHERE `Code`=? AND `Guild`=?", [Data.Code, Data.Guild])
        DevExecute(log.info, `Removed class (${Data.Code}) from database in guild ${Data.Guild}`)

        // Modifying cache after this point
        if (!ModifyCache)
            return

        // Make sure already exists
        const ClassI = ClassCache.findIndex(cl => cl.Code == Data.Code && cl.Guild == Data.Guild)
        if (ClassI == -1)
            return

        // Remove it
        ClassCache.splice(ClassI, 1)
        DevExecute(log.info, `Removed class (${Data.Code}) from cache in guild ${Data.Guild}`)
    }
    async remove(ModifyCache: boolean = true) {
        return await Class.remove(this, ModifyCache)
    }
}

// Refresh the cache periodically
function delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
(async () => {
    while (true) {
        await Class.refresh()
        await delay(config.ClassRefreshDelay * 60 * 1000)
    }
})()
