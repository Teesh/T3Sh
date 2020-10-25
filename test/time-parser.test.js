import * as TimeParser from '../utilities/time-parser.js'

// TODO: make debug flag
let debug = 1

// TODO: check output for correctness, not just crash
if (process.argv[2] == "single" && process.argv[3]) {
    console.log(`Trying phrase: ${process.argv[3]}`)
    try {
        let output = TimeParser.single(process.argv[3].format("dddd, MMMM Do YYYY, h:mm a"))
        console.log(`✔️  ${output}\n`)
    } catch (e) {
        console.log(`❌ ${e}\n`)
        if (debug) console.log(e)
        console.log('')
    }
} else if (process.argv[2] == "range" && process.argv[3]) {
    console.log(`Trying phrase: ${process.argv[3]}`)
    try {
        let output = TimeParser.range(process.argv[3])
        for (let item of output) {
            console.log(`✔️  ${item.format("ddd Do")}`)
        }
        console.log('')
    } catch (e) {
        console.log(`❌ ${e}\n`)
        if (debug) console.log(e)
        console.log('')
    }
} else {
    if (!process.argv[2] || process.argv[2] == "single") {
        let single_phrases = [
            "on Monday at 7:30pm",
            "at 6 pm on Tue",
            "7 tomorrow",
            "8p today",
            "11:30 AM on Friday",
            "in an hour",
            "in 2 hours",
            "in a day",
            "in 3 days at 4p",
            "today at 6:13"
        ]
        
        for (let phrase of single_phrases) {
            console.log(`Trying phrase: ${phrase}`)
            try {
                let output = TimeParser.single(phrase).format("dddd, MMMM Do YYYY, h:mm a")
                console.log(`✔️  ${output}\n`)
            } catch (e) {
                console.log(`❌ ${e}\n`)
                if (debug) console.log(e)
                console.log('')
            }
        }
    }
    
    if (!process.argv[2] || process.argv[2] == "range") {
        let range_phrases = [
            "a week",
            "this week",
            "next weekend",
            "3 weekends",
            "for 5 days",
            "for next 3 days",
            "2 weeks",
            "next 4 days"
        ]
        
        for (let phrase of range_phrases) {
            console.log(`Trying phrase: ${phrase}`)
            try {
                let output = TimeParser.range(phrase)
                for (let item of output) {
                    console.log(`✔️  ${item.format("ddd Do")}`)
                }
                console.log('')
            } catch (e) {
                console.log(`❌ ${e}\n`)
                if (debug) console.log(e)
                console.log('')
            }
        }
    }
}
