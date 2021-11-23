import prompts from 'prompts'
import axios from 'axios'
import { table } from 'table'
import { writeFile, readFile, mkdir, rm } from 'fs/promises'
import { join } from 'path'
import { xdgConfig } from 'xdg-basedir'
import chalk from 'chalk'
import { DateTime } from 'luxon'

const API_URL = 'http://localhost:2137'

const { data: degrees } = await axios.get(`${API_URL}/degrees`)

const configDir = join(xdgConfig, 'kck-scrapper')
const configFile = join(configDir, 'config.json')

const orange = chalk.hex('#ffaa00')

const today = new Date().getDay() - 1
const startDate = DateTime.now().month > 9
  ? DateTime.now().set({ day: 1, month: 10 })
  : DateTime.now().minus({ year: 1 }).set({ day: 1, month: 10 })

const isOdd = !!(DateTime.now().weekNumber - (startDate.weekNumber % 2)) % 2

try {
  await mkdir(configDir)
} catch (_) {}

loop: while (true) {
  let config = false
  try {
    config = JSON.parse(await readFile(configFile))
  } catch (_) {}

  if (!config) {
    const { isStationary } = await prompts({
      type: 'toggle',
      name: 'isStationary',
      message: 'Wybierz rodzaj studiów:',
      active: 'Stacjonarne',
      inactive: 'Niestacjonarne',
      initial: true
    })

    const mapChoices = c => ({ title: c, value: c })

    const { degree } = await prompts({
      type: 'select',
      name: 'degree',
      message: 'Wybierz kierunek:',
      choices: Object.keys(degrees[isStationary]).map(mapChoices)
    })

    const { stage } = await prompts({
      type: 'select',
      name: 'stage',
      message: 'Wybierz stopień studiow:',
      choices: Object.keys(degrees[isStationary][degree]).map(mapChoices)
    })

    const { semester } = await prompts({
      type: 'select',
      name: 'semester',
      message: 'Wybierz semestr:',
      choices: Object.keys(degrees[isStationary][degree][stage]).map(mapChoices)
    })

    const { groups } = await prompts({
      type: 'multiselect',
      name: 'groups',
      message: 'Wybierz grupy:',
      choices: Object.keys(degrees[isStationary][degree][stage][semester]).map(mapChoices)
    })

    config = { isStationary, degree, stage, semester, groups, additional: [] }
    await writeFile(configFile, JSON.stringify(config))
  }

  const { isStationary, degree, stage, semester, groups } = config

  const tableData = [['']]
  const { data: schedule } = await axios.get(`${API_URL}/schedule`)

  const durations = {}
  for (const day of Object.keys(schedule)) {
    tableData[0].push(day)
    durations[day] ??= []
  }

  for (const [day, hours] of Object.entries(schedule)) {
    for (const [hour, classes] of Object.entries(hours)) {
      durations[hour] = classes[0].duration
      for (const clazz of classes) {
        clazz.dayIndex = tableData[0].indexOf(day) - 1
      }
    }
  }

  const acc = {}
  for (const duration of Object.values(durations).sort((a, b) => a.from - b.from)) {
    acc[`${duration.fromLabel} - ${duration.toLabel}`] = []
  }

  const classesByHour = Object.values(schedule).reduce((acc, hours) => {
    for (const classes of Object.values(hours)) {
      const [{ duration }] = classes
      acc[`${duration.fromLabel} - ${duration.toLabel}`].push(...classes)
    }

    return acc
  }, acc)

  const additionalArr = []
  for (const [hour, classes] of Object.entries(classesByHour)) {
    const _classes = classes.filter(clazz => {
      return clazz.type === 'class'
        && clazz.isStationary === isStationary
        && clazz.stage.toString() === stage
        && clazz.degree === degree
        && clazz.semester.toString() === semester
    })

    for (const clazz of _classes) {
      const day = tableData[0][clazz.dayIndex + 1]
      additionalArr.push({
        title: `${clazz.name} | ${clazz.group} | ${day} ${hour}`,
        value: JSON.stringify(clazz)
      })
    }
  }

  for (const [hour, classes] of Object.entries(classesByHour)) {
    const row = [hour]

    for (let i = 0; i < 7; ++i) {
      const cellElements = classes.filter(clazz => {
        return clazz.type === 'class'
          && clazz.isStationary === isStationary
          && clazz.stage.toString() === stage
          && clazz.degree === degree
          && clazz.semester.toString() === semester
          && clazz.isEven === !isOdd
          && (groups.includes(clazz.group) || !clazz.group)
          && !clazz.elective
      })

      cellElements.push(...config.additional.map(clazz => JSON.parse(clazz)).filter(clazz => {
        return hour === `${clazz.duration.fromLabel} - ${clazz.duration.toLabel}`
      }))

      const cell = cellElements.filter(clazz => clazz.dayIndex === i)
        .map(clazz => clazz.name)
        .sort()
        .join('\n')

      row.push(i === today ? orange(cell) : cell)
    }

    if (row.slice(1).join('') !== '') {
      tableData.push(row)
    }
  }

  tableData[0][today + 1] = chalk.bold(orange(tableData[0][today + 1]))

  menu: while (true) {
    const { choice } = await prompts({
      type: 'select',
      name: 'choice',
      message: 'Wybierz opcje:',
      choices: [
        { title: 'Sprawdź plan', value: 0 },
        { title: 'Resetuj ustawienia', value: 1 },
        { title: 'Dodatkowe przedmioty', value: 2 },
        { title: 'Zamknij', value: -1 }
      ]
    })

    switch (choice) {
      case 0:
        console.log(table(tableData))
        break

      case 1:
        await rm(configFile)
        break menu

      case 2:
        const { additional } = await prompts({
          type: 'autocompleteMultiselect',
          name: 'additional',
          message: 'Wybierz dodatkowe przedmioty:',
          choices: additionalArr
        })

        config.additional = additional
        await writeFile(configFile, JSON.stringify(config))
        break menu

      case -1:
        break loop
    }
  }
}
