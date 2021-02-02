import moment from 'moment'
import Discord from 'discord.js'

import { settings } from "../../config.js"

import db from "../../db/connect.js"

// TODO: Have a way to add optioned polls to the calendar channel
// TODO: Handle users being @'d for request to answer
// TODO: Add action to auto generate event from a poll option
export default {
	name: 'ask',
    description: 'Ask a question with some options or with a phrase for the days',
    alias: ['ask', 'question', 'q'],
	async execute(original_message) {
        let message = original_message
        original_message.delete()
        let args = message.content.substr(message.content.indexOf(' ') + 1)
                    .replace(/ +(?= )/g,'') // remove multiple consecutive spaces
                    .replace(/["']/g, "") // replace quotes with brackets
        let question_name
        let inputs
        try {
            question_name = args.split('[')[1].split(']')[0].trim()
            inputs = args.replace(" *\[[^]]*\] *", "")
        } catch {
            question_name = "Question"
            inputs = args.trim()
        }
        console.log(`Creating poll: ${question_name}`)
        let options = []
        let expire
        options = inputs.split(',').map(s => s.trim().replace(/ +(?= )/g,''))
        expire = 7
        console.log('Poll options: ', options)
        let question = {
            name: question_name,
            options: options,
            reactions: {},
            expire: expire
        }
        for (let opt in question.options) question.reactions[opt] = []

        let embed = _makeEmbed(message, question)
        let msg
        let channel = message.channel
        try {
            msg = await channel.send(embed)
            if (!persistent) await message.channel.send(_makeShortEmbed(msg, question, channel))
        } catch  (e) {
            console.error(e)
        }
        for (let opt in question.options) {
            msg.react(numberEmojis[parseInt(opt)+1])
        }
        msg.react('🗑️')
        let filter = (reaction, user) => {
            return user.id !== msg.author.id  && numberEmojis.includes(reaction.emoji.name)
        }
        let collector = msg.createReactionCollector(filter, { dispose: true, time: expire*86400000 })
        collector.on('collect', (reaction, user) => {
            console.log(`Collected ${reaction.emoji.name} from ${user.tag}`)
            if (reaction.emoji.name == "🗑️") {
                if (message.author.id === user.id) {
                    collector.stop()
                    return
                } else {
                    let userReacts = msg.reactions.cache.filter(r => r.users.cache.has(user.id))
                    for ( let r of userReacts) {
                        if (r[0] == "🗑️") r[1].users.remove(user.id)
                    }
                }
            }  else {
                let index = numberEmojis.indexOf(reaction.emoji.name)-1
                question.reactions[index].push(user.id)
                msg.edit(_makeEmbed(message, question))
            }
        })
        
        collector.on('remove', (reaction, user) => {
            console.log(`Removed ${reaction.emoji.name} from ${user.tag}`)
            let index = numberEmojis.indexOf(reaction.emoji.name)-1
            let idx = question.reactions[index].indexOf(user.id)
            question.reactions[index].splice(idx)
            msg.edit(_makeEmbed(message, question))
        })

        collector.on('end', collected => {
            if (persistent) return
            msg.delete()
        })
    }
}

// message.author.avatarURL(message.author.avatar)
function _makeEmbed (message, poll) {
    const embed = new Discord.MessageEmbed()
        .setColor("#7851a9")
        .setFooter(
            `Started ${moment(message.createdAt).format('MMM Do, h:mm:ss a')} | Expires ${moment(message.createdAt).add(poll.expire, 'd').format('MMM Do, h:mm a')}`
        )
    embed.addFields({
        name: `:question: ${poll.name}`,
        value: `asked by <@!${message.author.id}> in ${message.channel}`
    })
    let total = Object.keys(poll.reactions).map(key => poll.reactions[key].length).reduce((p, c) => p + c, 0)
    for (let opt in poll.options) {
        // ██████             for reference, whatever the fuck this symbol is
        let count = (poll.reactions[opt].length/total)*50 || 0
        // FIXME: fix bug where progress bar changes lengths when receiving answers
        let value = '[:'+_numToWord(parseInt(opt)+1)+':](http://google.com) `'+'█'.repeat(count)+' '.repeat(50-count)+'`\nUsers: '
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

function _makeShortEmbed (message, poll, channel) {
    const embed = new Discord.MessageEmbed()
      .setColor("#7851a9")
      .setDescription(`Poll [${poll.name}](${message.url}) posted to ${channel}`)
    return embed
}

function _numToWord(number) {
    if (number == 0) return "zero"
    if (number == 1) return "one"
    if (number == 2) return "two"
    if (number == 3) return "three"
    if (number == 4) return "four"
    if (number == 5) return "five"
    if (number == 6) return "six"
    if (number == 7) return "seven"
    if (number == 8) return "eight"
    if (number == 9) return "nine"
}

const numberEmojis = ["0️⃣", "1️⃣", "2️⃣", "3️⃣", "4️⃣", "5️⃣", "6️⃣", "7️⃣", "8️⃣", "9️⃣", "📅", "🗑️"]