import moment from 'moment'
import Discord from 'discord.js'

import { single } from '../../utilities/time-parser.js'
import { settings } from "../../config.js"
/*
*
*/
export default {
	name: 'event',
    description: 'Create an event on a date with a guest list',
    alias: ['event', 'make', 'e', 'create'],
	async execute(original_message) {
        let message = original_message
        message.delete()
        // console.log(message)
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
        let event_moment = single(inputs)
        if (!event_moment) {
            message.channel.send("Failed to create event. Check the parameters")
            return
        }
        let expire = event_moment.clone().add(1, 'd').format('MMMM Do, h:mm a')
        let event_date = event_moment.format('MMMM Do, h:mm a')
        
        let event = {
            name: event_name,
            date: event_date,
            max: max,
            expire: expire,
            attendees: []
        }
        let embed = _makeEmbed(message, event)
        let msg
        let channel = message.guild.channels.cache.find(c => c.name.toLowerCase() === settings.default_calendar_channel)
        try {
            msg = await channel.send(embed)
            await message.channel.send(_makeShortEmbed(msg, event, channel))
        } catch  (e) {
            console.error(e)
        }
        msg.react('✅')
        let filter = (reaction, user) => {
            return user.id !== msg.author.id  && attendanceEmojis.includes(reaction.emoji.name)
        }
        let collector = msg.createReactionCollector(filter, { dispose: true, time: expire*86400000 })
        collector.on('collect', (reaction, user) => {
            console.log(`Collected ${reaction.emoji.name} from ${user.tag}`)
            event.attendees.push(user.id)
            msg.edit(_makeEmbed(message, event))
        })
        
        collector.on('remove', (reaction, user) => {
            console.log(`Removed ${reaction.emoji.name} from ${user.tag}`)
            let idx = event.attendees.indexOf(user.id)
            event.attendees.splice(idx)
            msg.edit(_makeEmbed(message, event))
        })

        collector.on('end', collected => {
            msg.delete()
        })
    }
}

function _makeEmbed (message, event) {
    const embed = new Discord.MessageEmbed()
        .setColor("#7851a9")
        .setTitle(event.name)
        .setFooter(
            `Ends ${moment(message.createdAt).add(event.expire, 'd').format('MMM Do, h:mm a')}`
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
        value: value
    })
    return embed
}

function _makeShortEmbed (message, event, channel) {
    const embed = new Discord.MessageEmbed()
      .setColor("#7851a9")
      .setDescription(`Event [${event.name}](${message.url}) posted to ${channel}`)
    return embed
}

const attendanceEmojis = ["✅"]