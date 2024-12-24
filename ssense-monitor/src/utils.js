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

export const instance = () => {
  return axios.create({
    headers: {
      'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
      'accept-encoding': 'gzip, deflate, br',
      'accept-language': 'en-US,en;q=0.9',
      'cache-control': 'no-cache',
      'origin': 'https://www.ssense.com/',
      'referer': 'https://www.ssense.com/',
      'pragma': 'no-cache',
      'sec-ch-ua': '"Chromium";v="110", "Not A(Brand";v="24", "Google Chrome";v="110"',
      'sec-ch-ua-mobile': '?0',
      'sec-ch-ua-platform': '"macOS"',
      'sec-fetch-dest': 'document',
      'sec-fetch-mode': 'navigate',
      'sec-fetch-site': 'none',
      'sec-fetch-user': '?1',
      'upgrade-insecure-requests': '1',
      'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/111.0.0.0 Safari/537.36',
    }
  })
}

export const sendWebhook = (product, stock) => {
  let first = ''; let second = ''
  if( stock.length > 8 ) { 
    first = stock.slice(0, Math.round(stock.length / 2)).join('\n')
    second = stock.slice(Math.round(stock.length / 2)).join('\n')
  } else { 
    first = stock.join('\n')
    second = '\u200b' 
  }

  const webhook = process.env.WEBHOOK_URL
  const embed = new EmbedBuilder()
    .setColor('#FFFFFF')
    .setThumbnail(product.image)
    .setAuthor({ name: 'https://www.ssense.com/', url: 'https://www.ssense.com/' })
    .setTitle(`${product.brand} ${product.name} - $${product.price}`)
    .setURL(product.url)
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

// outsourced px gen
export const pxGen = async(proxy) => {
  const proxyFormatted = `http://${proxy.auth.username}:${proxy.auth.password}@${proxy.host}:${proxy.port}/`
  const r1 = await axios.get(`https://api.parallaxsystems.io/gen?authToken=${process.env.pxToken}&site=ssense&region=com&proxy=${proxyFormatted}&proxyregion=us`)
  const r2 = await axios.get(`https://api.parallaxsystems.io/holdcaptcha?authToken=${process.env.pxToken}&site=ssense&region=com&proxy=${proxyFormatted}&proxyregion=us&deviceNumber=${r1.data.data.deviceNumber}&captchaData=${JSON.stringify(r1.data.data)}`)
  return { r1: r1.data, r2: r2.data }
}