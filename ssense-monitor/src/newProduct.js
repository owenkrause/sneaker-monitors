import { createInstance, getProxy, sleep, getTime, sendWebhook } from './utils.js'

export const newProduct = async() => {

  const previousProducts = []
  const currentProducts = []
  const instance = createInstance()
  const proxy = getProxy()

  const init = async() => {
    const menPages = (await instance.get('https://www.ssense.com/en-us/women/designers/jordan/shoes.json')).data.pagination_info.totalPages
    const womenPages = (await instance.get('https://www.ssense.com/en-us/men/designers/jordan/shoes.json')).data.pagination_info.totalPages
    
    for( let i = 1, n = menPages; i <= n; i++ ) {
      const response = await instance.get(`https://www.ssense.com/en-us/women/designers/jordan/shoes.json?page=${i}`, { proxy: false, httpsAgent: proxy })
      for( let i = 0, n = response.data.products.length; i < n; i++ ) {
        previousProducts.push(response.data.products[i].id)
      }
      await sleep(3000)
    }
    for( let i = 1, n = womenPages; i <= n; i++ ) {
      const response = await instance.get(`https://www.ssense.com/en-us/men/designers/jordan/shoes.json?page=${i}`, { proxy: false, httpsAgent: proxy })
      for( let i = 0, n = response.data.products.length; i < n; i++ ) {
        previousProducts.push(response.data.products[i].id)
      }
      await sleep(3000)
    }
    console.log(previousProducts)
  }

  const loop = async() => {
    while(true) {
      const proxy = getProxy()
      const menPages = (await instance.get('https://www.ssense.com/en-us/women/designers/jordan/shoes.json')).data.pagination_info.totalPages
      const womenPages = (await instance.get('https://www.ssense.com/en-us/men/designers/jordan/shoes.json')).data.pagination_info.totalPages
      
      for( let i = 1, n = menPages; i <= n; i++ ) {
        const response = await instance.get(`https://www.ssense.com/en-us/women/designers/jordan/shoes.json?page=${i}`, { proxy: false, httpsAgent: proxy })
        for( let i = 0, n = response.data.products.length; i < n; i++ ) {
          currentProducts.push(response.data.products[i].id)
        }
        await sleep(3000)
      }
      for( let i = 1, n = womenPages; i <= n; i++ ) {
        const response = await instance.get(`https://www.ssense.com/en-us/men/designers/jordan/shoes.json?page=${i}`, { proxy: false, httpsAgent: proxy })
        for( let i = 0, n = response.data.products.length; i < n; i++ ) {
          currentProducts.push(response.data.products[i].id)
        }
        await sleep(3000)
      }
      const newProducts = currentProducts.filter( x => !previousProducts.includes(x) )
      if( newProducts.length ) console.log(newProducts)
      await sleep(10000)
    }
  }
  await init()
  await loop()
}