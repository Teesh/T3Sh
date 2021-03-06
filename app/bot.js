import Discord from 'discord.js'
import Readline from 'readline'
import schedule from 'node-schedule'
import moment from 'moment'

import { settings } from '../config.js'
import mongo from '../db/connect.js'
import cleaner from './cleaner.js'

import Ping from './commands/ping.js'
import Help from './commands/help.js'
import Poll from './commands/poll.js'
import Ask from './commands/ask.js'
import Event from './commands/event.js'

import { addReply as addPollReply, removeReply as removePollReply } from '../db/poll.js'
import { addReply as addEventReply, removeReply as removeEventReply, editEvent } from '../db/event.js'
import { makeEmbed as pollEmbed } from './commands/poll.js'
import { makeEmbed as eventEmbed } from './commands/event.js'
import { userDeleteEmbed } from '../db/general.js' 
import { pollEmojis, eventEmojis, deleteEmoji, editEmoji } from '../utilities/helpers.js'
import event from './commands/event.js'

let bot = new Discord.Client(
    { 
        partials: ['USER', 'MESSAGE', 'CHANNEL', 'REACTION'],
        ws: { 
            intents: ['GUILD_MEMBERS', 'GUILD_MESSAGES', 'GUILDS', 'GUILD_MESSAGE_REACTIONS']
        }, 
    })
await mongo.connect()

bot.once('ready', () => {
    console.log(moment().format(), 'T3Sh ready')
    let invoke = settings.invoke
    if (process.env.NODE_ENV === "development") invoke = ">"
    bot.user.setActivity(`v${process.env.npm_package_version} | ${invoke}help`, { type: 'PLAYING' })
    cleaner(bot)
})

// TODO: clean exit failed executes 
bot.on('message', message => {
    let invoke = settings.invoke
    if (process.env.NODE_ENV === "development") invoke = ">"
    if (message.content.substring(0, 1) == invoke) {
        console.log(moment().format(), `received command: ${message.content}`)
        let cmd = message.content.substr(1, message.content.indexOf(' ') - 1).toLowerCase() || message.content.substr(1).toLowerCase()
        try {
            if (Ping.alias.includes(cmd)) Ping.execute(message)
            else if (Help.alias.includes(cmd)) Help.execute(message)
            else if (Poll.alias.includes(cmd)) Poll.execute(message)
            else if (Ask.alias.includes(cmd)) Ask.execute(message)
            else if (Event.alias.includes(cmd)) Event.execute(message)
            else message.reply("I don't know that command!").then(m => m.delete({timeout: 5000}))
        } catch (error) {
            console.error(error)
            message.reply("Something went wrong")
        }
    }
})

bot.on('messageReactionAdd', async (reaction, user) => {
    if (reaction.partial) {
		// If the message this reaction belongs to was removed the fetching might result in an API error, which we need to handle
		try {
            await reaction.fetch()
		} catch (error) {
			console.error('Something went wrong when fetching the message: ', error)
			return;
		}
    }
    if (user.id === reaction.message.author.id) return // ignore bot replies
    if (reaction.message.author.id !== bot.user.id) return // ignore replies on non-bot messages
    if (eventEmojis.includes(reaction.emoji.name)) {
        console.log(moment().format(), `Collected add event reply ${reaction.emoji.name} from ${user.tag || user.id}`)
        let updatedEvent = await addEventReply(reaction, user)
        reaction.message.edit(eventEmbed(updatedEvent.message, updatedEvent))
    } else if (pollEmojis.includes(reaction.emoji.name)) {
        console.log(moment().format(), `Collected add poll reply ${reaction.emoji.name} from ${user.tag || user.id}`)
        let updatedPoll = await addPollReply(reaction, user)
        reaction.message.edit(pollEmbed(updatedPoll.message, updatedPoll))
    } else if (reaction.emoji.name == deleteEmoji) {
        console.log(moment().format(), `Collected ${reaction.emoji.name} from ${user.tag || user.id}`)
        userDeleteEmbed(reaction, user)
    } else if (reaction.emoji.name == editEmoji) {
        console.log(moment().format(), `Collected ${reaction.emoji.name} from ${user.tag || user.id}`)
        editEvent(reaction, user)
    }
    // TODO: handle poll edits
})

bot.on('messageReactionRemove', async (reaction, user) => {
    if (reaction.partial) {
		try {
			await reaction.fetch()
		} catch (error) {
			console.error('Something went wrong when fetching the message: ', error)
			return;
		}
    }
    if (user.id === reaction.message.author.id) return // ignore bot replies
    if (reaction.message.author.id !== bot.user.id) return // ignore replies on non-bot messages
    console.log(moment().format(), `Collected remove ${reaction.emoji.name} from ${user.tag || user.id}`)
    if (eventEmojis.includes(reaction.emoji.name)) {
        console.log(moment().format(), `Collected remove event reply ${reaction.emoji.name} from ${user.tag || user.id}`)
        let updatedEvent = await removeEventReply(reaction, user)
        reaction.message.edit(eventEmbed(updatedEvent.message, updatedEvent))
    } else if (pollEmojis.includes(reaction.emoji.name)) {
        console.log(moment().format(), `Collected remove poll reply ${reaction.emoji.name} from ${user.tag || user.id}`)
        let updatedPoll = await removePollReply(reaction, user)
        reaction.message.edit(pollEmbed(updatedPoll.message, updatedPoll))
    }
})

schedule.scheduleJob('1 0 * * *', () => { 
    cleaner(bot)
})

// Login after all listeners set up
bot.login(process.env.DISCORD_BOT_TOKEN)

// redirect Windows Ctrl-C to graceful shutdown
if (process.platform === "win32") {
    let rl = Readline.createInterface({
        input: process.stdin,
        output: process.stdout
    })

    rl.on("SIGINT", function () {
        process.emit("SIGINT");
    })
}

// Clean up stray messages and close DB before graceful shutdown
process.on("SIGINT", async function () {
    try {
        await mongo.close()
    } catch (e) {
        console.log(e)
    }
    console.log(moment().format(), "T3Sh shutting down")
    //graceful shutdown
    process.exit()
})