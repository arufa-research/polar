
const fs = require('fs')

async function run (runtimeEnv) {
  fs.appendFileSync('output.txt', 'scripts directory: script 1 executed\n')
}

module.exports = { default: run }
