# Polar

Polar is a development environment to compile, deploy, test, run them on different networks.

## Requirements

- Node 14+
- Yarn v1.22+ or NPM `v6.0+**
- Connection to an Secret node. Follow our infrastructure README for instructions how to setup a private network.

## Setup

### Install dependencies

1. Install Rust

More information about installing Rust can be found here: https://www.rust-lang.org/tools/install.

```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source $HOME/.cargo/env
```

2. Add rustup target wasm32 for both stable and nightly

```bash
rustup default stable
rustup target list --installed
rustup target add wasm32-unknown-unknown

rustup install nightly
rustup target add wasm32-unknown-unknown --toolchain nightly
```

3. If using linux, install the standard build tools:
```bash
apt install build-essential
```

4. Run cargo install cargo-generate

Cargo generate is the tool you'll use to create a smart contract project (https://doc.rust-lang.org/cargo).

```bash
cargo install cargo-generate --features vendored-openssl
```

## Install polar

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
polar init <project-name>
```

This will create a directory `<project-name>` with boiler-plate code inside the current directory.

### Compile the project

Go to project directory:

```bash
cd <project-name>
```

Compile the project and generate `.wasm` and `.json` schema files:

```bash
polar compile .
```

## Run tests

```bash
yarn run test
```

## License

This project is forked from hardhat, and just base on the hardhat-core part then modify it under MIT license.

## Thanks

hardhat - Hardhat is a development environment to compile, deploy, test, and debug your Ethereum software. Get Solidity stack traces & console.log.
