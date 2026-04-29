import sharp from 'sharp'
import { mkdirSync } from 'fs'

mkdirSync('public/icons', { recursive: true })

const svgIcon = (size) => `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" fill="#0A0A0B"/>
  <text x="${size/2}" y="${size * 0.66}" font-family="Arial, sans-serif" font-size="${Math.round(size * 0.62)}" font-weight="900" text-anchor="middle" fill="#B4FF39">F</text>
</svg>`

await sharp(Buffer.from(svgIcon(192))).png().toFile('public/icons/icon-192.png')
await sharp(Buffer.from(svgIcon(512))).png().toFile('public/icons/icon-512.png')
await sharp(Buffer.from(svgIcon(180))).png().toFile('public/icons/apple-touch-icon.png')
console.log('Icons generated successfully')
