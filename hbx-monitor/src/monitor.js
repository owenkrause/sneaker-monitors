import { instance, getProxy, sleep, getTime, sendWebhook } from './util.js'

export class Monitor {

  constructor(prod) {
    this.prod = prod
    this.productInfo = {}
    this.previousStock = []
    this.currentStock = []
    this.proxy = getProxy()
    this.start()
  }

  init = async() => {
    this.t1 = performance.now()
    await instance.get(`https://hbx.com/men/brands/${this.prod.brand}/${this.prod.slug}`, { proxy: false, httpsAgent: this.proxy })
    .then( response => {
      this.productInfo = {
        name: this.prod.slug.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '), 
        url: response.data.product._links.self.href, 
        image: response.data.product.images[0]._links.self.href, 
        price: response.data.product.price.display
      }
      for( let x = 0, n = response.data.product.variants.length; x < n; x++ ) {
        this.previousStock[x] = {
          size: response.data.product.variants[x].optionValues[0].value,
          stock: response.data.product.variants[x].availableQuantity
        }
      }
    })
    this.t2 = performance.now()
    console.log(`${getTime()} ${this.prod.slug} initialized ${(this.t2-this.t1).toFixed(2)}ms`)
  }

  loop = async() => {
    while(true) {
      await instance.get(`https://hbx.com/men/brands/${this.prod.brand}/${this.prod.slug}`, { proxy: false, httpsAgent: this.proxy })
      .then( response => {
        for( let x = 0, n = response.data.product.variants.length; x < n; x++ ) {
          this.currentStock[x] = {
            size: response.data.product.variants[x].optionValues[0].value,
            stock: response.data.product.variants[x].availableQuantity
          }
        }
        this.instock = []
        for( let x = 0, n = this.currentStock.length; x < n; x++ ) {
          this.previousVariant = this.previousStock.find(variant => variant.size === this.currentStock[x].size)
          if( this.previousVariant.stock === 0 && this.currentStock[x].stock > 0 ) {
            this.instock.push(`${this.currentStock[x].size} [${this.currentStock[x].stock}]`)
            console.log(`${getTime()} Restock ${this.prod.slug} ${this.currentStock[x].size} ${this.currentStock[x].stock}`)
          }
        }
        if( this.instock.length ) {
          this.productInfo.stock = this.instock
          sendWebhook(this.productInfo, 'restock')
        }
        this.previousStock = [...this.currentStock]
      })
      .catch( err => {
        if( err.response ) console.log(`${getTime()} ${err.message}`) 
        else console.log(err)
      })
      await sleep(5000)
    }
  }
  start = async() => {
    setInterval(() => this.proxy = getProxy(), 300000)
    await this.init()
    await this.loop()
  }
}