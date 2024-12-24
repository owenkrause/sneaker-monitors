import { instance, getProxy, sleep, getTime, sendWebhook } from './util.js'

export class newProduct {

  constructor(category) {
    this.category = category
    this.currentProducts = []
    this.previousProducts = []
    this.proxy = getProxy()
    this.start()
  }

  init = async() => {
    const t1 = performance.now()
    await instance.get(`${this.category}?sort=release&limit=120`, { proxy: false, httpsAgent: this.proxy })
    .then( response => {
      for( let i = 0, n = response.data.pagination.items.length; i < n; i++ ) {
        this.previousProducts[i] = response.data.pagination.items[i].id
      }
    })
    const t2 = performance.now()
    console.log(`${getTime()} Waiting for new products ${this.category} ${(t2-t1).toFixed(2)}ms`)
  }

  loop = async() => {
    while(true) {
      await instance.get(`${this.category}?sort=release&limit=120`, { proxy: false, httpsAgent: this.proxy })
      .then( response => {
        for( let i = 0, n = response.data.pagination.items.length; i < n; i++ ) {
          this.currentProducts[i] = response.data.pagination.items[i].id
        }
        this.newProducts = []
        for( let i = 0, n = this.currentProducts.length; i < n; i++ ) {
          if( !this.previousProducts.includes(this.currentProducts[i]) ) {
            this.newProducts.push({
              name: response.data.pagination.items[i].name,
              price: response.data.pagination.items[i].price.display,
              image: response.data.pagination.items[i].images[0]._links.self.href,
              url: response.data.pagination.items[i]._links.self.href
            })
          }
        }
        if( this.newProducts.length ) { this.newProducts.forEach( product => sendWebhook(product, 'new product' ) ) }
        this.previousProducts = [...this.currentProducts]
      })
      .catch( err => {
        if( err.response ) console.log(`${getTime()} ${err.message}`)
        else console.log(err)
      })
      await sleep(5000)
    }
  }

  start = async() => {
    setInterval(() => this.proxy = getProxy(), 600000)
    await this.init()
    await this.loop()
  }
}