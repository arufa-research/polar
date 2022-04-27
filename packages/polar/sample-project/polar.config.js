
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

const networks = {
  localnet: {
    endpoint: 'http://localhost:1337/',
    accounts: accounts,
  },
  // Pulsar-2
  testnet: {
    endpoint: 'http://testnet.securesecrets.org:1317/',
    chainId: 'pulsar-2',
    accounts: accounts,
  },
  development: {
    endpoint: 'tcp://0.0.0.0:26656',
    chainId: 'enigma-pub-testnet-3',
    types: {}
  },
  // Supernova Testnet
  supernova: {
    endpoint: 'http://bootstrap.supernova.enigma.co:1317',
    chainId: 'supernova-2',
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
};

module.exports = {
  networks: {
    default: networks.testnet,
    localnet: networks.localnet,
    development: networks.development
  },
  mocha: {
    timeout: 60000
  },
  rust: {
    version: "1.55.0",
  }
};
