import { connect, Pid } from './src/utils.js'
import { monitor } from './src/monitor.js'

await connect()

const pids = await Pid.find()
for( let i = 0, n = pids.length; i < n; i++ ) {
  pids[i] = pids[i].pid
}

await monitor(pids)