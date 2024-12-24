import { Monitor } from './src/monitor.js'

let pids = [ 
  'ID0780', 'ID2529', 'ID2534'
]

for( let x = 0; x < pids.length; x++ ) {
  new Monitor(pids[x])
}
