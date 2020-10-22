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

/* 
-ranges
this week
next week
1 day
3 days
2 weekends
4 weekdays
this weekend
next weekend
1 week

-times
at 12:00pm
1:00a
at 07:50p
0900
2350
730p
at 0730
1030
at 6
at 7pm
at 8 p

-days
this monday
next monday
friday
on tues
today
tomorrow

-relative time
in 1 day
in 2 days
3 hours
4 days
in a day
in an hour
in 12 hours
in 1 hour
*/