
const fs = require('fs')

async function run (runtimeEnv) {
  fs.appendFileSync('output.txt', runtimeEnv.network.name)
}

module.exports = { default: run }
