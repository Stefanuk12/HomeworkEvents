//
export const BotConfig = {
    Token: ""
}

//
export const DatabaseConfig = {
    host: "localhost",
    user: "root",
    password: "",
    database: "homeworkbot"
}

// Export
const config = {
    TextbookRefreshDelay: 15, // minutes
    ClassRefreshDelay: 15, // minutes
    Description: "**Class Data**\nComponent -> %CLASSSUBJECT%/%CLASSCODE%\nLocation -> %CLASSTEACHER% @ %CLASSROOM%\n\n**Textbooks**\n%TEXTBOOKS%\n\n**Request**\n%REQUEST%",
    BotConfig,
    DatabaseConfig
}
export default config
