import { instance, sendWebhook, sleep, getProxy, getTime } from './utils.js'
import * as cheerio from 'cheerio'

export default class Monitor {
  
  constructor(pid) {
    this.pid = pid
    this.productInfo = {}
    this.previousStock = []
    this.currentStock = []
    this.proxy = getProxy()
    this.start()
  }

  async init() {
    try {
      const t1 = performance.now()
      const response = await instance.get(`https://www.asics.com/on/demandware.store/Sites-asics-us-Site/en_US/Product-Variation?pid=${this.pid}&format=ajax`, { proxy: false, httpsAgent: this.proxy })
      const $ = cheerio.load(response.data)
      $('.variants__list--size')[0].children.forEach( size => {
        if (size.name !== 'li') return
        this.previousStock.push({
          size: size.children[3].children[0].data.trim(),
          available: JSON.parse(size.attribs['data-instock'])
        })
      })
      this.productInfo = {
        pid: this.pid,
        title: $('.pdp-top__product-name').text().trim(),
        color: $('.variants__header--light').first().text(),
        url: $(`*[itemprop = 'url']`).text(),
        image: $('.primary-image').attr('src'),
      }
      const t2 = performance.now()
      console.log(`${getTime()} Initialized ${this.pid} ${(t2-t1).toFixed(2)}ms`)
      await sleep(5000)
    }
    catch(err) {
      if(err.response || err.request) console.log(getTime(), this.pid, err.message)
      else console.log(getTime(), this.pid, err)
      await sleep(5000)
      return await this.init()
    }
  }

  async loop() {
    while(true) {
      this.currentStock = []
      try {
        const response = await instance.get(`https://www.asics.com/on/demandware.store/Sites-asics-us-Site/en_US/Product-Variation?pid=${this.pid}&format=ajax`, { proxy: false, httpsAgent: this.proxy })
        const $ = cheerio.load(response.data)
        $('.variants__list--size')[0].children.forEach( size => {
          if (size.name !== 'li') return
          this.currentStock.push({
            size: size.children[3].children[0].data.trim(),
            available: JSON.parse(size.attribs['data-instock'])
          })
        })
        this.restock = []
        for( let i = 0, n = this.currentStock.length; i < n; i++ ) {
          this.previousVariant = this.previousStock.find( variant => variant.size === this.currentStock[i].size )
          if( this.currentStock[i].available === true && this.previousVariant.available === false ) {
            console.log(`${getTime()} Restock ${this.pid} ${this.currentStock[i].size}`)
            this.restock.push(`${this.currentStock[i].size}\n`)
          }
        }
        if(this.restock.length) sendWebhook(this.productInfo, this.restock)
        this.previousStock = [...this.currentStock]
      }
      catch(err) {
        if(err.response || err.request) console.log(getTime(), this.pid, err.message)
        else console.log(getTime(), this.pid, err)
      }
      await sleep(5000)
    }
  }

  async start() {
    setInterval(() => { this.proxy = getProxy() }, 300000)
    await this.init()
    await this.loop()
  }
}