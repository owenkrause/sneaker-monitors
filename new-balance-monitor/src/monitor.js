import { instance, sleep, getProxy, getTime, sendWebhook } from './utils.js'

export class Monitor {

  constructor(pid, style) {
    this.pid = pid
    this.style = style
    this.previousStock = []
    this.currentStock = []
    this.proxy = getProxy()
    this.start()
  }

  init = async() => {
    try {
      const response = await instance.get(`https://www.newbalance.com/on/demandware.store/Sites-NBUS-Site/en_US/Wishlist-GetProduct?pid=${this.pid}`, { proxy: false, httpsAgent: this.proxy })
      if( !response.data.product.variationAttributes ) return
      const sizeVariations = response.data.product.variationAttributes.find(x => x.attributeId === 'size').values
      for( let i = 0, n = sizeVariations.length; i < n; i++ ) {
        this.previousStock[i] = {
          size: sizeVariations[i].displayValue,
          available: sizeVariations[i].selectable
        }
      }
    } catch (err) {
      if( err.response ) console.log(err.message)
      else console.log(err)
    }
  }

  loop = async() => {
    while(true) {
      try {
        const response = await instance.get(`https://www.newbalance.com/on/demandware.store/Sites-NBUS-Site/en_US/Wishlist-GetProduct?pid=${this.pid}`, { proxy: false, httpsAgent: this.proxy })
        if( !response.data.product.variationAttributes ) { 
          await sleep(3000)
          continue 
        }
        const sizeVariations = response.data.product.variationAttributes.find(x => x.attributeId === 'size').values
        for( let i = 0, n = sizeVariations.length; i < n; i++ ) {
          this.currentStock[i] = {
            size: sizeVariations[i].displayValue,
            available: sizeVariations[i].selectable
          }
        }
        const available = []
        for( let i = 0, n = this.currentStock.length; i < n; i++ ) {
          if( !this.previousStock.length && this.currentStock[i].available === true ) {
            available.push(`${this.currentStock[i].size}\n`)
            continue
          } 
          const previousVariant = this.previousStock.find(x => x.size === this.currentStock[i].size)
          if( previousVariant.available === false && this.currentStock[i].available === true ) {
            available.push(`${this.currentStock[i].size}\n`)
            console.log(`${getTime()} [Restock] ${this.style} ${this.currentStock[i].size}`)
          }
        }
        if( available.length ) {
          sendWebhook({
            pid: this.pid,
            style: this.style,
            name: response.data.product.productName,
            gender: response.data.product.gender,
            price: response.data.product.price.sales.value,
            image: response.data.product.images.productDetail[0].src,
            sizes: available
          })
        }
        this.previousStock = [...this.currentStock]
      } catch (err) {
        if( err.response || err.request ) console.log(err.message)
        else console.log(err)
      }
      await sleep(3000)
    }
  }

  start = async() => {
    console.log(`${getTime()} Monitoring ${this.pid} ${this.style}`)
    setInterval(() => { this.proxy = getProxy() }, 60000)
    await this.init()
    await this.loop()
  }
}