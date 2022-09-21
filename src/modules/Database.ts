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
            host: DatabaseConfig.host,
            user: DatabaseConfig.user,
            password: DatabaseConfig.password,
            database: DatabaseConfig.database,
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