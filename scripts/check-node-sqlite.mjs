const [major, minor] = process.versions.node.split('.').map(Number)

const supportsNodeSqlite = major > 22 || (major === 22 && minor >= 5)

if (supportsNodeSqlite) {
  process.exit(0)
}

console.error(
  [
    "This project uses Nuxt Content with Node's built-in `node:sqlite` adapter.",
    `Detected Node.js ${process.versions.node}.`,
    'Use Node.js 22.5.0 or newer, then rerun `pnpm install`.',
  ].join('\n'),
)

process.exit(1)
