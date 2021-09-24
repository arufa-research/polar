# Overview

Polar is a development environment to compile, deploy, test, run contracts on different networks efficiently with an enhanced user friendly experience.

# Installation

Setup rust compiler
```
cd infrastructure
make setup-rust
```

`npm install -g secret-polar`

# Quick Start

This guide will explore the basics of creating a Polar project.

To create your Polar project run `polar init <project-name>`, This will create a directory <project-name> inside current directory with boiler-plate code:

![start1](https://user-images.githubusercontent.com/85037852/134694527-bc257081-cb4f-4b9a-9e62-00a017b2f855.png)


Let’s explore the sample project and go through steps to try out the compile, deploy, execute and query sample contract.

Start by going in your project folder `cd <project-name>` and typing `polar help`:

![start2](https://user-images.githubusercontent.com/85037852/134695066-469a9c56-5262-455b-86b2-67eaa80e746f.png)

This is the list of tasks. This is your starting point to find out what tasks are available to run.

# polar.config.js

![start3](https://user-images.githubusercontent.com/85037852/134695841-a1754643-0469-4c43-bf65-1a9eeb7f865a.png)

In this file specify network configs and accounts.

# Compiling your contracts

In sample-project we have `contracts/src`, it contains a `hello-world` contract.

To compile it, type:

`polar compile`

# Deploying your contracts

In sample-project we have `scripts/sample-script.js`, It demonstrates how to deploy and interact with contract:

First of all you need to create a `Contract` class instance which will be used to perform tasks on contract(deploy, execute, query)
```
const contract = new Contract('sample-project', runtimeEnv);
await contract.parseSchema();
```

`parseSchema` function is used to parse contract schema and convert it to js function, so you can call your contract functions from js scripts.

```
const deploy_response = await contract.deploy(contract_owner);
const contract_info = await contract.instantiate({"count": 102}, "deploy test", contract_owner);
```

Deploy and instantiate your contract.

# Interact with your contracts

There are two types of functions in a contract: transaction functions and query functions.
Polar parses schema and fetch them for you,
- Use `contract.tx.functionName` to call transaction function of your contract.
- Use `contract.query.functionName` to call query function of your contract.

Sample project example:
```
const ex_response = await contract.tx.increment(contract_owner);
const response = await contract.query.get_count();
```
