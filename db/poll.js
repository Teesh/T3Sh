import mongo from './connect.js'

export async function addPoll(id, poll) {
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

export async function addReply(id, user) {
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