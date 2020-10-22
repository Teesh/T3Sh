import moment from 'moment'
import Discord from 'discord.js'

/*
*
*/
export default {
	name: 'event',
    description: 'Create an event on a date with a guest list',
    alias: ['event', 'make', 'e', 'create'],
	async execute(original_message) {
        let message = original_message
        message.delete()
        // console.log(message)
        let args = message.content.substr(message.content.indexOf(' ') + 1)
        let event_name
        let inputs
        try {
            event_name = args.split('[')[1].split(']')[0].trim().replace(/ +(?= )/g,'')
            inputs = args.replace(" *\[[^]]*\] *", "")
        } catch {
            event_name = "Event"
            inputs = args.trim()
        }
        let options = inputs.split(' ').filter(s => s !== '').map(s => s.trim())
        let start_day
        if (options.includes('in')) {
            if (options.includes('day') || options.includes('days')) {
                let days = options[options.indexOf('days')-1]
                
            } else if (options.includes('week') || options.includes('weeks')) {
                let days = options[options.indexOf('days')-1]
                
            }
        } else if (options.includes('on')) {
            if (options.includes('day') || options.includes('days')) {
                let days = options[options.indexOf('days')-1]
                
            }
        }
        console.log(inputs)
        let event_date = moment()
        let event = {
            name: event_name,
            date: event_date
        }
        let embed = _makeEmbed(message, event)
        let msg
        try {
            msg = await message.channel.send(embed)
        } catch  (e) {
            console.error(e)
        }
        msg.react('✅')
    }
}

function _makeEmbed (message, event) {
    const embed = new Discord.MessageEmbed()
        .setColor("#7851a9")
        .setTitle(`:calendar: ${event.name}`)
        .setAuthor(`Event created by ${message.author.username}`, message.author.avatarURL(message.author.avatar))
    embed.addFields({
        name: ':clock8: Time',
        value: event.date.format('MMMM Do, h:mm:ss a')
    })
    embed.addFields({
        name: ':white_check_mark: Attendees (3/4)',
        value: '> <@!'+message.author.id+'>\n> <@!'+message.author.id+'>\n> <@!'+message.author.id+'>\n'
    })
    return embed
}