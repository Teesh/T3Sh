import moment from 'moment'
import Discord from 'discord.js'

import { single, range } from '../../utilities/time-parser.js'
import { settings } from '../../config.js'
import { addPoll } from '../../db/poll.js'

import { numToWord, pollEmojis } from '../../utilities/helpers.js'

// TODO: Handle users being @'d for request to answer
// TODO: Add action to auto generate event from a poll option
export default {
	name: 'poll',
    description: 'Ask a question with some options or with a phrase for the days',
    alias: ['poll', 'p'],
	async execute(original_message) {
        let message = original_message
        original_message.delete()
        let content = message.content
        let mentions = content.match(/<@[!#&]?[0-9]+>/g, '') || []
        content = content.replace(/<@[!#&]?[0-9]+>/g, '').trim()
        let args = content.substr(content.indexOf(' ') + 1)
                    .replace(/ +(?= )/g,'') // remove multiple consecutive spaces
        let poll_name
        let inputs
        try {
            poll_name = args.split('[')[1].split(']')[0].trim()
            inputs = args.replace(/ *\[[^\]]*\] */g, "")
        } catch {
            poll_name = "Poll"
            inputs = args.trim()
        }
        console.log(`Creating poll: ${poll_name}`)
        let options = []
        let expire
        if (inputs.indexOf(',') == -1) {
            let option_set = range(inputs)
            expire = option_set[option_set.length-1].clone().add(1, 'd').hour(0).minute(0).format('MMMM Do, h:mm a')
            options = option_set.map(opt => opt.format('ddd Do'))
        } else {
            let option_set = []
            let opts = inputs.split(',').map(s => s.trim().replace(/ +(?= )/g,''))
            for (let opt of opts) option_set.push(single(opt).time)
            options = option_set.map(opt => opt.format('ddd Do'))
            expire = option_set[option_set.length-1].clone().add(1, 'd').hour(0).minute(0).format('MMMM Do, h:mm a')
        }
        console.log('Poll options: ', options)
        let poll = {
            message: {
                id: message.id,
                author: {
                    id: message.author.id
                },
                createdAt: message.createdAt,
                channel: {
                    id: message.channel.id
                },
            },
            name: poll_name,
            options: options,
            reactions: {},
            expire: expire
        }
        for (let opt in poll.options) poll.reactions[opt] = []

        let embed = makeEmbed(message, poll)
        let msg
        let channel = message.guild.channels.cache.find(c => c.name.toLowerCase() === settings.default_calendar_channel)
        try {
            msg = await channel.send(mentions.join(' '), embed)
            await message.channel.send(makeShortEmbed(msg, poll, channel))
        } catch  (e) {
            console.error(e)
        }
        for (let opt in poll.options) {
            msg.react(pollEmojis[parseInt(opt)+1])
        }
        // msg.react('📅')
        msg.react('🗑️')
        // db insert
        addPoll(msg.id, poll)
    }
}

// message.author.avatarURL(message.author.avatar)
export function makeEmbed (message, poll) {
    const embed = new Discord.MessageEmbed()
        .setColor("#7851a9")
        .setFooter(
            `Started ${moment(message.createdAt).format('MMM Do, h:mm:ss a')} | Expires ${poll.expire}`
        )
    embed.addFields({
        name: `:question: ${poll.name}`,
        value: `posted by <@!${message.author.id}> in <#${message.channel.id}>`
    })
    let total = Object.keys(poll.reactions).map(key => poll.reactions[key].length).reduce((p, c) => p + c, 0)
    for (let opt in poll.options) {
        // ██████             for reference, whatever the fuck this symbol is
        let count = (poll.reactions[opt].length/total)*50 || 0
        // FIXME: fix bug where progress bar changes lengths when receiving answers
        let value = '[:'+numToWord(parseInt(opt)+1)+':](http://google.com) `'+'█'.repeat(count)+' '.repeat(50-count)+'`\nUsers: '
        for (let user in poll.reactions[opt]) {
            value += '<@!'+poll.reactions[opt][user]+'>, '
        }
        embed.addFields({
            name: poll.options[opt],
            value: value.slice(0, -2)
        })
    }
    return embed
}

export function makeShortEmbed (message, poll, channel) {
    const embed = new Discord.MessageEmbed()
      .setColor("#7851a9")
      .setDescription(`Poll [${poll.name}](${message.url}) posted to <#${message.channel.id}>`)
    return embed
}
