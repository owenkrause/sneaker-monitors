import fs from 'fs'
import axios from 'axios'
import dotenv from 'dotenv'
import { WebhookClient, EmbedBuilder } from 'discord.js'

dotenv.config()

export const sleep = ms => new Promise(r => setTimeout(r, ms))

export const getTime = () => {
  const date = new Date()
  return `[${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}]`
}

export const instance = axios.create({
  headers: {
    'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
    'accept-encoding': 'gzip, deflate, br',
    'accept-language': 'en-US,en;q=0.9',
    'cache-control': 'no-cache',
    'origin': 'https://www.dickssportinggoods.com',
    'pragma': 'no-cache',
    'sec-ch-ua': '"Google Chrome";v="111", "Not(A:Brand";v="8", "Chromium";v="111"',
    'sec-ch-ua-mobile': '?0',
    'sec-ch-ua-platform': '"macOS"',
    'sec-fetch-dest': 'document',
    'sec-fetch-mode': 'navigate',
    'sec-fetch-site': 'none',
    'sec-fetch-user': '?1',
    'upgrade-insecure-requests': '1',
    'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/111.0.0.0 Safari/537.36'
  }
})  

export const sendWebhook = (product, stock) => {
  const webhook = process.env.WEBHOOK_URL
  let first = ''
  let second = ''
  if( stock.length > 8 ) { 
    first = stock.slice(0, Math.round(stock.length / 2)).join('\n')
    second = stock.slice(Math.round(stock.length / 2)).join('\n')
  } else {
    first = stock.join('\n')
    second = '\u200b'
  }
  const embed = new EmbedBuilder()
    .setColor('#FFFFFF')
    .setAuthor({ name:'https://www.dickssportinggoods.com/', url:'https://www.dickssportinggoods.com/' })
    .setThumbnail(product.image)
    .setTitle(product.name)
    .setURL(product.url)
    .setDescription(`SKU: ${product.sku} Price: $${product.price}`)
    .addFields(
      { name: 'Sizes Instock', value: first, inline: true },
      { name: '\u200b', value: second, inline: true }
    );

  (new WebhookClient({ url: webhook })).send({ embeds: [embed] })
}

export const getProxy = () => {
  const proxies = fs.readFileSync('proxies.txt', 'utf8').split('\n')
  const index = Math.floor(Math.random() * proxies.length)
  const proxy = proxies[index].trim().split(':')
  return {
    protocol: 'http',
    host: proxy[0],
    port: proxy[1],
    auth: {
      username: proxy[2],
      password: proxy[3]
    }
  }
}