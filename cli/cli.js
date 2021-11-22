import prompts from 'prompts'
import axios from 'axios'

const API_URL = 'http://localhost:2137'

const { data: degrees } = await axios.get(`${API_URL}/degrees`)
console.log(degrees)

const { value } = await prompts({
  type: 'text',
  name: 'value',
  message: 'meh'
})

console.log(value)
