import MongoClient from "mongodb"

class Mongo {
    #username = encodeURIComponent(process.env.MONGO_INITDB_ROOT_USERNAME)
    #password = encodeURIComponent(process.env.MONGO_INITDB_ROOT_PASSWORD)
    #server = process.env.NODE_ENV == "production" ? "db" : "127.0.0.1"
    #uri = `mongodb://${this.#username}:${this.#password}@${this.#server}/
                    ?authMechanism=DEFAULT
                    &poolSize=20
                    &writeConcern=majority`

    constructor () {
        this.db = null
    }

    async connect() {
        let client
        try {
         client = await new MongoClient(this.#uri, { useUnifiedTopology: true })
        } catch (e) {
            console.log(e)
            return
        }
    
        try {
            // Connect the client to the server
            await client.connect()
            // Establish and verify connection
            await client.db("botdb").command({ ping: 1 })
            console.log("Connected successfully to server")
        } catch (e) {
            console.log(e)
        } finally {
            // Ensures that the client will close when you finish/error
            await client.close()
        }
    
        this.db = client
        return this.db
    }
}

let client = new Mongo()
await client.connect()
export default client.db
