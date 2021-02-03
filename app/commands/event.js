import moment from 'moment'
import Discord from 'discord.js'

import { single } from '../../utilities/time-parser.js'
import { settings } from "../../config.js"

import { eventEmojis } from '../../utilities/helpers.js'

// TODO: Add voice channel link to event
// TODO: Add game recognition to event
// TODO: Handle users/roles being @'d as request to attend
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
        let event_moment = single(inputs).time
        if (!event_moment) {
            message.channel.send("Failed to create event. Check the parameters")
            return
        }
        let event_date = event_moment.format('MMMM Do, h:mm a')
        let expire_math = event_moment.clone().add(1, 'd').hour(0).minute(0)
        let expire = expire_math.format('MMMM Do, h:mm a')
        let expire_time = expire_math.diff(moment())
        
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
        msg.react('📝')
        msg.react('🗑️')
        let filter = (reaction, user) => {
            return user.id !== msg.author.id  && eventEmojis.includes(reaction.emoji.name)
        }
        let collector = msg.createReactionCollector(filter, { dispose: true, time: expire_time })
        collector.on('collect', async (reaction, user) => {
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
            } else if (reaction.emoji.name == "📝") {
                if (message.author.id === user.id) {
                    let editMsg = await message.channel.send(_makeEditEmbed(message, msg, event))
                    let editCollector = new Discord.MessageCollector(message.channel, m => m.author.id === message.author.id, { time: 120000 })
                    editCollector.on('collect', m => {
                        let cmd = m.content.substr(0, m.content.indexOf(' ')).toLowerCase()
                        if (['e', 'edit'].includes(cmd)) {
                            let args = m.content.substr(m.content.indexOf(' ') + 1).replace(/ +(?= )/g,'')
                            if (!args) return
                            let event_name
                            let inputs
                            try {
                                event_name = args.split('[')[1].split(']')[0].trim()
                                inputs = args.replace(" *\[[^]]*\] *", "")
                            } catch {
                                inputs = args.trim()
                            }
                            if (event_name) event.name = event_name
                            let max
                            let max_phrase = inputs.match(/\bm(ax)?( )?=( )?[0-9]{1,3}\b/g)
                            if (max_phrase) {
                                max = parseInt(max_phrase[0].split("=")[1].trim())
                                event.max = max
                            }
                            inputs.replace(/\bm(ax)?( )?=( )?[0-9]{1,3}\b/g, "")

                            let event_edit = single(inputs)
                            if (event_edit != -1) {
                                let old_event_moment = event_moment.clone()
                                let new_event_moment = event_edit.time
                                let which_day = event_edit.which_day
                                let what_time = event_edit.what_time
                                if (!new_event_moment) {
                                    // TODO: edit error here 
                                    return
                                }
                                if (which_day && what_time) {
                                    event_moment = new_event_moment
                                } else if (which_day) {
                                    event_moment = new_event_moment.hour(old_event_moment.hour()).minute(old_event_moment.minute())
                                } else if (what_time) {
                                    event_moment = old_event_moment.hour(new_event_moment.hour()).minute(new_event_moment.minute())
                                }
                                let expire_math = event_moment.clone().add(1, 'd').hour(0).minute(0)
                                event.expire = expire_math.format('MMMM Do, h:mm a')
                                let expire_time = expire_math.diff(moment())
                                collector.options.time = expire_time
                                event.date = event_moment.format('MMMM Do, h:mm a')
                            }

                            editMsg.edit(_makeEditEmbed(message, msg, event, true))
                            let userReacts = msg.reactions.cache.filter(r => r.users.cache.has(user.id))
                            for ( let r of userReacts) {
                                if (r[0] == "📝") r[1].users.remove(user.id)
                            }
                            m.delete()
                            editCollector.stop()
                        }
                    })
                    editCollector.on('end', () => {
                        let userReacts = msg.reactions.cache.filter(r => r.users.cache.has(user.id))
                        for ( let r of userReacts) {
                            if (r[0] == "📝") r[1].users.remove(user.id)
                        }
                    })
                    
                } else {
                    let userReacts = msg.reactions.cache.filter(r => r.users.cache.has(user.id))
                    for ( let r of userReacts) {
                        if (r[0] == "📝") r[1].users.remove(user.id)
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

function _makeEditEmbed (message, bot_message, event, edited) {
    let val
    if (edited) {
        val = `<@!${message.author.id}> edited Event [${event.name}](${bot_message.url}) in the calendar`
    } else {
        val = `<@!${message.author.id}>, reply with the changes to Event [${event.name}](${bot_message.url}), starting with \`edit\``
    }
    const embed = new Discord.MessageEmbed()
      .setColor("#7851a9")
      .setDescription(val)
    return embed
}
