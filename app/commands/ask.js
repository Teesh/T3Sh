import moment from 'moment'
import Discord from 'discord.js'

import { settings } from "../../config.js"
import { addPoll } from '../../db/poll.js'
import { makeEmbed } from './poll.js'

import { pollEmojis } from '../../utilities/helpers.js'

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
        let content = message.content
        let mentions = content.match(/<@[!#&]?[0-9]+>/g, '') || []
        content = content.replace(/<@[!#&]?[0-9]+>/g, '').trim()
        let args = content.substr(content.indexOf(' ') + 1)
                    .replace(/ +(?= )/g,'') // remove multiple consecutive spaces
        let question_name
        let inputs
        try {
            question_name = args.split('[')[1].split(']')[0].trim()
            inputs = args.replace(/ *\[[^\]]*\] */g, "")
        } catch {
            question_name = "Question"
            inputs = args.trim()
        }
        console.log(`Creating poll: ${question_name}`)
        let options = []
        let expire
        if (inputs.indexOf(',') == -1) {
            options = ["Yes", "No"]
        } else {
            options = inputs.split(',').map(s => s.trim().replace(/ +(?= )/g,''))
        }
        expire = 7
        console.log('Poll options: ', options)
        let question = {
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
            name: question_name,
            options: options,
            reactions: {},
            expire: expire
        }
        for (let opt in question.options) question.reactions[opt] = []
        
        let embed = makeEmbed(message, question)
        let msg
        let channel = message.channel
        try {
            msg = await channel.send(mentions.join(' '), embed)
        } catch  (e) {
            console.error(e)
        }
        for (let opt in question.options) {
            msg.react(pollEmojis[parseInt(opt)+1])
        }
        msg.react('🗑️')
        addPoll(msg.id, question)
    }
}