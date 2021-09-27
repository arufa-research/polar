# Secret Contracts Counter Example

This template contains simple counter contracts.
The contract is created with a parameter for the initial count and allows subsequent incrementing.

# Contract Functions
- `Increment`: Any user can increment the current count by 1.
- `Reset`: Only the owner can reset the count to a specific number.
- `get_count`: Any user can use this function to see current counter value.

# Compiling contracts

Use this command to compile your contracts: 
`polar compile`

# Run script

`polar run scripts/sample-script.js`

# Deploying contracts

In `scripts` folder:

First of all you need to create an instance of your contract using contract name.
```js
const contract = new Contract('sample-project', runtimeEnv);

// To deploy your contract
const deploy_response = await contract.deploy(account);

// To initialize your contract
await contract.instantiate({"count": 102}, "deploy test", account);
```

Note: You can check out your contract information in `deploy_response`.

# Interact with contracts

`polar` will load functions using schema, you can call contract functions using `contract.tx`(to execute transactions) and `contract.query`(to query from contract)
```js
// To interact with your contract
// Execute contract function
await contract.tx.increment(account);

// View count in contract
await contract.query.get_count();
```
