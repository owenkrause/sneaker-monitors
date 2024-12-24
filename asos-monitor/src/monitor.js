
import { instance, sendWebhook, sleep, getProxy, getTime, Pid } from './utils.js'

export const monitor = async pids => {

  let proxy = getProxy()
  let previousStock = []
  let currentStock = []
  let productsInfo = []

  Pid.watch({'fullDocumentBeforeChange': 'required'}).on('change', async ()=> {
    pids = await Pid.find()
    for( let i = 0, n = pids.length; i < n; i++ ) {
      pids[i] = pids[i].pid
    }
  })

  const init = async () => {
    let t1 = performance.now()
    await Promise.all(pids.map( pid => {
      return instance.get(`https://www.asos.com/api/product/catalogue/v3/products/${pid}?store=US`, { proxy: false, httpsAgent: getProxy() })
    }))
    .then( responses => {
      for( let x = 0, n = responses.length; x < n; x++ ) {
        productsInfo[x] = { 
          pid: responses[x].data.id,
          title: responses[x].data.name,
          price: responses[x].data.price.current.text,
          image: responses[x].data.media.images[0].url,
          variants: []
        }
        for( let y = 0, n = responses[x].data.variants.length; y < n; y++ ) {
          productsInfo[x].variants[y] = { 
            id: responses[x].data.variants[y].id,
            size: responses[x].data.variants[y].brandSize
          }
        }
      }
      let t2 = performance.now()
      console.log(`[${getTime()}] Product info initialized ${(t2-t1).toFixed(2)}ms`)
    })
    .catch( err => {
      console.log(err)
    })
    
    t1 = performance.now()
    await instance.get(`https://www.asos.com/api/product/catalogue/v4/stockprice?productids=${pids.join(',')}&store=US&c=${Math.random().toString(36).slice(2,7)}`, { proxy: false, httpsAgent: proxy })
    .then( response => {
      for( let x = 0, n = response.data.length; x < n; x++ ) {
        previousStock[x] = { 
          pid: response.data[x].productId,
          variants: []
        }
        for( let y = 0, n = response.data[x].variants.length; y < n; y++ ) {
          previousStock[x].variants[y] = { 
            id: response.data[x].variants[y].id,
            inStock: response.data[x].variants[y].isInStock
          }
        }
      }
    })
    .catch( async err => {
      console.log(err.message)
      if( err.response ) {
        console.log(`${err.response.status}- ${err.response.data}`)
      }
      await sleep(2000)
      await init()
    })
    let t2 = performance.now()
    console.log(`[${getTime()}] Stock initialized ${(t2-t1).toFixed(2)}ms`)
  }

  const loop = async () => {
    while(true) {
      currentStock = []
      await instance.get(`https://www.asos.com/api/product/catalogue/v4/stockprice?productids=${pids.join(',')}&store=US&c=${Math.random().toString(36).slice(2,7)}`, { proxy: false, httpsAgent: proxy })
      .then( response => {
        for( let x = 0, n = response.data.length; x < n; x++ ) {
          currentStock[x] = { 
            pid: response.data[x].productId,
            variants: []
          }
          for( let y = 0, n = response.data[x].variants.length; y < n; y++ ) {
            currentStock[x].variants[y] = { 
              id: response.data[x].variants[y].id,
              inStock: response.data[x].variants[y].isInStock
            }
          }
        }
        for( let x = 0, n = currentStock.length; x < n; x++ ) {
          const product = productsInfo.find( product => product.pid === currentStock[x].pid )
          const previousProduct = previousStock.find( prod => prod.pid === currentStock[x].pid )
          const instock = []
          for( let y = 0, i = currentStock[x].variants.length; y < i; y++ ) {
            const previousVariant = previousProduct.variants.find( variant => variant.id === currentStock[x].variants[y].id )
            if( previousVariant.inStock === false && currentStock[x].variants[y].inStock === true ) {
              instock.push(`${(product.variants.find( variant => variant.id === currentStock[x].variants[y].id )).size}\n`)
              console.log(`[${getTime()}] Restock: ${currentStock[x].pid} ${currentStock[x].variants[y].id}`)
            }
          }
          if( instock.length ) {
            sendWebhook({ pid: product.pid, title: product.title, price: product.price, sizes: instock })
          }
        }
        previousStock = [...currentStock]
      })
      .catch( async err => {
        proxy = getProxy()
        console.log(err)
        if( err.response ) {
          console.log(`${err.response.status}- ${err.response.data}`)
        } 
      })
      await sleep(5000)
    }
  }
  setInterval(() => { proxy = getProxy() }, 15000)
  await init()
  await loop()
}