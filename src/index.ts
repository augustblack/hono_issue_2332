import { Hono } from 'hono'
// import { serveStatic } from 'hono/cloudflare-workers'
export { SignalServer } from './signalserver'

type Bindings = {
  SIGNAL_SERVER: DurableObjectNamespace
}

const app = new Hono<{ Bindings: Bindings }>()

// app.use('*', serveStatic({ root: './' }))
app.use('*', (c) => {
  const id = c.env.SIGNAL_SERVER.idFromName('A')
  const obj = c.env.SIGNAL_SERVER.get(id)
  // console.log('url:', c.req.url, c.req.header())
  return obj.fetch(c.req.url, c.req)
})

export default app
