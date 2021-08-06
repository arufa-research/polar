# Polar

Polar is a development environment to compile, deploy, test, run them on different networks.

## Requirements

- Node 14+
- Yarn v1.22+ or NPM `v6.0+**
- Connection to an Secret node. Follow our infrastructure README for instructions how to setup a private network.

## Setup

### Install dependencies

1. Setup Rust compiler

```
cd infrastructure
make setup-rust
```

## Install polar
### Installation from released version
To install polar globally in your system you can use:
  - Using Yarn: `yarn global add secret-polar`
  - Using NPM: `npm install -g secret-polar`

### Installation from master.
The master branch corresponds to the latest version.

To use  `polar` on your system, follow steps below:
```bash
git clone https://github.com/arufa-research/polar.git
cd polar
yarn install
yarn build
cd packages/polar
yarn link
chmod +x $HOME/.yarn/bin/polar
```
## Usage

### Initialize a project

```bash
polar init <project-directory>
```

This will create a directory `secret-project` with boiler-plate code inside the given directory.

### Compile the project

Go to project directory:

```bash
cd <project-name>
```

Compile the project and generate `.wasm` files:

```bash
polar compile
```

## Run tests

```bash
yarn run test
```

## License

This project is forked from hardhat, and just base on the hardhat-core part then modify it under MIT license.

## Thanks

hardhat - Hardhat is a development environment to compile, deploy, test, and debug your Ethereum software. Get Solidity stack traces & console.log.
