
async function run () {
  throw new Error('failing script')
}

module.exports = { default: run }
