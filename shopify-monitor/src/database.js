import dotenv from 'dotenv'
import mongoose from 'mongoose'
import { instance, getProxy, getTime } from './utils.js'

dotenv.config({ path: '.env.local'})

export const connect = async() => {
  await mongoose.connect(`mongodb+srv://${process.env.mongoUser}:${process.env.mongoPass}@cluster0.ut0fnir.mongodb.net/shopify`)
}

export const disconnect = async() => {
  await mongoose.connection.close()
}

const productSchema = new mongoose.Schema({
  site: { type: String, required: true },
  id: { type: Number, required: true },
  slug: { type: String, required: true },
  name: { type: String, required: true },
  image: { type: String },
  price: { type: Number },
  priceInCart: { type: Number },
  url: { type: String, required: true },
  tags: { type: Array },
  variants: { type: Array, required: true },
  // [ { id, size, availability }, ... ]
}, { versionKey: false })

export const Product = mongoose.model('Product', productSchema)

export const addAllProducts = async(site) => {
  let index = 1
  while(true) {
    try { 
      const response = await instance.get(`${site}products.json?page=${index}&limit=250`, { proxy: false, httpsAgent: getProxy() })
      if( !response.data.products.length ) break
      for( let i = 0, n = response.data.products.length; i < n; i++ ) {
        const product = new Product({
          site: site,
          id: response.data.products[i].id,
          slug: response.data.products[i].handle,
          name: response.data.products[i].title,
          image: response.data.products[i].images.length ? response.data.products[i].images[0].src : null,
          url: `${site}products/${response.data.products[i].handle}`,
          variants: [],
          tags: [
            { brand: response.data.products[i].vendor },
            { productType: response.data.products[i].product_type }
          ]
        })
        for( let j = 0, n = response.data.products[i].variants.length; j < n; j++ ) {
          product.variants[j] = {
            id: response.data.products[i].variants[j].id,
            size: response.data.products[i].variants[j].title,
            available: response.data.products[i].variants[j].available,
          }
        }
        await product.save()
      }
      index++
    } catch (err) {
      if( err.response || err.request ) console.log(err.message)
      else console.log(err)
    }
  }
}

export const addSite = async(site) => {
  console.log(`${getTime()} Adding site, this may take a moment...`)
  try { 
    await addAllProducts(site)
    console.log(`${getTime()} Added ${site} to monitor`)
  } catch { console.log(`${getTime()} Error adding ${site} to database`) }
}

export const removeSite = async(site) => {
  await Product.deleteMany({ site: site })
  console.log(`${getTime()} Removed ${site} from database`)
}

export const addProduct = async(site, prod) => {
  try {
    const response = await instance.get(`${site}products/${prod.slug}.js`, { proxy: false, httpsAgent: getProxy() })
    const product = new Product({
      site: site,
      id: response.data.id,
      slug: response.data.handle,
      name: response.data.title,
      image: response.data.media.length ? response.data.media[0].src : null,
      url: `${site}products/${response.data.handle}`,
      price: response.data.price/100,
      variants: [],
      tags: [
        { brand: response.data.products[i].vendor },
        { productType: response.data.products[i].product_type }
      ]
    })
    for( let i = 0, n = response.data.variants.length; i < n; i++ ) {
      product.variants[i] = {
        id: response.data.variants[i].id,
        size: response.data.variants[i].title,
        available: response.data.variants[i].available,
      }
    }
    await product.save()
    console.log(`${getTime()} Added ${prod.name} to database`)
  } catch (err) {
    console.log(`${getTime()} Error adding ${prod.slug} to database`)
    if( err.response || err.request ) console.log(`${getTime()} ${err.message}`)
    else console.log(getTime(), err)
  }
}

export const removeProduct = async(slug) => {
  await Product.findOneAndDelete({slug: slug})
  console.log(`${getTime()} Removed ${slug} from database`)
}
