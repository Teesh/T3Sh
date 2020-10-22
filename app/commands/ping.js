export default {
	name: 'ping',
	description: 'Check if bot is live',
    alias: ['ping', 'hello'],
	execute(message) {
        message.channel.send("I am listening!")
    }
}