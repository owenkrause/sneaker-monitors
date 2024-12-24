import { Monitor } from './src/restock.js'
import { newProduct } from './src/newProduct.js'
import { connect, disconnect, Product, add, remove} from './src/database.js'

await connect()

// use add and remove to add products to monitor

const products = await Product.find()

products.forEach( async product => {
  new Monitor(product)
})

await disconnect()