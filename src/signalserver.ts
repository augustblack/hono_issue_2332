import { Hono } from 'hono'


const html = `
<html>
  <head>
    <style>
      body {
        margin: 1rem;
        font-family: monospace;
      }
    </style>
    </head>
<body>
<script>
 
  let ws

  function websocket(url) {
    console.log('url', url)
    ws = new WebSocket(url)

    if (!ws) {
      throw new Error("server didn't accept ws")
    }

    ws.addEventListener("open", () => {
      console.log('Opened websocket')
    })

    ws.addEventListener("message", ({ data }) => {
      try {
        const msg = JSON.parse(data)
        console.log('msg', msg)
      } catch (error) {
        console.log('msg decode error:', error)
      }
    })

    ws.addEventListener("close", () => {
      console.log('Closed websocket')
    })
      
    ws.addEventListener("close", () => {
      console.log('Closed websocket')
    })
  }

  const url = new URL(window.location)
  url.protocol =  url.protocol === 'https:' ? "wss" : "ws"
  url.pathname = "/ws"
  console.log('url', url.href)
  websocket(url.href)

  </script>
 </body>
</html>
`
export class SignalServer {
  state: DurableObjectState
  app: Hono = new Hono()

  constructor(state: DurableObjectState) {
    this.state = state

    this.app.get('/ws', async (c) => {
      const upgradeHeader = c.req.header('Upgrade')
      console.log('headers:', c.req.header()) //  IN V3,  HEADERS EXIST.  IN V4, THERE ARE NO HEADERS HERE
      if (upgradeHeader !== 'websocket') {
        console.log('NO upgrade HEADER', upgradeHeader)
        return c.text('Expected websocket', 400)
      }

      let currentValue = await this.state.storage?.get<number>('count') || 0
      currentValue = currentValue + 1
      await this.state.storage?.put('count', currentValue)

      const [client, server] = Object.values(new WebSocketPair())

      this.state.acceptWebSocket(server, ['signal'])
      return new Response(null, {
        status: 101,
        webSocket: client,
      })
    })

    this.app.get('/', async () => {
      return new Response(html, { headers: { 'Content-Type': 'text/html;charset=UTF-8' } })
    })
  }
  async fetch(request: Request) {
    return this.app.fetch(request)
  }
}
