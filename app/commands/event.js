import moment from 'moment'
import Discord from 'discord.js'

import { single } from '../../utilities/time-parser.js'
import { settings } from "../../config.js"

export default {
	name: 'event',
    description: 'Create an event on a date with a guest list',
    alias: ['event', 'make', 'c', 'create'],
	async execute(original_message) {
        let message = original_message
        original_message.delete()
        let args = message.content.substr(message.content.indexOf(' ') + 1).replace(/ +(?= )/g,'')
        let event_name
        let inputs
        try {
            event_name = args.split('[')[1].split(']')[0].trim()
            inputs = args.replace(" *\[[^]]*\] *", "")
        } catch {
            event_name = "Event"
            inputs = args.trim()
        }
        let max
        let max_phrase = inputs.match(/\bm(ax)?( )?=( )?[0-9]{1,3}\b/g)
        if (max_phrase) {
            max = parseInt(max_phrase[0].split("=")[1].trim())
        }
        inputs.replace(/\bm(ax)?( )?=( )?[0-9]{1,3}\b/g, "")
        console.log(inputs)
        let event_moment = single(inputs)
        if (!event_moment) {
            message.channel.send("Failed to create event. Check the parameters")
            return
        }
        console.log(event_moment)
        let event_date = event_moment.format('MMMM Do, h:mm a')
        let expire_math = event_moment.clone().add(1, 'd').hour(0).minute(0)
        let expire = expire_math.format('MMMM Do, h:mm a')
        let expire_time = expire_math.diff(event_moment)
        console.log(expire)
        
        let event = {
            name: event_name,
            date: event_date,
            max: max,
            expire: expire,
            attendees: [],
            declined: [],
        }
        let embed = _makeEmbed(message, event)
        let msg
        let shortMsg
        let channel = message.guild.channels.cache.find(c => c.name.toLowerCase() === settings.default_calendar_channel)
        try {
            msg = await channel.send(embed)
            shortMsg = await message.channel.send(_makeShortEmbed(msg, event, channel))
        } catch  (e) {
            console.error(e)
        }
        msg.react('✅')
        msg.react('❌')
        msg.react('🗑️')
        let filter = (reaction, user) => {
            return user.id !== msg.author.id  && attendanceEmojis.includes(reaction.emoji.name)
        }
        let collector = msg.createReactionCollector(filter, { dispose: true, time: expire_time })
        collector.on('collect', (reaction, user) => {
            console.log(`Collected ${reaction.emoji.name} from ${user.tag}`)
            if (reaction.emoji.name == "✅") {
                event.attendees.push(user.id)
                let idx = event.declined.indexOf(user.id)
                if (idx != -1) {
                    event.declined.splice(idx)
                    let userReacts = msg.reactions.cache.filter(r => r.users.cache.has(user.id))
                    for ( let r of userReacts) {
                        if (r[0] == "❌") r[1].users.remove(user.id)
                    }
                }
            } else if (reaction.emoji.name == "❌") {
                event.declined.push(user.id)
                let idx = event.attendees.indexOf(user.id)
                if (idx != -1) {
                    event.attendees.splice(idx)
                    let userReacts = msg.reactions.cache.filter(r => r.users.cache.has(user.id))
                    for ( let r of userReacts) {
                        if (r[0] == "✅") r[1].users.remove(user.id)
                    }
                }
            } else if (reaction.emoji.name == "🗑️") {
                if (message.author.id === user.id) {
                    collector.stop()
                    return
                } else {
                    let userReacts = msg.reactions.cache.filter(r => r.users.cache.has(user.id))
                    for ( let r of userReacts) {
                        if (r[0] == "🗑️") r[1].users.remove(user.id)
                    }
                }
            }
            msg.edit(_makeEmbed(message, event))
        })
        
        collector.on('remove', (reaction, user) => {
            console.log(`Removed ${reaction.emoji.name} from ${user.tag}`)
            if (reaction.emoji.name == "✅") {
                let idx = event.attendees.indexOf(user.id)
                if (idx != -1) event.attendees.splice(idx)
            } else if (reaction.emoji.name == "❌") {
                let idx = event.declined.indexOf(user.id)
                if (idx != -1) event.declined.splice(idx)
            }
            msg.edit(_makeEmbed(message, event))
        })

        collector.on('end', collected => {
            shortMsg.edit(_makeShortEmbed(msg, event, channel, true))
            msg.delete()
        })
    }
}

function _makeEmbed (message, event) {
    const embed = new Discord.MessageEmbed()
        .setColor("#7851a9")
        .setTitle(event.name)
        .setFooter(
            `Ends ${event.expire}`
        )
    embed.addFields({
        name: `:calendar_spiral: ${event.date}`,
        value: `started by <@!${message.author.id}> in ${message.channel}`
    })
    let max_str = ''
    if (event.max !== undefined) {
        max_str = `/${event.max}`
    }
    let value = ""
    if (!event.attendees.length) value = "> None"
    for (let user in event.attendees) {
        value += `> <@!${event.attendees[user]}>\n`
    }
    embed.addFields({
        name: `:white_check_mark: Attendees (${event.attendees.length}${max_str})`,
        value: value,
        inline: true
    })
    value = ""
    if (!event.declined.length) value = "> None"
    for (let user in event.declined) {
        value += `> <@!${event.declined[user]}>\n`
    }
    embed.addFields({
        name: `:x: Declined (${event.declined.length})`,
        value: value,
        inline: true
    })
    return embed
}

function _makeShortEmbed (message, event, channel, expired) {
    let exp = ""
    if (expired) exp = "(expired)"
    const embed = new Discord.MessageEmbed()
      .setColor("#7851a9")
      .setDescription(`Event [${event.name}](${message.url}) posted to ${channel} ${exp}`)
    return embed
}

const attendanceEmojis = ["✅","❌","🗑️"]