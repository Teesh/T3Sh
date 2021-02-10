import Discord from 'discord.js'
import moment from 'moment'

import { settings } from '../config.js'
import mongo from "../db/connect.js"

export default async function (bot) {
    let db = await mongo.db()
    let channel = bot.channels.cache.find(c => c.name.toLowerCase().includes(settings.default_calendar_channel))

    db.collection("events").find().forEach(async (event) => {
        if (moment().diff(moment(event.expire, 'dddd MMM Do, h:mm a')) > 0) {
            let message
            console.log(moment().format(), `cleaning event: ${event._id}`)
            try {
                message = await channel.messages.cache.find(m => m.id === event._id)
            } catch (e) {
                console.error(e)
            } finally {
                if (message) message.delete()
                db.collection("events").deleteOne({ _id: event._id })
            }
        }
    })

    db.collection("polls").find().forEach(async (poll) => {
        if (moment().diff(moment(poll.expire, 'dddd MMM Do, h:mm a')) > 0) {
            let message
            console.log(moment().format(), `cleaning poll: ${poll._id}`)
            try {
                message = await channel.messages.cache.find(m => m.id === poll._id)
            } catch (e) {
                console.error(e)
            } finally {
                if (message) message.delete()
                db.collection("polls").deleteOne({ _id: poll._id })
            }
        }
    })
}