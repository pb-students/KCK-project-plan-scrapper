import { fetchTeacherList, fetchTeacherSchedule } from './scrapper.js'
import fastify from 'fastify'

const app = fastify()

const fetchAllTeachers = async () => await Promise.all(Object.keys(await fetchTeacherList()).map(id => fetchTeacherSchedule(id)))
const fetchSchedule = async () => {
  const schedule = { 'poniedziałek': {}, wtorek: {}, 'środa': {}, czwartek: {}, 'piątek': {}, sobota: {}, niedziela: {} }

  for (const teacher of await fetchAllTeachers()) {
    for (const [day, hours] of Object.entries(teacher.schedule)) {
      schedule[day] ??= {}

      for (const [hour, classes] of Object.entries(hours)) {
        schedule[day][hour] ??= []
        schedule[day][hour].push(...classes.map(clazz => {
          clazz.teacher = { name: teacher.name, id: teacher.id }
          return clazz
        }))
      }
    }
  }

  return schedule
}

app.get('/teachers', async (request, reply) => {
    return fetchTeacherList()
})

app.get('/teachers/:id', async (request, reply) => {
    return fetchTeacherSchedule(request.params.id)
})

app.get('/schedule', async (request, reply) => {
  return fetchSchedule()
})

app.get('/degrees', async (request, reply) => {
  const degrees = {}

  const degreeMap = {
    'mat. stos.': 'mat. stosow.'
  }

  for (const day of Object.values(await fetchSchedule())) {
    for (const hour of Object.values(day)) {
      for (const clazz of hour) {
        if (clazz.degree === null) {
          continue
        }

        const name = clazz.degree in degreeMap ? degreeMap[clazz.degree] : clazz.degree
        degrees[name] ??= {
          name,
          semesters: new Set(),
          specs: new Set()
        }

        if (clazz.semester !== null) {
          degrees[name].semesters.add(clazz.semester)
        }

        if (clazz.spec !== null) {
          degrees[name].specs.add(clazz.spec)
        }
      }
    }
  }

  for (const degree of Object.values(degrees)) {
    degree.semesters = [...degree.semesters]
    degree.specs = [...degree.specs]
  }

  return degrees
})

console.log('Server starting...')
await fetchAllTeachers()
console.log(`Server is running on port 2137`)
app.listen(2137)
