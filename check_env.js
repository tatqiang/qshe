// Quick environment variable check
import { loadEnv } from 'vite'

const env = loadEnv('development', process.cwd(), '')

console.log('Environment Variables:')
Object.keys(env).forEach(key => {
  if (key.startsWith('VITE_')) {
    console.log(`${key}: ${env[key]}`)
  }
})

console.log('\nSpecific Azure variables:')
console.log('VITE_AZURE_TENANT_ID:', env.VITE_AZURE_TENANT_ID)
console.log('VITE_AZURE_COMPANY_CLIENT_ID:', env.VITE_AZURE_COMPANY_CLIENT_ID)