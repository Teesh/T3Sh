import Discord from 'discord.js'

export default {
	name: 'help',
	description: 'Show the help for T3Sh bot',
    alias: ['help', 'h', '?'],
	execute(original_message) {
        let message = original_message
        original_message.delete()
        let input = message.content.toLowerCase().split(" ")[1]
        if (!input) {
            message.channel.send(_makeDefaultHelpEmbed())
        } else if (["poll", "p"].includes(input)) {
            message.channel.send(_makePollHelpEmbed())
        } else if (["ask", "question", "q"].includes(input)) {
            message.channel.send(_makeQuestionHelpEmbed())
        } else if (["create", "c", "event", "make"].includes(input)) {
            message.channel.send(_makeEventHelpEmbed())
        }
    }
}

function _makeDefaultHelpEmbed () {
    const embed = new Discord.MessageEmbed()
      .setColor("#7851a9")
      .setTitle("T3Sh Commands Help")
      .setDescription("Type -? followed by the name of a command to get more details about the command")
    embed.addFields({
        name: "Help",
        value: `Show the help for T3Sh bot
        There are three main commands in T3Sh: Poll, Event, and Question
        > -help
        > -help Poll
        > -h event
        > -? question`,
    })
    embed.addFields({
        name: "Poll",
        value: `Post a poll with dates for options. 
        All titles MUST be in brackets [Title]
        > -poll [Poll name] mon, tue, wed, thu
        > -p 3 days
        
        For more help, type
        > -? poll`
    })
    embed.addFields({
        name: "Event",
        value: `Create an event on a date with a guest list
        All titles MUST be in brackets [Title]
        > -create [Event name] today at 5PM
        > -c tomorrow at 6:30p
        
        For more help, type
        > -? event`
    })
    embed.addFields({
        name: "Question",
        value: `Ask a question in the channel
        All titles MUST be in brackets [Title]
        > -question [The question?] opt1, opt2, ..., opt9
        > -q A, B, C, D
        
        For more help, type
        > -? question`
    })
    return embed
}

function _makePollHelpEmbed () {
    const embed = new Discord.MessageEmbed()
      .setColor("#7851a9")
      .setTitle("T3Sh Poll Commands Help")
      .setDescription("Poll for game scheduling with some options or with a phrase for the days")
    embed.addFields({
        name: "Call poll",
        value: `A poll can be called in one of 2 ways
        > -poll, -p

        The poll name MUST appear between brackets
        > -poll [Name] a, b, c
        
        The poll name is optional, it will default to [Poll]
        > -p a, b, c, d
        
        The poll name can appear in any part of the command
        > -p a, b, c, d [Name]
        
        The case of the command doesn't matter, the case of the name and options are kept as is
        > -P [Name] a, b, c, d
        > -PoLL [Proper YELLING!] A, b, C, D`
    })
    embed.addFields({
        name: "Poll by options",
        value: `The poll can have up to 9 options
        > -poll [Poll name] opt1, opt 2, opt_3, ... , opt 9
        
        The bot recognizes anything with a comma as being multiple options
        > poll option1, option 2, option 3 with extra words, option 4 with a 🥺
        
        The options should be a recognizable day of the week for auto-scheduling
        > poll [Name] Mon, tue, WEDNESDAY, Thurs, friday 

        The options MUST be separated by commas to be separate options
        > poll [Name] a, b, c, d`
    })
    embed.addFields({
        name: "Poll by phrase",
        value: `This poll will automatically post in calendar
        The poll can use many different phrases to guess the options
        To automatically generate a number of consecutive days, up to 9 days
        (parenthese not part of commands)
        > -poll [Name] 4 days (today to 3 days later)
        > -poll [Name] this week (now til Sunday)
        > -poll [Name] 1 week (7 days)
        > -poll [Name] this weekend (first Friday to Sunday)
        > -poll [Name] for next 8 days

        Add "next" in front to a phrase to skip the current day or week
        > -poll [Name] next 3 days (skips current day)
        > -poll [Name] next week (next Monday to Sunday)`
    })
    return embed
}

function _makeQuestionHelpEmbed () {
    const embed = new Discord.MessageEmbed()
      .setColor("#7851a9")
      .setTitle("T3Sh Question Commands Help")
      .setDescription("Ask a question with some options")
    embed.addFields({
        name: "Ask question",
        value: `Questions do not post in the calendar
        A question can be asked in one of 3 ways
        > -ask, -question, -q

        The poll name MUST appear between brackets
        > -question [Name] a, b, c
        
        The question name is optional, it will default to "Question"
        > -q a, b, c, d
        
        The poll name can appear in any part of the command
        > -ask a, b, c, d [Name]
        
        The case of the command doesn't matter, the case of the name and options are kept as is
        > -Q [Name] a, b, c, d
        > -ASk [Proper YELLING!] A, b, C, D`
    })
    embed.addFields({
        name: "Ask with options",
        value: `The poll can have up to 9 options
        > -poll [Poll name] opt1, opt 2, opt_3, ... , opt 9
        
        The bot recognizes anything with a comma as being multiple options
        > poll option1, option 2, option 3 with extra words, option 4 with a 🥺
        
        The options MUST be separated by commas to be separate options
        > poll [Name] a, b, c, d`
    })
    embed.addFields({
        name: "Ask without options",
        value: `Questions asked without options default to Yes and No
        The following 2 are equivalent
        > -ask "Should we start a new channel?"
        > -q "Should we start a new channel?" Yes, No`
    })
    return embed
}

function _makeEventHelpEmbed () {
    const embed = new Discord.MessageEmbed()
      .setColor("#7851a9")
      .setTitle("T3Sh Create Event Commands Help")
      .setDescription("Create an event on a date with a guest list")
    embed.addFields({
        name: "Create event",
        value: `An event can be created in one of 4 ways
        > -create, -c, -event, -make

        The event name MUST appear between brackets
        > -create [Name] today at 6:30 PM
        
        The event name is optional, it will default to [Event]
        > -c tomorrow at 4
        
        The poll name can appear in any part of the command
        > -make at 7p [Name]
        
        The case of the command and time don't matter, the case of the name is kept as is
        > -creATE [Name] on Monday at 7PM`
    })
    embed.addFields({
        name: "Event by time or phrase",
        value: `This event will automatically post in the calendar
        > -create [Event name] at 6:30pm
        
        You can define a day and/or a time
        > -event on Thu at 8:15pm

        You can define a date and/or a time
        > -event on 2/24 at 10:15a
        > -c 3-14 7p
        
        If you don't define a time, the default will be 6:30pm
        > -make on friday
        
        If you don't define a day, it'll default to today. 
        If AM/PM is not specified, it will default to PM 
        > -c at 2p
        > -make tomorrow at 6
        
        Day and time can be written relative from current time
        > -event in 3 days at 12:30 PM
        > -make in 4 hours`
    })
    return embed
}