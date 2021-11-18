
async function run (runtimeEnv) {
  throw new Error('failing script')
}

module.exports = { default: run }
