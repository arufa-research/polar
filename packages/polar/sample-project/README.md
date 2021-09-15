# Secret Contracts Counter Example

This template contains counter example contracts.
The contract is created with a parameter for the initial count and allows subsequent incrementing.

# Compiling contracts

Use this command to compile your contracts: 
`polar compile`

# Deploying contracts

In `scripts`:

First of all you need to create an instance of your contract using contract name.
```
const contract = new Contract('sample-project', runtimeEnv);

// To deploy your contract
const deploy_response = await contract.deploy(account);

// To initialize your contract
await contract.instantiate({"count": 102}, "deploy test", account);
```

# Interact with contracts

```
// To interact with your contract
await contract.tx.increment(account);

await contract.query.get_count();
```
