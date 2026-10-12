// Genera public/favicon.ico a partir de public/logo.svg.
// sharp no escribe ICO, así que empaquetamos varios PNG (16/32/48) en un
// contenedor ICO. Los navegadores modernos y Windows Vista+ aceptan ICO con
// imágenes PNG embebidas.
//
// Ejecutar: pnpm icons:favicon  (o node scripts/generate-favicon.mjs)

import sharp from 'sharp'
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const publicDir = resolve(__dirname, '..', 'public')
const source = resolve(publicDir, 'logo.svg')
const dest = resolve(publicDir, 'favicon.ico')

if (!existsSync(source)) {
  console.error(`✗ No existe la fuente: ${source}`)
  process.exit(1)
}

const SIZES = [16, 32, 48]
const svg = readFileSync(source)

const pngs = await Promise.all(
  SIZES.map((size) => sharp(svg, { density: 512 }).resize(size, size).png().toBuffer()),
)

// ICO: cabecera (6 bytes) + una entrada por imagen (16 bytes) + datos PNG.
const header = Buffer.alloc(6)
header.writeUInt16LE(0, 0) // reserved
header.writeUInt16LE(1, 2) // type: icon
header.writeUInt16LE(SIZES.length, 4)

let offset = 6 + SIZES.length * 16
const entries = SIZES.map((size, i) => {
  const entry = Buffer.alloc(16)
  entry.writeUInt8(size >= 256 ? 0 : size, 0) // width
  entry.writeUInt8(size >= 256 ? 0 : size, 1) // height
  entry.writeUInt8(0, 2) // palette
  entry.writeUInt8(0, 3) // reserved
  entry.writeUInt16LE(1, 4) // color planes
  entry.writeUInt16LE(32, 6) // bits per pixel
  entry.writeUInt32LE(pngs[i].length, 8) // size of image data
  entry.writeUInt32LE(offset, 12) // offset of image data
  offset += pngs[i].length
  return entry
})

writeFileSync(dest, Buffer.concat([header, ...entries, ...pngs]))
console.log(`  ✓ favicon.ico                  ${SIZES.join('/')} px`)
