import { instance, getProxy, getTime, sleep, newProductWebhook } from './utils.js'
import { addProduct, Product } from './database.js'
import { restockMonitor } from './restock.js'
import { cartDiscountMonitor } from './cartDiscount.js'

export class newProductMonitor {

  constructor(site) {
    this.site = site
    this.previousProducts = []
    this.currentProducts = []
    this.proxy = getProxy()
    this.start()
  }

  monitor = async() => {
    while(true) {
      try {
        this.currentProducts = []
        this.previousProducts = await Product.find({ site: this.site })
        let index = 1
        while(true) {
          const response = await instance.get(`${this.site}products.json?page=${index}&limit=250`, { proxy: false, httpsAgent: this.proxy })
          if( !response.data.products.length ) break
          for( let i = 0, n = response.data.products.length; i < n; i++ ) {
            const product = {
              id: response.data.products[i].id,
              name: response.data.products[i].title,
              slug: response.data.products[i].handle,
              image: response.data.products[i].images.length ? response.data.products[i].images[0].src : null,
              url: `${this.site}products/${response.data.products[i].handle}`,
              variants: []
            }
            for( let j = 0, n = response.data.products[i].variants.length; j < n; j++ ) {
              if (response.data.products[i].variants[j].available) {
                product.variants.push(response.data.products[i].variants[j].title)
              }
            }
            this.currentProducts.push(product)
          }
          index++
          await sleep(500)
        }
        this.newProducts = this.currentProducts.filter( currentProduct => !this.previousProducts.some( previousProduct => previousProduct.id === currentProduct.id ))
        for( let i = 0, n = this.newProducts.length; i < n; i++ ) {
          await addProduct(this.site, this.newProducts[i])
          new restockMonitor(this.newProducts[i])
          if( this.site === ('https://www.onenessboutique.com/collections/womens-shoes/' || 'https://www.onenessboutique.com/collections/mens-shoes/')) {
            new cartDiscountMonitor(this.newProducts[i])
          }
          console.log(`${getTime()} New Product ${this.newProducts[i].name}`)
          if( this.newProducts[i].variants.length ) newProductWebhook(this.site, this.newProducts[i])
        }
      }
      catch (err) {
        console.log(`${getTime()} [New Product Monitor] ${err.message}`)
        this.proxy = getProxy()
      }
      await sleep(60000)
    }
  }

  start = async() => {
    console.log(`${this.site} Monitoring for new products`)
    await this.monitor()
  }
}