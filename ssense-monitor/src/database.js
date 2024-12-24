import dotenv from 'dotenv'
import mongoose from 'mongoose'
import { createInstance, pxGen, getProxy, getTime } from './utils.js'

dotenv.config()

export const connect = async() => {
  await mongoose.connect(`mongodb+srv://${process.env.mongoUser}:${process.env.mongoPass}@monitor-db.pxm2j.mongodb.net/ssense`)
  console.log('Connected to database')
}

export const disconnect = async() => {
  await mongoose.connection.close()
}

const productSchema = new mongoose.Schema({
  id: { type: String, required: true },
  productCode: { type: String, required: true },
  name: { type: String, required: true },
  brand: { type: String, required: true },
  url: { type: String, required: true },
  price: { type: Number, required: true },
  image: { type: String, required: true },
  variants: { type: Array, required: true }
  // [ { sku, size, stock }, ... ]
}, { versionKey: false })

export const Product = mongoose.model('Product', productSchema)

export const add = async(id) => {
  const instance = createInstance()
  const proxy = getProxy()
  const px = await pxGen(proxy)
  instance.defaults.headers['user-agent'] = px.r1.data.UserAgent
  instance.defaults.headers.cookie = px.r2.cookie

  try {
    const response = await instance.get(`https://www.ssense.com/en-us/men/product/~/~/${id}.json`, { proxy: proxy })
    const product = new Product({
      id: response.data.product.id,
      productCode: response.data.product.productCode,
      name: response.data.product.name.en,
      brand: response.data.product.brand.name.en,
      url: `https://www.ssense.com/en-us${response.data.product.websiteUrlEnglish}`,
      price: response.data.product.price[0].lowest.amount,
      image: response.data.product.images[0].replace('__IMAGE_PARAMS__','b_white,g_center,f_auto'),
      variants: []
    })
    response.data.product.variants.forEach( variant => {
      product.variants.push({ 
        sku: variant.sku,
        size: variant.size.name,
        inStock: variant.inStock
      })
    })
    await product.save()
  }
  catch (err) {
    if( err.response ) {
      console.log(`${getTime()} ${err.message}`)
      if( err.response.status === 403 ) {
        console.log('px block')
      }
    }
    else console.log(err)
  }
}

export const remove = async(id) => {
  await Product.findOneAndDelete({id: id})
}