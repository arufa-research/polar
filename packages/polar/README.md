# Polar

Polar is a development environment to compile, deploy, test, run scrt contracts on different networks efficiently with an enhanced user friendly experience.

## Requirements

The minimum packages/requirements are as follows:
 
- Node 14+
- Yarn v1.22+ or NPM `v6.0+**
- Connection to an Secret node. 

## Install polar

### Installation from released version
To install polar globally in your system you can use:
  - Using Yarn: `yarn global add secret-polar`
  - Using NPM: `npm install -g secret-polar`

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
## Usage

### Initialize a project

```bash
polar init <project-name>
```

This will create a directory <project-name> inside current directory with boiler-plate code.

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