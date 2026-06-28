import { existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'

const docsRoot = dirname(dirname(fileURLToPath(import.meta.url)))
const repoRoot = dirname(dirname(docsRoot))

const requiredOutputs = [
  join(repoRoot, 'packages/core/dist/index.d.ts'),
  join(repoRoot, 'packages/react/dist/index.d.ts'),
  join(repoRoot, 'packages/themes/dist/index.css'),
]

if (requiredOutputs.every((output) => existsSync(output))) {
  process.exit(0)
}

const result = spawnSync(
  'pnpm',
  ['--filter', '@zvndev/yable-core', '--filter', '@zvndev/yable-react', '--filter', '@zvndev/yable-themes', 'build'],
  {
    cwd: repoRoot,
    stdio: 'inherit',
    shell: process.platform === 'win32',
  },
)

process.exit(result.status ?? 1)
