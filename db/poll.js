import mongo from './connect.js'
import { pollEmojis } from '../utilities/helpers.js'

export async function addPoll(id, poll) {
    let output
    let db = await mongo.db()
    let input = {
        _id: id,
        ...poll,
    }
    console.log(input)
    try {
        output = await db.collection("polls").insertOne({
            ...input
        })
    } catch (e) {
        console.log(e)
    } finally {
        console.log(output.result)
    }
}

export async function addReply(reaction, user) {
    let output
    let index = pollEmojis.indexOf(reaction.emoji.name)-1
    let db = await mongo.db()
    try {
        output = await db.collection("polls").findOneAndUpdate(
            { _id: reaction.message.id },
            { $push: { [`reactions.${index}`]: user.id }}
        )
    } catch (e) {
        console.log(e)
    } finally {
        return(output.value)
    }
}

export async function removeReply(id, user) {
    let output
    let db = await mongo.db()
    try {
        output = await db.collection("polls").insertOne({
            _id: id,
            ...poll,
        })
    } catch (e) {
        console.log(e)
    } finally {
        console.log(output)
    }
}

export async function editPoll() {

}

export async function deletePoll() {

}