// Dependencies
import * as mysql from "mysql2/promise"
import { DatabaseConfig } from "../config.js"

//
export namespace Database {
    // Vars
    export let Connection: mysql.Pool

    // Initialise
    export async function InitialiseConnection(){
        // Create Connection (Pool)
        Connection = mysql.createPool({
            host: process.env.DB_HOST || DatabaseConfig.host,
            user: process.env.DB_USER || DatabaseConfig.user,
            password: process.env.DB_PASSWORD || DatabaseConfig.password,
            database: process.env.DB_DATABASE || DatabaseConfig.database,
            waitForConnections: true,
            connectionLimit: 10,
            queueLimit: 0
        })
    }
    InitialiseConnection()

    // Make sure connection is alive
    export async function IsConnectionAlive(){
        return Connection != undefined
    }
}
