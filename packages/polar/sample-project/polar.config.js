const accounts = [
  {
    name: 'account_0',
    address: 'secret1l0g5czqw7vjvd20ezlk4x7ndgyn0rx5aumr8gk',
    mnemonic: 'snack cable erode art lift better october drill hospital clown erase address'
  }
];

module.exports = {
  networks: {
    default: {
      endpoint: 'http://localhost:1337/'
    },
    development: {
      endpoint: 'tcp://0.0.0.0:26656',
      nodeId: '115aa0a629f5d70dd1d464bc7e42799e00f4edae',
      chainId: 'enigma-pub-testnet-3',
      keyringBackend: 'test',
      types: {}
    },
    // Holodeck Testnet
    testnet: {
      endpoint: 'http://bootstrap.secrettestnet.io',
      chainId: 'holodeck-2',
      trustNode: true,
      keyringBackend: 'test',
      accounts: accounts,
      types: {}
    }
  },
  mocha: {
    timeout: 60000
  }
};