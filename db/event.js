import mongo from './connect.js'
import { eventEmojis } from '../utilities/helpers.js'

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
        console.log(output.result)
    }
}

export async function addReply(reaction, user) {
    let output
    let db = await mongo.db()
    if (reaction.emoji.name == "✅") {
        try {
            output = await db.collection("events").findOneAndUpdate(
                { _id: reaction.message.id },
                { $push: { "attendees": user.id },
                  $pull: { "declined": user.id } },
                { returnOriginal: false },
            )
            let userReacts = reaction.message.reactions.cache.filter(r => r.users.cache.has(user.id))
            for ( let r of userReacts) {
                if (r[0] == "❌") r[1].users.remove(user.id)
            }
        } catch (e) {
            console.error(e)
        } finally {
            return(output.value)
        }
    } else if (reaction.emoji.name == "❌") {
        try {
            output = await db.collection("events").findOneAndUpdate(
                { _id: reaction.message.id },
                { $push: { "declined": user.id },
                  $pull: { "attendees": user.id } },
                { returnOriginal: false },
            )
            let userReacts = reaction.message.reactions.cache.filter(r => r.users.cache.has(user.id))
            for ( let r of userReacts) {
                if (r[0] == "✅") r[1].users.remove(user.id)
            }
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

export async function editPoll() {

}

export async function deletePoll() {

}