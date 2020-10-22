export default {
	name: 'help',
	description: 'Show the help for the program',
    alias: ['help', , 'h', '?'],
	execute(message) {
        message.channel.send("This is the help")
    }
}