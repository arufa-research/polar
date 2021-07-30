setup-compiler:
	curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
	source $HOME/.cargo/env

	rustup default stable
	rustup target list --installed
	rustup target add wasm32-unknown-unknown

	rustup install nightly
	rustup target add wasm32-unknown-unknown --toolchain nightly

	apt install build-essential
