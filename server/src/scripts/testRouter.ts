import 'dotenv/config'
import { routeQuery } from '../services/router/queryRouter.js'

const tests = [
  {
    question: 'Summarize the uploaded PDF.',
    hasDocuments: true,
  },
  {
    question: 'What are the latest AI developments in 2026?',
    hasDocuments: true,
  },
  {
    question: 'Compare the PDF findings with recent research.',
    hasDocuments: true,
  },
  {
    question: 'Explain how machine learning works.',
    hasDocuments: false,
  },
]

const runTests = async () => {
  for (const test of tests) {
    console.log('\nQuestion:', test.question)

    const result = await routeQuery(
      test.question,
      test.hasDocuments
    )

    console.log('Selected mode:', result.mode)
    console.log('Reason:', result.reason)
  }
}

runTests().catch(console.error)