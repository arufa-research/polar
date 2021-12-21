const accounts = [
  {
    name: 'account_0',
    address: 'secret1l0g5czqw7vjvd20ezlk4x7ndgyn0rx5aumr8gk',
    mnemonic: 'snack cable erode art lift better october drill hospital clown erase address'
  },
  {
    name: 'account_1',
    address: 'secret1ddfphwwzqtkp8uhcsc53xdu24y9gks2kug45zv',
    mnemonic: 'sorry object nation also century glove small tired parrot avocado pulp purchase'
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
    // Supernova Testnet
    testnet: {
      endpoint: 'http://bootstrap.supernova.enigma.co:1317',
      chainId: 'supernova-2',
      trustNode: true,
      keyringBackend: 'test',
      accounts: accounts,
      types: {},
      fees: {
        upload: {
            amount: [{ amount: "500000", denom: "uscrt" }],
            gas: "2000000",
        },
        init: {
            amount: [{ amount: "125000", denom: "uscrt" }],
            gas: "500000",
        },
      }
    }
  },
  mocha: {
    timeout: 60000
  },
  rust: {
    version: "1.55.0",
    optimizer: "1.0.5"
  }
};