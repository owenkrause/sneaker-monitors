import { Monitor } from './src/monitor.js'

const pids = [ 
  { pid: '205759', cid: '' },
  { pid: '207920', cid: '' },
  { pid: '207393', cid: '' },
  { pid: '208685', cid: '' },
  { pid: '208527', cid: '' },
  { pid: '207989', cid: '001' },
  { pid: '207989', cid: '100' },
  { pid: '207989', cid: '6UB' },
  { pid: '207989', cid: '2Y2' },
  { pid: '206302', cid: '001' },
  { pid: '206302', cid: '100' },
  { pid: '206302', cid: '001' },
  { pid: '208613', cid: '' },
  { pid: '208327', cid: '' },
  { pid: '209244', cid: '' },
  { pid: '207390', cid: '' },
  { pid: '208335', cid: '' },
  { pid: '208817', cid: '' },
  { pid: '208883', cid: '' },
  { pid: '208819', cid: '' },
  { pid: '208267', cid: '' },
]

pids.forEach(pid => {
  new Monitor(pid)
})