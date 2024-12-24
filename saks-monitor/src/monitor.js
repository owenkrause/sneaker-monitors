import { instance, getProxy, getTime, sleep, sendWebhook } from './utils.js'

export class Monitor {

  constructor(pid) {
    this.pid = pid
    this.previousStock = []
    this.currentStock = []
    this.proxy = getProxy()
    this.start()
  }  

  init = async() => {
    const t1 = performance.now()
    await instance.get(`/Product-Variation?pid=${this.pid}&dwvar_${this.pid}_color=${this.color}`, { proxy: this.proxy })
    .then( response => {
      for( let x = 0, n = response.data.product.variationAttributes[1].values.length; x < n; x++ ) {
        this.previousStock[x] = {
          size: response.data.product.variationAttributes[1].values[x].value,
          stock: response.data.product.variationAttributes[1].values[x].variantAvailabilityStatus
        }
      }
    })
    const t2 = performance.now()
    console.log(`[${getTime()}] Initialized ${this.pid} ${(t2-t1).toFixed(2)}ms`)
  }

  loop = async() => {
    while(true) {
      this.currentStock = []
      await instance.get(`/Product-Variation?pid=${this.pid}&dwvar_${this.pid}_color=${this.color}`, { proxy: this.proxy })
      .then( response => {
        for( let x = 0, n = response.data.product.variationAttributes[1].values.length; x < n; x++ ) {
          this.currentStock[x] = {
            size: response.data.product.variationAttributes[1].values[x].value,
            stock: response.data.product.variationAttributes[1].values[x].variantAvailabilityStatus
          }
        }
        this.instock = []
        for( let x = 0, n = this.currentStock.length; x < n; x++ ) {
          this.previousVariant = this.previousStock.find(variant => variant.size === this.currentStock[x].size)
          if(this.previousVariant.stock === 'NOT_AVAILABLE' && this.currentStock[x].stock === ('IN_STOCK' || 'BACKORDER')) {
            this.instock.push(`${this.currentStock[x].size} ${this.currentStock[x].stock === 'BACKORDER' ? ' - preorder' : ''}`)
            console.log(`[${getTime()}] ${this.currentStock[x].stock} ${this.pid} ${this.currentStock[x].size}`)
          }
        }
        if( this.instock.length ) {
          sendWebhook({
            name: response.data.product.productName,
            url: response.data.product.pdpURL,
            price: response.data.product.price.sales.value,
            image: response.data.product.images.large[0].hiresURL,
            stock: this.instock
          })
        }
        this.previousStock = [...this.currentStock]
      })
      .catch( err => {
        console.log(`[${getTime()}] ${err.message}`)
        if( err.response ) console.log(err.response.status)
      })
      await sleep(3000)
    }
  }

  start = async() => {
    setInterval(() => { this.proxy = getProxy() }, 150000)
    await this.init()
    await this.loop()
  }
}