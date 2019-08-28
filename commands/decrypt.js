'use strict'

/**
 * Dependencies
 */

const fs = require('fs')
const crypto = require('crypto')
const meow = require('meow')
const ora = require('ora')
const prompts = require('prompts')

/**
 * Constants
 */

const ALGORITHM = 'aes-256-cbc'

/**
 * Parse args
 */

const cli = meow(`
  Usage
    $ cast decrypt [options] HASH

  Options
    --secret       Provide a secret.
    --nonce-path   Path to file containing nonce.
`)

/**
 * Define script
 */

async function decrypt() {
  if (cli.flags.h) cli.showHelp()
  if (cli.input.length < 2) cli.showHelp()

  const hash = cli.input[1]
  let secret = cli.flags.secret
  let noncePath = cli.flags.noncePath

  console.log('')
  while (!secret || secret.length < 7) {
    const secretPrompt = await prompts({
      type: 'password',
      name: 'value',
      message: 'Please enter the secret:',
      validate: value => value.length < 7 ? 'Minimum 7 characters' : true
    })

    secret = secretPrompt.value
  }

  while (!noncePath || !fs.existsSync(noncePath)) {
    const noncePrompt = await prompts({
      type: 'text',
      name: 'value',
      message: 'Please provide path to nonce:',
      validate: value => !fs.existsSync(value) ? 'File not found' : true
    })

    noncePath = noncePrompt.value
  }
  const nonce = fs.readFileSync(noncePath)

  const spinner = ora({
    text: `Decrypting: ${hash}\n`,
    spinner: 'noise'
  }).start()

  // Key length is dependent on the algorithm. For example for aes256, it is
  // 32 bytes (256 bits / 8 bits per byte).
  const key = crypto.scryptSync(secret, 'salt', 32)
  const initialization_vector = nonce
  const decipher = crypto.createDecipheriv(ALGORITHM, key, initialization_vector)

  let decrypted = decipher.update(hash, 'hex', 'utf8')
  decrypted += decipher.final('utf8')

  setTimeout(() => {
    spinner.succeed(`Decrypted: ${hash}\n`)
    console.log(decrypted)
  }, 1000)
}

/**
 * Export script
 */

module.exports = decrypt