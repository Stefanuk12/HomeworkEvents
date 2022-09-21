// Depedencies
import * as fs from "fs"
import * as path from "path"

// Vars
const types = ["client", "guild"]
const fileExt = path.extname(new URL('', import.meta.url).pathname)

// Loop through all events
function LoadInDirectory(Directory = new URL('../events', import.meta.url)){
    // Get the files
    const files = fs.readdirSync(Directory).filter(file => file.endsWith(fileExt))

    // Loop through each one
    for (const file of files) {
        // Start it
        import(Directory + "/" + file)
    }
}

// Load each one
for (const DirectoryType of types) {
    LoadInDirectory(new URL(`../events/${DirectoryType}`, import.meta.url))
}