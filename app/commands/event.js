import moment from 'moment'
import Discord from 'discord.js'

import { single } from '../../utilities/time-parser.js'
import { settings } from "../../config.js"
import { addEvent } from '../../db/event.js'

import { eventEmojis } from '../../utilities/helpers.js'

// TODO: Add voice channel link to event
// TODO: Add game recognition to event
// TODO: Make event parsers modular function
// TODO: Add event start notification
export default {
	name: 'event',
    description: 'Create an event on a date with a guest list',
    alias: ['event', 'make', 'c', 'create'],
	async execute(original_message) {
        let message = original_message
        original_message.delete()
        let content = message.content
        let mentions = content.match(/<@[!#&]?[0-9]+>/g, '') || []
        content = content.replace(/<@[!#&]?[0-9]+>/g, '').trim()
        let args = content.substr(content.indexOf(' ') + 1).replace(/ +(?= )/g,'')
        let event_name
        let inputs
        try {
            event_name = args.split('[')[1].split(']')[0].trim()
            inputs = args.replace(/ *\[[^\]]*\] */g, "")
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
        let event_moment = single(inputs).time
        if (!event_moment) {
            message.channel.send("Failed to create event. Check the parameters")
            return
        }
        let event_date = event_moment.format('dddd MMM Do, h:mm a')
        let expire_math = event_moment.clone().add(1, 'd').hour(0).minute(0)
        let expire = expire_math.format('dddd MMM Do, h:mm a')
        let expire_time = expire_math.diff(moment())
        
        let event = {
            message: {
                id: message.id,
                author: {
                    id: message.author.id
                },
                createdAt: message.createdAt,
                channel: {
                    id: message.channel.id
                },
            },
            name: event_name,
            date: event_date,
            max: max,
            expire: expire,
            attendees: [],
            declined: [],
        }
        let embed = makeEmbed(message, event)
        let msg
        let shortMsg
        let channel = message.guild.channels.cache.find(c => c.name.toLowerCase().includes(settings.default_calendar_channel))
        try {
            msg = await channel.send(mentions.join(' '), embed)
            shortMsg = await message.channel.send(makeShortEmbed(msg, event, channel))
        } catch  (e) {
            console.error(e)
        }
        msg.react('✅')
        msg.react('❌')
        msg.react('📝')
        msg.react('🗑️')
        addEvent(msg.id, event)
    }
}

export function makeEmbed (message, event) {
    const embed = new Discord.MessageEmbed()
        .setColor("#7851a9")
        .setTitle(event.name)
        .setFooter(
            `Ends ${event.expire}`
        )
    embed.addFields({
        name: `:calendar_spiral: ${event.date}`,
        value: `started by <@!${message.author.id}> in <#${message.channel.id}>`
    })
    let max_str = ''
    if (event.max !== undefined && event.max !== null) {
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

export function makeShortEmbed (message, event, channel, expired) {
    let exp = ""
    if (expired) exp = "(expired)"
    const embed = new Discord.MessageEmbed()
      .setColor("#7851a9")
      .setDescription(`Event [${event.name}](${message.url}) posted to <#${channel.id}> ${exp}`)
    return embed
}

export function makeEditEmbed (message, bot_message, event, user, edited) {
    let val
    if (edited) {
        val = `<@!${user.id}> edited Event [${event.name}](${bot_message.url}) in the calendar`
    } else {
        val = `<@!${user.id}>, reply with the changes to Event [${event.name}](${bot_message.url}), starting with \`edit\``
    }
    const embed = new Discord.MessageEmbed()
      .setColor("#7851a9")
      .setDescription(val)
    return embed
}
