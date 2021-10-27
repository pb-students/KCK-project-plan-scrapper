import { fetchTeacherList, fetchTeacherSchedule } from './scrapper.js'
import { parseDuration, parseClass } from './parser.js'

fetchTeacherList().then(async teachers => {
    // console.log(teachers)
    const schedules = await Promise.all(Object.keys(teachers).map(id => fetchTeacherSchedule(id)))
    for (const { schedule, name } of schedules) {
        console.log(name)

        for (const [name, day] of Object.entries(schedule)) {
            console.log(name)

            for (const [duration, classes] of Object.entries(day)) {
                for (const clazz of classes) {
                    console.log(parseDuration(duration))
                    console.log(parseClass(clazz))
                }
            }
        }
    }
})

/*
fetchTeacherSchedule(96).then(({ schedule }) => {
    for (const [name, day] of Object.entries(schedule)) {
        console.log(name)

        for (const [duration, classes] of Object.entries(day)) {
            for (const clazz of classes) {
                console.log(parseDuration(duration))
                console.log(parseClass(clazz))
            }
        }
    }
})
*/
