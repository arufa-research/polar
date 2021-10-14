# Secret Contracts Hello World Example

This template contains a hello world program.

# Contract Functions
Displays hello world.

# Compiling contracts

Use this command to compile your contracts: 
`polar compile`

# Run script

`polar run scripts/sample-script.js`

# Deploying contracts

In `scripts` folder:

First of all you need to create an instance of your contract using contract name.
```js
const contract = new Contract('hello-world', runtimeEnv);

// To deploy your contract
const deploy_response = await contract.deploy(account);

Note: You can check out your contract information in `deploy_response`.

# Interact with contracts

`polar` will load functions using schema, you can call contract functions using `contract.tx`(to execute transactions) and `contract.query`(to query from contract)
