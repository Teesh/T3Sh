import moment from 'moment'
import { settings } from '../config.js'

// TODO: Handle date inputs
export function single (input) {
    input = input.toLowerCase()
    let which_day = input.match(days)
    let what_time = input.match(times)
    let day = moment()
    let time
    if (!which_day && !what_time) return -1
    if (which_day) {
        which_day.sort((a, b) => b.length - a.length)
        let day_phrases = which_day[0].split(" ")
        let idx = 0
        let now = moment()
        let today = now.day()
        let day_offset = 0
        if (day_phrases[idx] == "today") {
            day = now
        } else if (day_phrases[idx] == "tomorrow") {
            day = now.add(1, "day")
        }
        if (day_phrases.length > 1) {
            idx = 1
            if (day_phrases[0] == "next") now.add(1, "week")
        }
        if (day_phrases.length > 2) {
            let val
            if (day_phrases[idx].includes("a")) {
                val = 1
            } else {
                val = parseInt(day_phrases[idx])
            }
            day.add(val, "day")
        }
        if (["sun", "sunday"].includes(day_phrases[idx])) {
            now.add(1, "week")
            day = now.day("Sunday")
        } else if (["mon", "monday"].includes(day_phrases[idx])) {
            if (today > 0) now.add(1, "week")
            day = now.day("Monday")
        } else if (["tue", "tues", "tuesday"].includes(day_phrases[idx])) {
            if (today > 1) now.add(1, "week")
            day = now.day("Tuesday")
        } else if (["wed", "wednesday"].includes(day_phrases[idx])) {
            if (today > 2) now.add(1, "week")
            day = now.day("Wednesday")
        } else if (["thu", "thur", "thurs", "thursday"].includes(day_phrases[idx])) {
            if (today > 3) now.add(1, "week")
            day = now.day("Thursday")
        } else if (["fri", "friday"].includes(day_phrases[idx])) {
            if (today > 4) now.add(1, "week")
            day = now.day("Friday")
        } else if (["sat", "saturday"].includes(day_phrases[idx])) {
            if (today > 5) now.add(1, "week")
            day = now.day("Saturday")
        }
    }

    if (what_time) {
        what_time.sort((a, b) => b.length - a.length)
        let time_phrases = what_time[0].split(" ")
        if (["hour", "hours"].some(r => time_phrases.includes(r))) {
            let idx = 0
            
            if (time_phrases[idx].includes("in")) idx = 1
            let val
            
            if (time_phrases[idx].includes("a")) {
                val = 1
            } else {
                val = parseInt(time_phrases[idx])
            }

            let minute
            if (day.minute() < 15) minute = 0
            else if (day.minute() >= 15 && day.minute() < 45) minute = 30
            else {
                val++
                minute = 0
            }
            time = day.add(val, "hour").minute(minute)
        } else {
            let idx = 0
            if (time_phrases[idx].includes("at")) idx = 1
            let hour = 0, minute

            if (time_phrases[idx+1]) {
                if (time_phrases[idx+1].indexOf("p") != -1) hour += 12
            } else {
                if (time_phrases[idx].indexOf("p") != -1) hour += 12
                else {
                    if (!time_phrases[idx].includes("a") && settings.default_meridiem == "PM") hour += 12
                }
                time_phrases[idx].replace(/\b[ap][m]?\b/, "")
            }

            if (time_phrases[idx].includes(':')) {
                hour += parseInt(time_phrases[idx].split(":")[0])
                minute = parseInt(time_phrases[idx].split(":")[1])
            } else {
                if (time_phrases[idx].length < 3) {
                    hour += parseInt(time_phrases[idx])
                    minute = 0
                } else if (time_phrases[idx].length < 4) {
                    hour += parseInt(time_phrases[idx][0])
                    minute = parseInt(time_phrases[idx].substring(1, 2))
                } else if (time_phrases[idx].length == 4) {
                    hour = parseInt(time_phrases[idx].substring(0, 1))
                    minute = parseInt(time_phrases[idx].substring(2, 3))
                }
            }
            time = day.hour(hour).minute(minute)
        }
    }
    
    if (!time) {
        let [default_hour, default_minute] = settings.default_event_time.split(':')
        default_hour = parseInt(default_hour)
        default_minute = parseInt(default_minute)
        if (settings.default_meridiem == "PM") default_hour += 12
        time = day.hour(default_hour).minute(default_minute)
    }
    return time
}

// TODO: Handle numerical input week(end)s
// TODO: Handle CSV inputs
export function range (input) {
    input = input.toLowerCase()
    let what_days = input.match(ranges)
    let today = moment()
    let num_days, which_week, start_day = 0
    if (what_days) {
        let option_phrases = what_days[0].split(" ")
        if (option_phrases.includes('days')) {
            num_days = option_phrases[option_phrases.indexOf('days')-1]
            if (option_phrases[option_phrases.indexOf('days')-2] == "next") {
                start_day = 1
            }
        } else if (option_phrases.includes('week') || option_phrases.includes('weeks')) {
            which_week = option_phrases[option_phrases.indexOf('week')-1] || option_phrases[option_phrases.indexOf('weeks')-1]
            if (["a", "all", "1", "one"].includes(which_week)) {
                // also the default choice
                num_days = 7
            } else if (which_week == "this") {
                let a = today.clone()
                let b = today.clone().endOf('week')
                num_days = b.diff(a, 'days') + 1
            } else if (which_week == "next") {
                let a = today.clone()
                let b = today.clone().endOf('week')
                start_day = b.diff(a, 'days') + 2
                num_days = 7
            } else {
                num_days = 7
            }
        } else if (option_phrases.includes('weekend') || option_phrases.includes('weekends')) {
            which_week = option_phrases[option_phrases.indexOf('weekend')-1] || option_phrases[option_phrases.indexOf('weekends')-1]
            if (which_week == "this") {
                let a = today.clone()
                let b = today.clone().endOf('week')
                num_days = b.diff(a, 'days') + 1
                start_day = num_days - 2
                if (start_day < 0) start_day = 0
                if (num_days > 3) num_days = 3
            } else if (which_week == "next") {
                let a = today.clone()
                let b = today.clone().endOf('week')
                num_days = b.diff(a, 'days') + 1
                start_day = num_days - 2
                if (start_day <= 0) {
                    num_days = 3
                    b.add(1, "d").endOf("week")
                    start_day = b.diff(a, 'days') - 1
                }
                if (num_days > 3) num_days = 3
            } else {
                let a = today.clone()
                let b = today.clone().endOf('week')
                num_days = b.diff(a, 'days') + 1
                start_day = num_days - 2
                if (start_day < 0) start_day = 0
                if (num_days > 3) num_days = 3
            }
        }
    }
    if (num_days > 9) num_days = 9
    if (!num_days) num_days = settings.default_poll_options
    let x = today.clone()
    x.add(start_day, "d")
    let options = []
    for (let i = 0; i < num_days; i++) {
        options.push(x.clone().add(i, "d"))
    }
    return options
}

const days = /\b(((on|this|next) )?((to|mon|tue(s)?|wed(nes)?|thu(r)?(s)?|fri|sat(ur)?|sun))(day|morrow)?)|(in )?(a|[0-9]{1,2}) (day(s)?)\b/g
const times = /\b((at )?[0-1]?[0-9]|2[0-3]):?([0-5][0-9])?(( )?[ap][m]?)?|(in )?([0-9]{1,2}|(a(n)?)) ((hour)(s)?)\b/g

const ranges = /\b((for )?(a|all|this|next) )?(([1-9]) )?((day|week(end)?(day)?)(s)?)\b/g
