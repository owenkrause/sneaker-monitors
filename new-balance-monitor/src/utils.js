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
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/111.0.0.0 Safari/537.36',
  }
})

export const sendWebhook = product => {
  const embed = new EmbedBuilder()
    .setColor('#FFFFFF')
    .setAuthor({ name:'https://www.newbalance.com/', url:'https://www.newbalance.com/' })
    .setTitle(`${product.gender} ${product.name} ${product.style} - ${product.price}`)
    .setURL(`https://www.newbalance.com/pd/~/${product.pid}.html?dwvar_${product.pid}_style=${product.style}`)
    .setThumbnail(product.image)

  let first = ''
  let second = ''
  if( product.sizes.length > 8 ) { 
    first = product.sizes.slice(0, Math.round(product.sizes.length / 2)).join('')
    second = product.sizes.slice(Math.round(product.sizes.length / 2)).join('')
  } else {
    first = product.sizes.join('')
    second = '\u200b'
  }
  embed.addFields(
    { name: 'Sizes Restocked', value: first, inline: true },
    { name: '\u200b', value: second, inline: true }
  )
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