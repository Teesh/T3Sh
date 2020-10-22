import Discord from 'discord.js'
import Readline from 'readline'

import { auth, settings } from '../config/config.js'

import Ping from './commands/ping.js'
import Help from './commands/help.js'
import Poll from './commands/poll.js'
import Event from './commands/event.js'

let bot = new Discord.Client()

bot.once('ready', () => {
    console.log('T3Sh ready')
})

bot.on('message', message => {
    if (message.content.substring(0, 1) == settings.invoke) {
        var cmd = message.content.substr(1, message.content.indexOf(' ') - 1).toLowerCase() || message.content.substr(1).toLowerCase()
        try {
            if (Ping.alias.includes(cmd)) Ping.execute(message)
            else if (Help.alias.includes(cmd)) Help.execute(message)
            else if (Poll.alias.includes(cmd)) Poll.execute(message)
            else if (Event.alias.includes(cmd)) Event.execute(message)
            else message.reply("I don't know that command!")
        } catch (error) {
            console.error(error)
            message.reply("Something went wrong")
        }
    }
})

bot.login(auth.token)

if (process.platform === "win32") {
    var rl = Readline.createInterface({
        input: process.stdin,
        output: process.stdout
    })

    rl.on("SIGINT", function () {
        process.emit("SIGINT");
    })
}

process.on("SIGINT", async function () {
    try {
        let channel = bot.channels.cache.find(c => c.name.toLowerCase() === settings.default_calendar_channel)
        let messages = await channel.messages.fetch({ limit: 10 })
        await channel.bulkDelete(messages)
    } catch (e) {
        console.log(e)
    }
    console.log("T3Sh shutting down")
    //graceful shutdown
    process.exit()
})