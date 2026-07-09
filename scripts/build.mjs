import { spawn } from 'node:child_process'

const child = spawn('nuxi', ['build'], {
  env: process.env,
  shell: true,
  stdio: ['inherit', 'pipe', 'pipe'],
})

let buildDone = false
let finished = false
let outputTail = ''

function complete(code) {
  if (finished) {
    return
  }

  finished = true

  if (!child.killed) {
    child.kill('SIGTERM')
  }

  process.exit(code)
}

function handleOutput(stream, chunk) {
  const text = chunk.toString()
  stream.write(chunk)

  outputTail = (outputTail + text).slice(-200)

  if (!buildDone && outputTail.includes('build:done')) {
    buildDone = true
    setTimeout(() => complete(0), 2000)
  }
}

child.stdout.on('data', chunk => handleOutput(process.stdout, chunk))
child.stderr.on('data', chunk => handleOutput(process.stderr, chunk))

child.on('exit', (code, signal) => {
  if (finished) {
    return
  }

  if (buildDone) {
    complete(0)
    return
  }

  if (signal) {
    console.error(`Build process exited with signal ${signal}`)
    complete(1)
    return
  }

  complete(code ?? 1)
})
