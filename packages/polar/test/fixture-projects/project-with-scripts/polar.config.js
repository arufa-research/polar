const accounts = [{
  name: 'CS',
  address: 'secret14e979dswq7zchs69p9g7t4sx4sd33x90c5858a',
  mnemonic: "slam club view virus chalk inherit bread caution hour vacant rain math"
}]

task('example2', 'example task', async (_ret) => 28)
task('example', 'example task', async (__, { run }) => run('example2'))

module.exports = {
  networks: {
    custom: {
      endpoint: 'http://localhost',
      accounts: accounts
    }
  },
  unknown: { asd: 12 }
}
