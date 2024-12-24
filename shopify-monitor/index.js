import { connect, Product, addSite, removeSite } from './src/database.js'
import { newProductMonitor } from './src/newProduct.js'
import { restockMonitor } from './src/restock.js'
import { cartDiscountMonitor } from './src/cartDiscount.js'
import { sleep } from './src/utils.js'

await connect()
//new newProductMonitor('https://www.onenessboutique.com/')

new cartDiscountMonitor()


/*
RESTOCK MONITOR PSEUDOCODE
for each site, get all products 
for each product, new restockMonitor(product)
*/

/*
NEW PRODUCT MONITOR PSEUDOCODE
for each site, new newProductMonitor(site)
*/

/*
when a site is first added, getAllProducts and add them to DB
*/