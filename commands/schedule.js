'use strict'

/**
 * Dependencies
 */

const fs = require('fs')
const path = require('path')
const child_process = require('child_process')
const meow = require('meow')
const cron = require('cron')
const showHelp = require('../helpers/showHelp')
const printError = require('../helpers/printError')

/**
 * Constants
 */

const config = {
  cwd: process.cwd(),
  stdio: [null, 'inherit', 'inherit'],
  encoding: 'utf8',
}

/**
 * Parse args
 */

const cli = meow(`
  Usage
    $ cast schedule [options] FILE

  Cron Examples
    * * * * * *           Every second.
    * 10 * * * *          Every ten minutes.
    0 */10 * * * *        Every tenth minute.
    00 00 00 * * *        Every midnight.
    0 */30 9-17 * * *     Every 30 minutes between 9-17.
    * 4-22 * * 1-5        Every Minute Between hours 4-22, Monday through Friday.
`, {
  description: 'Execute something on a schedule.'
})

/**
 * Define script
 */

async function schedule() {
  showHelp(cli, [cli.input.length < 2])

  const file = path.resolve(cli.input[1])
  if (!fs.existsSync(file)) printError(`File doesn't exist: ${file}`)

  const job = cron.job('* * * * * *', () => {
    child_process.spawnSync('node', [file], config)
  })

  job.start()
}

/**
 * Export script
 */

module.exports = schedule
