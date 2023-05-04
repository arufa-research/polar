
const testnet_accounts = [
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

const localnet_accounts = [
  {
    name: 'account_0',
    address: '',
    mnemonic: ''
  }
];

const mainnet_accounts = [
];

const networks = {
  localnet: {
    endpoint: 'http://localhost:26657/',
    chainId: 'testing',
    accounts: localnet_accounts,
  },
  testnet: {
    endpoint: 'https://lcd.testnet.secretsaturn.net/',
    chainId: 'pulsar-2',
    accounts: testnet_accounts,
  },
  mainnet: {
    endpoint: 'https://secretnetwork-lcd.stakely.io/',
    chainId: 'secret-4',
    accounts: mainnet_accounts,
  },
};

module.exports = {
  networks: {
    default: networks.testnet,
    testnet: networks.testnet,
    localnet: networks.localnet,
    mainnet: networks.mainnet,
  },
  mocha: {
    timeout: 60000
  },
  rust: {
    version: "1.63.0",
  }
};
