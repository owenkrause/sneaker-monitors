import axios from 'axios'
import dotenv from 'dotenv'
import fs from 'fs'
import mongoose from 'mongoose'
import { WebhookClient, EmbedBuilder } from 'discord.js'
import { HttpsProxyAgent } from 'hpagent'

dotenv.config()

export const sleep = ms => new Promise(r => setTimeout(r, ms))

export const getTime = () => {
  const date = new Date()
  return `${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`
}

export const instance = axios.create({
  headers: {
    'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
    'accept-encoding': 'gzip, deflate, br',
    'accept-language': 'en-US,en;q=0.9',
    'cache-control': 'no-cache',
    'origin': 'https://www.asos.com',
    'referer': 'https://www.asos.com',
    'pragma': 'no-cache',
    'sec-ch-ua': '"Not?A_Brand";v="8", "Chromium";v="108", "Google Chrome";v="108"',
    'sec-ch-ua-mobile': '?0',
    'sec-ch-ua-platform': '"Windows"',
    'sec-fetch-dest': 'document',
    'sec-fetch-mode': 'navigate',
    'sec-fetch-site': 'none',
    'sec-fetch-user': '?1',
    'upgrade-insecure-requests': '1',
    'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36'
  }
})

export const sendWebhook = product => {
  let first = ''; let second = ''
  if( product.sizes.length > 8 ) { 
    first = product.sizes.slice(0, Math.round(product.sizes.length / 2)).join('')
    second = product.sizes.slice(Math.round(product.sizes.length / 2)).join('')
  } else {
    first = product.sizes.join('')
    second = '\u200b'
  }
  const webhook = process.env.WEBHOOK_URL
  const embed = new EmbedBuilder()
    .setColor('#FFFFFF')
    .setAuthor({ name: 'https://www.asos.com/us', url: 'https://www.asos.com/us' })
    .setTitle(`${product.title} - ${product.price}`)
    .setURL(`https://www.asos.com/us/~/~/prd/${product.pid}`)
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
  return new HttpsProxyAgent({
    keepAlive: true,
    proxy: `http://${proxy[2]}:${proxy[3]}@${proxy[0]}:${proxy[1]}`
  }) 
}

export const connect = async() => {
  await mongoose.connect(`mongodb+srv://${process.env.mongoUser}:${process.env.mongoPass}@monitor-db.pxm2j.mongodb.net/asos`)
}

const Schema = new mongoose.Schema({
  pid: { type: String, required: true },
}, { versionKey: false })

export const Pid = mongoose.model('Pid', Schema)