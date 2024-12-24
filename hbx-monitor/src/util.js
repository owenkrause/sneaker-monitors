import fs from 'fs'
import axios from 'axios'
import dotenv from 'dotenv'
import { HttpsProxyAgent } from 'hpagent'
import { WebhookClient, EmbedBuilder } from 'discord.js'

dotenv.config()

export const sleep = ms => new Promise(r => setTimeout(r, ms))

export const getTime = () => {
  const date = new Date()
  return `[${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}]`
}

export const instance = axios.create({
  headers: {
    'accept': 'application/json',
    'accept-encoding': 'gzip, deflate, br',
    'accept-language': 'en-US,en;q=0.9',
    'origin': 'https://hbx.com',
    'referer': 'https://hbx.com',
    'cache-control': 'no-cache',
    'pragma': 'no-cache',
    'sec-ch-ua': '"Chromium";v="110", "Not A(Brand";v="24", "Google Chrome";v="110"',
    'sec-ch-ua-mobile': '?0',
    'sec-ch-ua-platform': '"macOS"',
    'sec-fetch-dest': 'document',
    'sec-fetch-mode': 'navigate',
    'sec-fetch-site': 'none',
    'sec-fetch-user': '?1',
    'upgrade-insecure-requests': '1',
    'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36'
  }
})

export const sendWebhook = (product, type) => {
  const embed = new EmbedBuilder()
  if( type === 'restock' ) {
    embed.setTitle(`[RESTOCK] ${product.name} - ${product.price}`)
    let first = ''; let second = ''
    if( product.stock.length > 8 ) { 
      first = product.stock.slice(0, Math.round(product.stock.length / 2)).join('\n')
      second = product.stock.slice(Math.round(product.stock.length / 2)).join('\n')
    } else first = product.stock.join('\n'); second = '\u200b'
    embed.addFields(
      { name: 'Sizes Instock', value: first, inline: true },
      { name: '\u200b', value: second, inline: true }
    )
  }
  else if( type === 'new product' ) {
    embed.setTitle(`[NEW PRODUCT] ${product.name} - ${product.price}`)
  }
  embed
    .setColor('#FFFFFF')
    .setThumbnail(product.image)
    .setAuthor({ name:'https://hbx.com/', url:'https://hbx.com/' })
    .setURL(product.url)
    
  const webhook = process.env.WEBHOOK_URL;
  (new WebhookClient({ url: webhook })).send({ embeds: [embed] })
}

export const getProxy = () => {
  const proxies = fs.readFileSync('proxies.txt', 'utf8').split('\n')
  const index = Math.floor(Math.random() * proxies.length)
  const proxy = proxies[index].trim().split(':')
  return new HttpsProxyAgent({
    keepAlive: true,
    proxy: `http://${proxy[2]}:${proxy[3]}@${proxy[0]}:${proxy[1]}`
  })
}