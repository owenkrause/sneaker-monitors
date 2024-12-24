import { Monitor } from './src/monitor.js'

// add pids here
const pids = [ 
  '0400017479605',
]

pids.forEach(pid => {
  new Monitor(pid)
})