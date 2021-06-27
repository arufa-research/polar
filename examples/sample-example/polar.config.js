export default {
  defaultNetwork: 'development',
  networks: {
    development: {
      endpoint: 'tcp://0.0.0.0:26656',
      nodeId: '115aa0a629f5d70dd1d464bc7e42799e00f4edae',
      chainId: 'enigma-pub-testnet-3',
      trustNode: true,
      keyringBackend: 'test',
      types: {}
    },
    // Holodeck Testnet
    testnet: {
      endpoint: 'http://bootstrap.secrettestnet.io:26657',
      chainId: 'holodeck-2',
      trustNode: true,
      keyringBackend: 'test',
      accounts: ['a', 'b'],
      types: {}
    }
  },
  mocha: {
    timeout: 60000
  }
};