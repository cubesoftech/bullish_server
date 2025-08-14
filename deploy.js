
const access1 = 'ssh trusseon-server@154.18.187.109'
const access11 = 'ssh trusseonglobal-server@154.18.187.109'
const access2 = 'cd htdocs/server.trusseon.com'
const access21 = 'cd htdocs/server.trusseonglobal.com'
const run = "npm run build && pm2 delete all && pm2 start npm --name server -- start && pm2 logs --lines 1000"