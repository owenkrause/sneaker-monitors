import { instance, sendWebhook, sleep, getTime, getProxy } from './utils.js'

export class Monitor {

  constructor(pid) {
    this.pid = pid
    this.productInfo = {}
    this.previousStock = []
    this.currentStock = []
    this.proxy = getProxy()
    this.start()
  }

  init = async() => {
    this.t1 = performance.now()
    await instance.get(`https://api-search.dickssportinggoods.com/catalog-productdetails/v4/byPartNumber/15108?id=${this.pid}&location=0,678&c=${Math.random().toString(36).slice(2,7)}`, { proxy: this.proxy })
    .then( response => {
      this.productInfo = {
        pid: response.data.productsData[0].style.partNumber,
        name: response.data.productsData[0].style.name,
        sku: response.data.productsData[0].style.descriptiveAttributes.find(x => x.identifier === '3290').value,
        price: response.data.productsData[0].style.prices.minlistprice,
        url: `https://www.dickssportinggoods.com${response.data.productsData[0].style.pdpSeoUrl}`,
        image: `${response.data.productsData[0].skus[0].fullImageURL}?hei=400&wid=400`,
      }
      for( let i = 0, n = response.data.productsData[0].skus.length; i < n; i++ ) {
        this.previousStock[i] = { 
          id: response.data.productsData[0].skus[i].partNumber,
          size: response.data.productsData[0].skus[i].definingAttributes.find(x => x.identifier === '5225').value, 
          stock: response.data.productsData[0].skus[i].shipQty
        }
      }
    })
    this.t2 = performance.now()
    console.log(`${getTime()} ${this.productInfo.pid} initialized ${(this.t2-this.t1).toFixed(2)}ms`)
  }

  loop = async() => {
    while(true) {
      this.currentStock = []
      await instance.get(`https://api-search.dickssportinggoods.com//catalog-productdetails/v4/byPartNumber/15108?id=${this.pid}&location=0,678&c=${Math.random().toString(36).slice(2,7)}`, { proxy: this.proxy })
      .then( response => {
        for( let i = 0, n = response.data.productsData[0].skus.length; i < n; i++ ) {
          this.currentStock[i] = { 
            id: response.data.productsData[0].skus[i].partNumber,
            size: response.data.productsData[0].skus[i].definingAttributes.find(x => x.identifier === '5225').value, 
            stock: response.data.productsData[0].skus[i].shipQty
          }
        }
        this.instock = []
        for( let i = 0, n = this.currentStock.length; i < n; i++ ) {
          this.previousVariant = this.previousStock.find(variant => variant.id === this.currentStock[i].id )
          if( !this.previousVariant && this.currentStock[i].stock > 0 ) {
            this.instock.push(`${this.currentStock[i].size} [${this.currentStock[i].stock}]`)
          } else if( this.previousVariant.stock === 0 && this.currentStock[i].stock >  0) {
            this.instock.push(`${this.currentStock[i].size} [${this.currentStock[i].stock}]`)
            console.log(this.previousStock, this.currentStock, '\n')
          }
        }
        if( this.instock.length ) sendWebhook(this.productInfo, this.instock)
        this.previousStock = [...this.currentStock]
      })
      .catch( err => {
        if( err.response || err.request ) console.log(`${getTime()} ${err.message}`)
        else console.log(err)
      })
      await sleep(5000)
    }
  }

  start = async() => {
    setInterval(() => {this.proxy = getProxy()}, 300000)
    await this.init()
    await this.loop()
  }
}