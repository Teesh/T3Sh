import Discord from 'discord.js'
import Readline from 'readline'

import { settings } from '../config.js'
import mongo from '../db/connect.js'

import Ping from './commands/ping.js'
import Help from './commands/help.js'
import Poll from './commands/poll.js'
import Ask from './commands/ask.js'
import Event from './commands/event.js'

import { addReply as addPollReply, removeReply as RemovePollReply } from '../db/poll.js'
import { makeEmbed as pollEmbed } from './commands/poll.js'
import { pollEmojis, eventEmojis, deleteEmoji } from '../utilities/helpers.js'
import event from './commands/event.js'

let bot = new Discord.Client()
await mongo.connect()

bot.once('ready', () => {
    console.log('T3Sh ready')
})

bot.on('message', message => {
    let invoke
    if (process.env.NODE_ENV == "production") invoke = settings.invoke
    else if (process.env.NODE_ENV == "development") invoke = "-"
    if (message.content.substring(0, 1) == invoke) {
        let cmd = message.content.substr(1, message.content.indexOf(' ') - 1).toLowerCase() || message.content.substr(1).toLowerCase()
        try {
            if (Ping.alias.includes(cmd)) Ping.execute(message)
            else if (Help.alias.includes(cmd)) Help.execute(message)
            else if (Poll.alias.includes(cmd)) Poll.execute(message)
            else if (Ask.alias.includes(cmd)) Ask.execute(message)
            else if (Event.alias.includes(cmd)) Event.execute(message)
            else message.reply("I don't know that command!")
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
			await reaction.fetch();
		} catch (error) {
			console.error('Something went wrong when fetching the message: ', error);
			return;
		}
    }
    if (user.id === reaction.message.author.id) return // ignore bot replies
    if (eventEmojis.includes(reaction.emoji.name)) addEventReply(reaction, user)
    else if (pollEmojis.includes(reaction.emoji.name)) {
        let updatedPoll = await addPollReply(reaction, user)
        reaction.message.edit(pollEmbed(updatedPoll.message, updatedPoll))
    }
    else if (reaction.emoji.name == deleteEmoji) deleteMessage(reaction, user)
})

bot.on('messageReactionRemove', async (reaction, user) => {
    if (reaction.partial) {
		try {
			await reaction.fetch();
		} catch (error) {
			console.error('Something went wrong when fetching the message: ', error);
			return;
		}
    }
    if (user.id === reaction.message.author.id) return // ignore bot replies
    if (eventEmojis.includes(reaction.emoji.name)) removeEventReply(reaction, user)
    else if (pollEmojis.includes(reaction.emoji.name)) removePollReply(reaction, user)
})

bot.login(process.env.DISCORD_BOT_TOKEN)

if (process.platform === "win32") {
    let rl = Readline.createInterface({
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
        let messages = await channel.messages.fetch({ limit: 99 })
        await channel.bulkDelete(messages)
        await mongo.close()
    } catch (e) {
        console.log(e)
    }
    console.log("T3Sh shutting down")
    //graceful shutdown
    process.exit()
})