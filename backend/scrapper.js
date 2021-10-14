import axios from 'axios'
import cheerio from 'cheerio'
import NodeCache from 'node-cache'

const TEACHER_LIST_URL = 'https://degra.wi.pb.edu.pl/rozklady/rozklad.php?page=nau'
const TEACHER_URL = `${TEACHER_LIST_URL}&id=`

const KEY_TEACHERS = 'teachers'

const cache = new NodeCache()

export const fetchTeacherList = async () => {
  const cached = cache.get(KEY_TEACHERS)
  if (cached) {
    return cached
  }

  const { data } = await axios.get(TEACHER_LIST_URL)
  const $ = cheerio.load(data)

  const res = {}
  $('select#teacher > option').each((i, node) => {
    const el = $(node)
    res[+el.val()] = el.text()
  })

  cache.set(KEY_TEACHERS, res, 1e5 * 36 * 24)
  return res
}

