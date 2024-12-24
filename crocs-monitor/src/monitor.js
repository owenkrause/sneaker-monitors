import { instance, getProxy, sleep, getTime, sendWebhook } from './utils.js'

export class Monitor {

  constructor(product) {
    this.pid = product.pid
    this.cid = product.cid
    this.productInfo = {}
    this.previousStock = []
    this.currentStock = []
    this.proxy = getProxy()
    this.start()
  }

  init = async() => {
    const t1 = performance.now()
    await instance.get(`https://www.crocs.com/on/demandware.store/Sites-crocs_us-Site/default/Product-API?pid=${this.pid}&cid=${this.cid}}`, { proxy: false, httpsAgent: this.proxy })
    .then( response => {
      this.productInfo = { 
        sku: this.cid ? `${this.pid}-${this.cid}` : this.pid, 
        name: response.data.data.name, 
        url: response.data.data.urls.link,
        image: response.data.data.urls.image, 
        price: response.data.data.tagMaxPrice,
      }
      for( const variant in response.data.availability.variations ) {
        if( this.cid ) {
          if( variant.split('-')[1] !== this.cid ) continue
        }
        this.previousStock.push({
          id: response.data.availability.variations[variant].id,
          size: response.data.availability.variations[variant].size,
          stock: response.data.availability.variations[variant].ATS
        })
      }
    })
    .catch( async err => {
      console.log(`[${getTime()}] ${err.message}`)
      await sleep(5000)
      await this.init()
    })
    const t2 = performance.now()
    console.log(`[${getTime()}] ${this.pid}-${this.cid} initialized ${(t2-t1).toFixed(2)}ms`)
  }

  loop = async() => {
    while(true) {
      this.currentStock = []
      await instance.get(`http://www.crocs.com/on/demandware.store/Sites-crocs_us-Site/default/Product-API?pid=${this.pid}&cid=${this.cid}`, { proxy: false, httpsAgent: this.proxy })
      .then( response => {
        for( const variant in response.data.availability.variations ) {
          if( this.cid ) {
            if( variant.split('-')[1] !== this.cid ) continue
          }
          this.currentStock.push({
            id: response.data.availability.variations[variant].id,
            size: response.data.availability.variations[variant].size,
            stock: response.data.availability.variations[variant].ATS
          })
        }
        this.instock = []
        for( let x = 0, n = this.currentStock.length; x < n; x++ ) {
          if( !this.previousStock.length && this.currentStock.length ) {
            this.instock.push(`${this.currentStock[x].size} [${this.currentStock[x].stock}]`)
          }
          else {
            this.previousVariant = this.previousStock.find(variant => variant.id === this.currentStock[x].id)
            if( this.currentStock[x].stock > 0 && this.previousVariant.stock === 0 ) {
              this.instock.push(`${this.currentStock[x].size} [${this.currentStock[x].stock}]`)
            }
          }
        }
        if( this.instock.length ) {
          this.productInfo.stock = this.instock
          sendWebhook(this.productInfo)
        }
        this.previousStock = [...this.currentStock]
      })
      .catch( err => {
        console.log(`[${getTime()}] ${err.message}`)
        if( err.response ) {
          console.log(err.response.status)
          this.proxy = getProxy()
        }
      })
      await sleep(3000)
    }
  }

  start = async() => {
    setInterval(() => this.proxy = getProxy(), 300000)
    await this.init()
    await this.loop()
  }
}
