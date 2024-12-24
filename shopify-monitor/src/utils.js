import fs from 'fs'
import axios from 'axios'
import dotenv from 'dotenv'
import { HttpsProxyAgent } from 'hpagent'
import { WebhookClient, EmbedBuilder } from 'discord.js'

dotenv.config({ path: '../.env.local' })

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
    'pragma': 'no-cache',
    'sec-ch-ua': '"Google Chrome";v="111", "Not(A:Brand";v="8", "Chromium";v="111"',
    'sec-ch-ua-mobile': '?0',
    'sec-ch-ua-platform': '"macOS"',
    'sec-fetch-dest': 'document',
    'sec-fetch-mode': 'navigate',
    'sec-fetch-site': 'none',
    'sec-fetch-user': '?1',
    'upgrade-insecure-requests': '1',
    'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/111.0.0.0 Safari/537.36',
  }
})  

export const priceDropWebhook = (previousDiscount, newDiscount) => {
  const webhook = process.env.WEBHOOK_URL 
  const embed = new EmbedBuilder()
    .setThumbnail('https://www.onenessboutique.com/cdn/shop/files/Oneness_Boutique_logo_transparent_background_256x256.png')
    .setTitle('Oneness Sitewide Discount Update')
    .setURL('https://www.onenessboutique.com/')
    .addFields(
      { name: 'Previous', value: `${previousDiscount * 100}%`, inline: true },
      { name: 'New', value: `${newDiscount * 100}%`, inline: true }
    );
  (new WebhookClient({ url: webhook })).send({ embeds: [embed] })
}

export const newProductWebhook = (site, product) => {
  const webhook = process.env.WEBHOOK_URL
  let first = ''
  let second = ''
  if( product.variants.length > 8 ) { 
    first = product.variants.slice(0, Math.round(product.variants.length / 2)).join('\n')
    second = product.variants.slice(Math.round(product.variants.length / 2)).join('\n')
  } else {
    first = product.variants.join('\n')
    second = '\u200b'
  }
  const embed = new EmbedBuilder()
    .setAuthor({ name: site, url: site })
    .setThumbnail(product.image)
    .setTitle(`[New Product] ${product.name}`)
    .setURL(product.url)
    .addFields(
      { name: 'Sizes Available', value: first, inline: true },
      { name: '\u200b', value: second, inline: true }
    );
  (new WebhookClient({ url: webhook })).send({ embeds: [embed] })
}

export const restockWebhook = (product, restocked) => {
  const webhook = process.env.WEBHOOK_URL
  let first = ''
  let second = ''
  if( restocked.length > 8 ) { 
    first = restocked.slice(0, Math.round(restocked.length / 2)).join('\n')
    second = restocked.slice(Math.round(restocked.length / 2)).join('\n')
  } else {
    first = restocked.join('\n')
    second = '\u200b'
  }
  const embed = new EmbedBuilder()
    .setAuthor({ name: product.site, url: product.site })
    .setThumbnail(product.image)
    .setTitle(product.name)
    .setURL(product.url)
    .addFields(
      { name: 'Sizes Restocked', value: first, inline: true },
      { name: '\u200b', value: second, inline: true }
    );
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