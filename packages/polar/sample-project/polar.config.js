const accounts = [
  {
    name: 'account_0',
    address: 'secret1ap26qrlp8mcq2pg6r47w43l0y8zkqm8a450s03',
    mnemonic: 'grant rice replace explain federal release fix clever romance raise often wild taxi quarter soccer fiber love must tape steak together observe swap guitar'
  },
  {
    name: 'account_1',
    address: 'secret1fc3fzy78ttp0lwuujw7e52rhspxn8uj52zfyne',
    mnemonic: 'jelly shadow frog dirt dragon use armed praise universe win jungle close inmate rain oil canvas beauty pioneer chef soccer icon dizzy thunder meadow'
  },
  {
    name: 'account_2',
    address: 'secret1ajz54hz8azwuy34qwy9fkjnfcrvf0dzswy0lqq',
    mnemonic: 'chair love bleak wonder skirt permit say assist aunt credit roast size obtain minute throw sand usual age smart exact enough room shadow charge'
  }
  {
    name: 'account_3',
    address: 'secret1ldjxljw7v4vk6zhyduywh04hpj0jdwxsmrlatf',
    mnemonic: 'word twist toast cloth movie predict advance crumble escape whale sail such angry muffin balcony keen move employ cook valve hurt glimpse breeze brick'
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
