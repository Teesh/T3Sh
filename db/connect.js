import MongoClient from "mongodb"

var _db = null
let _username = encodeURIComponent(process.env.MONGO_INITDB_ROOT_USERNAME)
let _password = encodeURIComponent(process.env.MONGO_INITDB_ROOT_PASSWORD)
let _server = process.env.DB_HOST
let _uri = `mongodb://${_username}:${_password}@${_server}/
        ?authMechanism=DEFAULT
        &poolSize=20
        &writeConcern=majority`

const DBClient = {
    connect: async () => _db = await new MongoClient(_uri, { useUnifiedTopology: true }),
    db: async () => await _db.db("botdb"),
    close: async () => await _db.close(),
}

Object.freeze(DBClient)
export default DBClient
