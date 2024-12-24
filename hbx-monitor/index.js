import { Monitor } from './src/monitor.js'
import { newProduct } from './src/newProduct.js'

const categories = [
  'https://hbx.com/men/categories/shoes',
  'https://hbx.com/women/categories/shoes'
]

const products = [ 
  { brand: 'new-balance', slug: '5500-37' },
  { brand: 'jordan-brand', slug: 'air-jordan-1-mid-14-us' },
  { brand: 'nike', slug: 'nike-air-max-97-prm-medium-brown-pink-foam' },
  { brand: 'nike', slug: 'nike-dunk-low-10-black-white' },
  { brand: 'jordan-brand', slug: 'air-jordan-11-retro-cherry-gs-white-varsity-red-black' },
  { brand: 'new-balance', slug: '9060-10-sea-salt-concrete-silver-metallic' },
  { brand: 'jordan-brand', slug: 'dj-khaled-x-air-jordan-5-4-sail' },
  { brand: 'jordan-brand', slug: 'air-jordan-4-retro-9' },
  { brand: 'jordan-brand', slug: 'air-jordan-1-retro-high-og-gorge-green-gs' },
  { brand: 'new-balance', slug: '9060-14-ivory-cream-pink-sand-light-moonstone' },
  { brand: 'new-balance', slug: '9060-24-sea-salt-concrete-silver-metallic' },
  { brand: 'new-balance', slug: '9060-timberwolf-rain-cloud-silver-metallic' },
  { brand: 'new-balance', slug: '9060-sea-salt-concrete-silver-metallic' },
  { brand: 'new-balance', slug: '9060-rich-earth-outerspace-midnight-green' },
  { brand: 'new-balance', slug: '550-white-dark-mercury-1' },
]

products.forEach( product => new Monitor(product) )
categories.forEach( category => new newProduct(category) )