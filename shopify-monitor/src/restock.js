import { instance, getProxy, getTime, sleep, priceDropWebhook, restockWebhook } from './utils.js'
import { Product, removeProduct } from './database.js'

export class restockMonitor {

  constructor(product) {
    this.site = product.site
    this.slug = product.slug
    this.previousProduct
    this.currentProduct = { variants: [] }
    this.proxy = getProxy()
    this.start()
  }

  monitor = async() => {
    while(true) {
      try { 
        this.previousProduct = await Product.findOne({ site: this.site, slug: this.slug })
        if( !this.previousProduct ) return
        const response = await instance.get(`${this.site}products/${this.slug}.js`, { proxy: false, httpsAgent: this.proxy })
        this.currentProduct.price = response.data.price/100
        for( let i = 0, n = response.data.variants.length; i < n; i++ ) {
          this.currentProduct.variants[i] = {
            id: response.data.variants[i].id,
            size: response.data.variants[i].title,
            available: response.data.variants[i].available
          }
        }
        let change = false
        let restocked = []
        if (this.currentProduct.price !== this.previousProduct.price) {
          change = true
          if( this.currentProduct.price < this.previousProduct.price ) {
            let available = []
            for( let i = 0, n = this.currentProduct.variants.length; i < n; i++ ) {
              if (this.currentProduct.variants[i].available) available.push(this.currentProduct.variants[i].size)
            }
            if( available.length ) priceDropWebhook(this.currentProduct, this.previousProduct, available)
            console.log(`${getTime()} ${this.site} ${this.slug} ${this.previousProduct.price} -> ${this.currentProduct.price}`)
          }
        }
        for( let i = 0, n = this.currentProduct.variants.length; i < n; i++ ) {
          const variant = this.previousProduct.variants.find(x => x.id === this.currentProduct.variants[i].id)
          if (!variant) { 
            change = true
            if (this.currentProduct.variants[i].available === true) {
              restocked.push(this.currentProduct.variants[i].size)
              console.log(`${getTime()} ${this.site} ${this.slug} ${this.currentProduct.variants[i].size}`)
            }
            continue
          }
          if( variant.available !== this.currentProduct.variants[i].available ) {
            change = true
            if( variant.available === false && this.currentProduct.variants[i].available === true ) {
              restocked.push(this.currentProduct.variants[i].size)
              console.log(`${getTime()} ${this.site} ${this.slug} ${this.currentProduct.variants[i].size}`)
            }
          }
        }
        if (restocked.length) {
          restockWebhook(this.previousProduct, restocked)
        }
        if (change) {
          await Product.findOneAndUpdate(
            { site: this.site, slug: this.slug }, 
            { variants: this.currentProduct.variants, price: this.currentProduct.price }
          )
        }
      }
      catch (err) {
        if( err.response ) {
          if (err.response.status === 404 ) {
            console.log(`${getTime()} ${this.site}${this.slug} Not found`)
            return await removeProduct(this.slug)
          } 
        }
        else console.log(`${getTime()} [Restock Monitor] ${err.message}`)
        this.proxy = getProxy()
      }
      await sleep(60000)
    }
  }
  start = async() => {
    await this.monitor()
  }
}