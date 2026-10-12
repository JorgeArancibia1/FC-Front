// Genera los iconos PNG del PWA a partir de una fuente en public/.
// Ejecutar: pnpm icons [fuente]
//
// Fuente (en orden de preferencia):
//   1. Argumento opcional:        pnpm icons logo.svg
//   2. public/logo.svg, si existe (vectorial → mejor calidad al escalar)
//   3. public/icon-512.png        (raster de 512 ya presente en public/)
//
// IMPORTANTE: los nombres de salida son los que pide el manifest en
// vite.config.ts (icon-192.png, icon-512.png, icon-192-maskable.png,
// icon-512-maskable.png) más apple-touch-icon.png (index.html).
// favicon.ico NO se genera con este script (sharp no escribe ICO): si cambia
// el logo hay que regenerarlo aparte.
//
// Si cambia el logo, dejá la fuente en public/ y volvé a correr este script.

import sharp from 'sharp'
import { existsSync, readFileSync } from 'node:fs'
import { resolve, dirname, extname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const publicDir = resolve(__dirname, '..', 'public')

// Fuente: argumento CLI > logo.svg > icon-512.png (fallback raster).
const arg = process.argv[2]
const vectorial = ['logo.svg', 'favicon.svg']
  .map((name) => resolve(publicDir, name))
  .find((p) => existsSync(p))
const source = arg
  ? resolve(process.cwd(), arg)
  : vectorial ?? resolve(publicDir, 'icon-512.png')

if (!existsSync(source)) {
  console.error(`✗ No existe la fuente: ${source}`)
  console.error('  Dejá un SVG en public/logo.svg o pasá la ruta: pnpm icons <fuente>')
  process.exit(1)
}

const isSvg = extname(source).toLowerCase() === '.svg'
if (!isSvg) {
  console.warn('! Sin fuente vectorial: se usa un raster como origen.')
  console.warn('  Los tamaños mayores al original saldrán interpolados.\n')
}

// Color de fondo del manifest (debe matchear background_color del vite.config.ts).
const BACKGROUND = { r: 11, g: 31, b: 22, alpha: 1 } // #0b1f16

/** Pipeline base: SVG se rasteriza con density alto, raster se lee tal cual. */
const base = () =>
  isSvg ? sharp(readFileSync(source), { density: 512 }) : sharp(source)

const tasks = [
  {
    name: 'icon-192.png',
    description: 'Manifest: Android home (192x192)',
    build: () => base().resize(192, 192).png(),
  },
  {
    name: 'icon-512.png',
    description: 'Manifest: splash/tienda (512x512)',
    build: () => base().resize(512, 512).png(),
  },
  {
    name: 'icon-192-maskable.png',
    description: 'Manifest: maskable 192 (logo en 80% del área)',
    build: () =>
      base()
        .resize(154, 154) // ~80% de 192
        .extend({ top: 19, bottom: 19, left: 19, right: 19, background: BACKGROUND })
        .png(),
  },
  {
    name: 'icon-512-maskable.png',
    description: 'Manifest: maskable 512 (logo en 80% del área)',
    build: () =>
      base()
        .resize(410, 410) // ~80% del 512
        .extend({ top: 51, bottom: 51, left: 51, right: 51, background: BACKGROUND })
        .png(),
  },
  {
    name: 'apple-touch-icon.png',
    description: 'iOS home screen (180x180 estándar)',
    build: () => base().resize(180, 180).png(),
  },
]

console.log(`Generando iconos PWA desde ${source}...\n`)
for (const task of tasks) {
  const dest = resolve(publicDir, task.name)
  if (dest === source) {
    console.log(`  → ${task.name.padEnd(28)} es la fuente, no se sobreescribe`)
    continue
  }
  await task.build().toFile(dest)
  console.log(`  ✓ ${task.name.padEnd(28)} ${task.description}`)
}
console.log('\nListo. Reconstruí el frontend para que el SW indexe los nuevos iconos:')
console.log('  pnpm build')
