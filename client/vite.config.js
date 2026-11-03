import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  // Resolve hotel_API_URL across any case format or environment source
  const resolvedApiUrl =
    process.env.hotel_API_URL ||
    process.env.HOTEL_API_URL ||
    process.env.VITE_HOTEL_API_URL ||
    process.env.VITE_API_URL ||
    env.hotel_API_URL ||
    env.HOTEL_API_URL ||
    env.VITE_HOTEL_API_URL ||
    env.VITE_API_URL ||
    ''

  return {
    plugins: [react()],
    // Expose variables prefixed with hotel_ or HOTEL_ to the client
    envPrefix: ['VITE_', 'hotel_', 'HOTEL_'],
    define: {
      'import.meta.env.hotel_API_URL': JSON.stringify(resolvedApiUrl),
      'import.meta.env.HOTEL_API_URL': JSON.stringify(resolvedApiUrl),
      'import.meta.env.VITE_HOTEL_API_URL': JSON.stringify(resolvedApiUrl),
      'import.meta.env.VITE_API_URL': JSON.stringify(resolvedApiUrl),
    },
  }
})
