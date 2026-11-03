import 'dotenv/config'
import { searchWeb } from '../services/web-search/tavilyService.js'

const runTest = async () => {
  const results = await searchWeb(
    'Latest developments in artificial intelligence in 2026'
  )

  console.log('\nWeb search results:\n')

  results.forEach((result, index) => {
    console.log(`Source ${index + 1}:`)
    console.log('Title:', result.title)
    console.log('URL:', result.url)
    console.log('Content:', result.content)
    console.log('Published:', result.publishedDate)
    console.log('-------------------------')
  })
}

runTest().catch(console.error)