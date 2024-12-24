import { instancev2, sendWebhook, sleep, getProxy, getTime } from './utils.js'

export class Monitor {

  constructor(pid) {
    this.pid = pid
    this.proxy = getProxy()
    this.previousStock = []
    this.currentStock = []
    this.start()
  }

  init = async () => {
    const t1 = performance.now()
    try {
      const response = await instancev2.get(`https://api.3stripes.net/gw-api/v2/products/${this.pid}/availability`, { proxy: false, httpsAgent: this.proxy })
      for( let x = 0, n = response.data._embedded.variations .length; x < n; x++ ) {
        this.previousStock[x] = { 
          size: response.data._embedded.variations[x].size,
          qty: response.data._embedded.variations[x].stock_level === -1 ? 15 : response.data._embedded.variations[x].stock_level
        }
      }
      const t2 = performance.now()
      console.log(`${getTime()} Initialized ${this.pid} ${(t2-t1).toFixed(2)}ms`)
    }
    catch (err) {
      const t2 = performance.now()
      if( err.response ) {
        if( err.response.status === 404 ) {
          this.previousStock = []
          console.log(`${getTime()} Initialized ${this.pid} (product not loaded) ${(t2-t1).toFixed(2)}ms`)
          return await this.loop()
        } 
      }
      else console.log(`${getTime()} ${this.pid} ${err.message}`)
      await sleep(5000)
      return await this.init()
    }
  }

  loop = async () => {
    while(true) {
      this.currentStock = []
      await instancev2.get(`https://api.3stripes.net/gw-api/v2/products/${this.pid}/availability`, { proxy: false, httpsAgent: this.proxy })
      .then( response => {
        for( let x = 0, n = response.data._embedded.variations .length; x < n; x++ ) {
          this.currentStock[x] = { 
            size: response.data._embedded.variations[x].size,
            qty: response.data._embedded.variations[x].stock_level === -1 ? 15 : response.data._embedded.variations[x].stock_level
          }
        }
        this.instock = []
        if( !this.previousStock.length && this.currentStock.length ) {
          for( let x = 0, n = this.currentStock.length; x < n; x++ ) {
            this.instock.push(`${this.currentStock[x].size} [${this.currentStock[x].qty}]\n`)
          }
          return sendWebhook({ pid: this.pid, sizes: this.instock })
        }
        for( let x = 0, n = this.currentStock.length; x < n; x++ ) {
          this.previousVariant = this.previousStock.find( variant => variant.size === this.currentStock[x].size )
          if( this.currentStock[x].qty > 0 && this.previousVariant.qty === 0 ) {
            console.log(`${getTime()} Restock ${this.pid} ${this.currentStock[x].size} ${this.currentStock[x].qty}`)
            this.instock.push(`${this.currentStock[x].size} [${this.currentStock[x].qty}]\n`)
          } 
        }
        if(this.instock.length) sendWebhook({ pid: this.pid, sizes: this.instock })
        this.previousStock = [...this.currentStock]
      })
      .catch( async err => {
        if( err.response ) {
          if( err.response.status === 404 ) return
        }
        console.log(`${getTime()} ${err.message}`)
        this.proxy = getProxy()
      })
      await sleep(5000)
    }
  }

  start = async() => {
    setInterval(() => { this.proxy = getProxy() }, 300000)
    await this.init()
    await this.loop()
  }
}