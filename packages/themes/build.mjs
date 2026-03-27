import { readFileSync, writeFileSync, mkdirSync, cpSync, existsSync, watch } from 'fs'
import { join, dirname } from 'path'

const srcDir = 'src'
const distDir = 'dist'

function build() {
  // Ensure dist directories exist
  mkdirSync(join(distDir, 'themes'), { recursive: true })

  // Copy CSS files to dist
  const files = [
    ['src/index.css', 'dist/index.css'],
    ['src/tokens.css', 'dist/tokens.css'],
    ['src/base.css', 'dist/base.css'],
    ['src/utilities.css', 'dist/utilities.css'],
    ['src/themes/default.css', 'dist/themes/default.css'],
    ['src/themes/stripe.css', 'dist/themes/stripe.css'],
    ['src/themes/compact.css', 'dist/themes/compact.css'],
    ['src/themes/midnight.css', 'dist/themes/midnight.css'],
    ['src/themes/ocean.css', 'dist/themes/ocean.css'],
    ['src/themes/rose.css', 'dist/themes/rose.css'],
    ['src/themes/forest.css', 'dist/themes/forest.css'],
    ['src/themes/mono.css', 'dist/themes/mono.css'],
    ['src/rtl.css', 'dist/rtl.css'],
  ]

  for (const [src, dest] of files) {
    if (existsSync(src)) {
      // Inline @import statements for the bundled output
      let content = readFileSync(src, 'utf-8')
      writeFileSync(dest, content)
    }
  }

  console.log('[@yable/themes] Built successfully')
}

build()

if (process.argv.includes('--watch')) {
  console.log('[@yable/themes] Watching for changes...')
  watch(srcDir, { recursive: true }, () => {
    build()
  })
}
