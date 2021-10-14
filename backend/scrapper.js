import axios from 'axios'
import cheerio from 'cheerio'

const TEACHER_LIST_URL = 'https://degra.wi.pb.edu.pl/rozklady/rozklad.php?page=nau'
const TEACHER_URL = `${TEACHER_LIST_URL}&id=`

const fetchTeacherList = async () => {
  const { data } = await axios.get(TEACHER_LIST_URL)
  const $ = cheerio.load(data)

  const res = {}
  $('select#teacher > option').each((i, node) => {
    const el = $(node)
    res[+el.val()] = el.text()
  })

  return res
}

fetchTeacherList().then(console.log)
