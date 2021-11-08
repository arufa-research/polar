# Polar

Polar is a development framework for building terra contracts. The aim of the project is to make terra contracts development process simple, efficient and scalable. User can focus on logic of terra contract and not much about further steps in development. It facilitates features such as initiating project repo from contract templates, easy compilation of contracts, deployment, Interacting with contracts using schema and contract testing framework.

## Requirements

The minimum packages/requirements are as follows:
 
- Node 14+
- Yarn v1.22+ or NPM `v6.0+**
- Connection to an Terra node. 

## Setup rust environment

Polar requires a Rust environment installed on local machine to work properly. This Rust environment can be installed with the help of polar in just a command.

```bash
polar install
```

## Install polar

### Installation from released version

To install polar globally in your system you can use:
  - Using Yarn: `yarn global add terra-polar`
  - Using NPM: `npm install -g terra-polar`

### Installation from master.

The master branch corresponds to the latest version.

To use  `polar` on your system, follow the steps below:

```bash
git clone https://github.com/arufa-research/polar.git
cd polar
yarn install
yarn build
cd packages/polar
yarn link
chmod +x $HOME/.yarn/bin/polar
```

### Install dependencies

Setup Rust compiler

```
cd infrastructure
make setup-rust
```

Follow our infrastructure README for instructions how to setup a private network.

## Usage

### Initialize a project

```bash
polar init <project-name>
```

This will create a directory <project-name> inside current directory with boiler-plate code. The `contracts/` directory has all the rust files for the contract logic. `scripts/` directory contains  `.js` scripts that user can write according to the use case, a sample script has been added to give some understanding of how a user script should look like. `test/` directory contains `.js` scripts to run tests for the deployed contracts.

### Listing Tasks

To see the possible tasks (commands) that are available, go to project's folder. 

```bash
polar
``` 

This is the list of built-in tasks. This is your starting point to find out what tasks are available to run.

### Compile the project

To compile the contracts, Go to project directory:

```bash
cd <project-name>
polar compile
```

This command will generate compiled .wasm files in artifacts/contracts/ dir and schema .json files in artifacts/schema/ dir.

### Cleanup Artifacts

To clear artifacts data, use

```bash
polar clean
``` 
This will remove the artifacts directory completely. To clean artifacts for only one contract, use

```bash
polar clean <contract-name>
``` 
This will remove specific files related to that contract.


### Running user scripts

User scripts are a way to define the flow of interacting with contracts on some network in form of a script. These scripts can be used to deploy a contract, query/transact with the contract.A sample script scripts/sample-script.js is available in the boilerplate.


## Run tests

```bash
yarn run test
```

## License

This project is forked from hardhat, and just base on the hardhat-core part then modify it under MIT license.

## Thanks

hardhat - Hardhat is a development environment to compile, deploy, test, and debug your Ethereum software. Get Solidity stack traces & console.log.
