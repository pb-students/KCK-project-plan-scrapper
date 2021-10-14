import axios from 'axios'
import cheerio from 'cheerio'
import NodeCache from 'node-cache'

const LIST_URL = 'https://degra.wi.pb.edu.pl/rozklady/rozklad.php?page=nau'
const TEACHER_URL = `${LIST_URL}&id=`

const TTL_LIST = 1e5 * 36 * 24
const TTL_TEACHER = 1e5 * 36

const KEY_LIST = 'teachers'
const KEY_TEACHER = 'teachers__'

const cache = new NodeCache()

export const fetchTeacherList = async () => {
  const cached = cache.get(KEY_LIST)
  if (cached) {
    return cached
  }

  const { data } = await axios.get(LIST_URL)
  const $ = cheerio.load(data)

  const res = {}
  $('select#teacher > option').each((i, node) => {
    const el = $(node)
    res[+el.val()] = el.text()
  })

  cache.set(KEY_LIST, res, TTL_LIST)
  return res
}


export const fetchTeacherSchedule = async id => {
  const cached = cache.get(KEY_TEACHER + id)
  if (cached) {
    return cached
  }

  const list = await fetchTeacherList()

  if (!(id in list)) {
    throw new Error(`Teacher with id ${id} does not exist`)
  }

  const { data } = await axios.get(TEACHER_URL + id)
  const $ = cheerio.load(data)

  const res = { id, name: list[id], schedule: {} }

  let curr = $('.img_caption ~ h2').next()
  const row = {}
  while (curr.prop('tagName') !== 'SCRIPT') {
    switch (curr.prop('tagName')) {
      case 'H4':
        if ('id' in row) {
          res.schedule[row.id] = row.data
        }

        row.id = curr.text()
        row.data = {}
        break;

      case 'P':
        curr.text().replace(/^(.+?): (.+)/gm, (_, $1, $2) => (row.data[$1] = $2))
        break;
    }

    curr = curr.next()
  }

  if ('id' in row) {
    res.schedule[row.id] = row.data
  }

  cache.set(KEY_TEACHER + id, res, TTL_TEACHER)
  return res
}

fetchTeacherSchedule(75)
  .then(console.log)
  .catch(console.error)
