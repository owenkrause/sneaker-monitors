import { createInstance, pxGen, getProxy, sleep, getTime, sendWebhook } from './utils.js'
import { Product } from './database.js'

export class Monitor {

  constructor(product) {
    this.product = product
    this.currentStock = []
    this.instance = createInstance()
    this.proxy = getProxy()
    this.start()
  }

  monitor = async() => {
    while(true) {
      try {
        this.product = await Product.findOne({ id: this.product.id })
        this.response = await this.instance.get(`https://www.ssense.com/api/product/inventory/${this.product.productCode}`, { proxy: this.proxy })
        for ( let i = 0, n = Object.keys(this.response.data.skus).length; i < n; i++ ) {
          this.currentStock[i] = {
            sku: Object.keys(this.response.data.skus)[i],
            inStock: this.response.data.skus[Object.keys(this.response.data.skus)[i]].inStock
          }
        }
      }
      catch (err) {
        if( err.response ) {
          console.log(`${getTime()} ${err.message}`)
          if( err.response.status === 403 ) {
            //regen px cookie and solve captcha if px blocked
            console.log(`${getTime()} solving captcha`)
            try { 
              const px = await pxGen(this.proxy)
              this.instance.defaults.headers['user-agent'] = px.r1.UserAgent
              this.instance.defaults.headers.cookie = px.r2.cookie
            } catch(err) { console.log('err genning px') }
          }
        }
        else console.log(err)
      }
      this.instock = []
      this.update = false
      for( let i = 0, n = this.currentStock.length; i < n; i++ ) {
        this.variant = this.product.variants.find( variant => variant.sku === this.currentStock[i].sku)
        if( this.variant.inStock !== this.currentStock[i].inStock ) {
          if( this.variant.inStock === false && this.currentStock[i].inStock === true ) {
            this.instock.push(this.variant.size)
            console.log(`${getTime()} Restock ${this.product.name} ${this.variant.size}`)
          }
          // if availability changes, update previous data then push to database
          this.update = true
          this.product.variants[this.product.variants.indexOf(this.variant)].inStock = this.currentStock[i].inStock
        }
      }
      if( this.instock.length ) sendWebhook(this.product, this.instock)
      if( this.update ) await Product.findOneAndUpdate({ id: this.product.id }, { $set: { 'variants': this.product.variants } })

      await sleep(5000)
    }
  }

  start = async() => {
    console.log(`${getTime()} Monitoring ${this.product.id}`)
    setInterval(() => this.proxy = getProxy(), 60000 )
    //assign px cookie & user-agent to each different request
    try {
      const px = await pxGen(this.proxy)
      this.instance.defaults.headers['user-agent'] = px.r1.UserAgent
      this.instance.defaults.headers.cookie = px.r2.cookie
    }
    catch(err) { console.log('err genning px') }
    await this.monitor()
  }
}