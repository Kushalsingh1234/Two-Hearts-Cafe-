import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

function razorpayDevApiPlugin(env) {
  return {
    name: 'razorpay-dev-api',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const parsedUrl = req.url ? req.url.split('?')[0] : ''
        if (parsedUrl === '/api/create-order' || parsedUrl === '/api/verify-payment') {
          // Expose env vars to process.env during local dev
          Object.assign(process.env, env)

          let body = ''
          req.on('data', (chunk) => {
            body += chunk
          })
          req.on('end', async () => {
            try {
              req.body = body ? JSON.parse(body) : {}
            } catch {
              req.body = {}
            }

            // Mock express/Vercel helpers
            res.status = (code) => {
              res.statusCode = code
              return res
            }
            res.json = (data) => {
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify(data))
              return res
            }

            try {
              if (parsedUrl === '/api/create-order') {
                const handler = (await import('./api/create-order.js')).default
                return handler(req, res)
              } else if (parsedUrl === '/api/verify-payment') {
                const handler = (await import('./api/verify-payment.js')).default
                return handler(req, res)
              } else if (parsedUrl === '/api/send-order-push') {
                const handler = (await import('./api/send-order-push.js')).default
                return handler(req, res)
              }
            } catch (err) {
              console.error('API dev handler error:', err)
              res.statusCode = 500
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ success: false, error: err.message }))
            }
          })
          return
        }
        next()
      })
    }
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    plugins: [react(), razorpayDevApiPlugin(env)],
    server: {
      watch: {
        ignored: ['**/android/**', '**/*.apk', '**/build-apk/**']
      }
    }
  }
})
