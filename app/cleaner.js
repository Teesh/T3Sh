import Discord from 'discord.js'
import moment from 'moment'

import { settings } from '../config.js'
import mongo from "../db/connect.js"

export default async function (bot) {
    let db = await mongo.db()
    let events = bot.channels.cache.find(c => c.name.toLowerCase().includes(settings.default_calendar_channel))
    let polls = bot.channels.cache.find(c => c.name.toLowerCase().includes(settings.default_poll_channel))

    db.collection("events").find().forEach(async (event) => {
        if (event.expire === "Invalid date" || moment().diff(moment(event.expire, 'dddd MMM Do, h:mm a')) > 0) {
            let message
            console.log(moment().format(), `cleaning event: ${event.name}`)
            try {
                let messages = await events.messages.fetch()
                message = messages.find(m => m.id === event._id)
            } catch (e) {
                console.error(e)
            } finally {
                if (message) message.delete()
                db.collection("events").deleteOne({ _id: event._id })
            }
        }
    })

    db.collection("polls").find().forEach(async (poll) => {
        if (poll.expire === "Invalid date" || moment().diff(moment(poll.expire, 'dddd MMM Do, h:mm a')) > 0) {
            let message
            console.log(moment().format(), `cleaning poll: ${poll.name}`)
            try {
                let messages = await polls.messages.fetch()
                message = messages.find(m => m.id === poll._id)
            } catch (e) {
                console.error(e)
            } finally {
                if (message) message.delete()
                db.collection("polls").deleteOne({ _id: poll._id })
            }
        }
    })
}