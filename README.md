# Polar

Polar is a development environment to compile, deploy, test, run them on a different networks.

## Setup

To setup `polar` on your system, follow steps below:
```bash
git clone https://github.com/arufa-research/polar.git
cd polar
yarn install
yarn build
```
## Usage

### Initialize a project

```bash
yarn run polar init <project-name>
```

This will create a directory `<project-name>` with boiler-plate code inside the current directory.

### Compile the project

Go to project directory.

```bash
cd <project-name>
```

Compile the project and generate `.wasm` and `.json` schema files.
```bash
yarn run polar compile
```

## Run tests

- `yarn run test`

## License
This project is forked from hardhat, and just base on the hardhat-core part then modify it under MIT license.

## Thanks
hardhat - Hardhat is a development environment to compile, deploy, test, and debug your Ethereum software. Get Solidity stack traces & console.log.
