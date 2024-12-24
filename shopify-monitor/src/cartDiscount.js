import { instance, getProxy, getTime, sleep, priceDropWebhook, restockWebhook } from './utils.js'
import { Product, removeProduct } from './database.js'

export class cartDiscountMonitor {

  constructor() {
    this.proxy = getProxy()
    this.product
    this.discount = 0
    this.monitor()
  }

  async monitor() {
    while(true) {
      try {
        const res = await instance.get('https://www.onenessboutique.com/products.json?limit=250', { proxy: false, httpsAgent: this.proxy })
        for( let i = 0, n = res.data.products.length; i < n; i++ ) {
          if(!res.data.products[i].title.includes('xld')) {
            this.product = res.data.products[i]
            break
          }
        }
        const atc = await instance.post('https://www.onenessboutique.com/cart/add.js', { id: this.product.variants[0].id }, { proxy: false, httpsAgent: this.proxy })
        const price = { original: atc.data.original_price, current: atc.data.discounted_price }
        const currentDiscount = (price.original - price.current) / price.original 
        if( this.discount !== currentDiscount ) {
          priceDropWebhook(this.discount, currentDiscount)
          console.log(`[Discount monitor] Original discount: ${this.discount}, new discount: ${currentDiscount}`)
          this.discount = currentDiscount
        }
      } catch (err) {
        console.log(err.message)
        this.proxy = getProxy()
      }
      await sleep(5000)
    }
  }
}