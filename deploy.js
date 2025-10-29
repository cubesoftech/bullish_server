const access1 = 'ssh bullish-korea-server@154.18.187.109'
const access2 = 'cd htdocs/server.bullish-korea.com'

const run = "npm run build && pm2 delete all && pm2 start npm --name server -- start && pm2 logs --lines 1000"