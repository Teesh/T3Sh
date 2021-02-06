import mongo from './connect.js'

export async function userDeleteEmbed(reaction, user) {
    let db = await mongo.db()

    let collection = "polls"
    let result = await db.collection("polls").findOne({ "_id" : reaction.message.id })
    if (!result) {
        collection = "events"
        result = await db.collection("events").findOne({ "_id" : reaction.message.id })
    }
    if (!result) return
    if (result.message.author.id !== user.id) {
        reaction.remove()
        return
    }
    deleteEmbed(reaction.message, collection)
}

export async function deleteEmbed(message, collection) {
    let db = await mongo.db()

    try {
        await db.collection(collection).deleteOne({ _id: message.id })
    } catch (e) {
        console.error(e)
    } finally {
        message.delete()
    }
}
