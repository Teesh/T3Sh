import mongo from './connect.js'
import moment from 'moment'
import Discord from 'discord.js'

import { single } from '../utilities/time-parser.js'
import { eventEmojis } from '../utilities/helpers.js'
import { makeEmbed, makeEditEmbed } from '../app/commands/event.js'

export async function addEvent(id, event) {
    let output
    let db = await mongo.db()
    try {
        output = await db.collection("events").insertOne({
            _id: id,
            ...event,
        })
    } catch (e) {
        console.error(e)
    } finally {
        console.log(moment().format(), output.result)
    }
}

export async function addReply(reaction, user) {
    let output
    let db = await mongo.db()
    if (reaction.emoji.name == "✅") {
        try {
            output = await db.collection("events").findOneAndUpdate(
                { _id: reaction.message.id },
                { $push: { "attendees": user.id } },
                { returnOriginal: false },
            )
            reaction.message.reactions.resolve("❌").users.remove(user.id)
        } catch (e) {
            console.error(e)
        } finally {
            return(output.value)
        }
    } else if (reaction.emoji.name == "❌") {
        try {
            output = await db.collection("events").findOneAndUpdate(
                { _id: reaction.message.id },
                { $push: { "declined": user.id } },
                { returnOriginal: false },
            )
            reaction.message.reactions.resolve("✅").users.remove(user.id)
        } catch (e) {
            console.error(e)
        } finally {
            return(output.value)
        }
    }
}

export async function removeReply(reaction, user) {
    let output
    let db = await mongo.db()
    if (reaction.emoji.name == "✅") {
        try {
            output = await db.collection("events").findOneAndUpdate(
                { _id: reaction.message.id },
                { $pull: { "attendees": user.id } },
                { returnOriginal: false },
            )
        } catch (e) {
            console.error(e)
        } finally {
            return(output.value)
        }
    } else if (reaction.emoji.name == "❌") {
        try {
            output = await db.collection("events").findOneAndUpdate(
                { _id: reaction.message.id },
                { $pull: { "declined": user.id } },
                { returnOriginal: false },
            )
        } catch (e) {
            console.error(e)
        } finally {
            return(output.value)
        }
    }
}

// TODO: add +/- [0-9] day/hour handler
export async function editEvent(reaction, user) {
    let db = await mongo.db()
    let edit = false

    let event = await db.collection("events").findOne({ "_id" : reaction.message.id })
    let members = await reaction.message.guild.members.fetch()
    let member = members.find(u => u.id === user.id)
    if (event.message.author.id !== user.id && !member.roles.cache.find(r => r.name.includes("helpful bois"))) {
        reaction.users.remove(user.id)
        return
    }
    let channel = reaction.message.guild.channels.cache.get(event.message.channel.id)
    let editMsg = await channel.send(makeEditEmbed(event.message, reaction.message, event, user))
    let editCollector = new Discord.MessageCollector(channel, m => m.author.id === user.id, { time: 120000 })
    editCollector.on('collect', async (m) => {
        let cmd = m.content.substr(0, m.content.indexOf(' ')).toLowerCase()
        if (['e', 'edit'].includes(cmd)) {
            let content = m.content
            let mentions = content.match(/<@[!#&]?[0-9]+>/g, '') || []
            content = content.replace(/<@[!#&]?[0-9]+>/g, '').trim()
            let args = content.substr(content.indexOf(' ') + 1).replace(/ +(?= )/g,'')
            if (!args) return
            let event_name
            let inputs
            try {
                event_name = args.split('[')[1].split(']')[0].trim()
                inputs = args.replace(/ *\[[^\]]*\] */, "")
            } catch {
                inputs = args.trim()
            }
            if (event_name) {
                event.name = event_name
                edit = true
            }
            let max
            let max_phrase = inputs.match(/\bm(ax)?( )?=( )?[0-9]{1,3}\b/g)
            if (max_phrase) {
                max = parseInt(max_phrase[0].split("=")[1].trim())
                event.max = max
                edit = true
            }
            inputs = inputs.replace(/\bm(ax)?( )?=( )?[0-9]{1,3}\b/g, "")

            let event_edit = single(inputs)
            if (event_edit != -1) {
                let event_moment = moment(event.date, 'dddd MMM Do, h:mm a')
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
                event.expire = expire_math.format('dddd MMM Do, h:mm a')
                event.date = event_moment.format('dddd MMM Do, h:mm a')
                edit = true
            }

            if (edit) {
                await db.collection("events").findOneAndReplace(
                    { _id: reaction.message.id },
                    event
                )
            }
            reaction.message.edit(mentions, makeEmbed(event.message, event))
            m.delete()
            editCollector.stop()
        }
    })
    editCollector.on('end', () => {
        if (edit) editMsg.edit(makeEditEmbed(event.message, reaction.message, event, user, true))
        else editMsg.delete()
        reaction.users.remove(user.id)
    })
}