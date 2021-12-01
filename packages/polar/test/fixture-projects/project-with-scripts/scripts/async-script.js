
function run (runtimeEnv) {
  return new Promise(resolve => setTimeout(resolve, 100))
}

module.exports = { default: run }
