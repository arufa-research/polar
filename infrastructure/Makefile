setup-rust:
	curl --proto '=https' --tlsv1.2 -sSf -y https://sh.rustup.rs | sh
	export PATH="${HOME}/.cargo/bin:${PATH}"

	rustup default stable
	rustup target list --installed
	rustup target add wasm32-unknown-unknown

	rustup install nightly
	rustup target add wasm32-unknown-unknown --toolchain nightly

	apt install build-essential

start-server: # CTRL+C to stop
	docker run -it --rm \
		-p 26657:26657 -p 26656:26656 -p 1317:1317 \
		-v $$(pwd):/root/code \
		--name secretdev enigmampc/secret-network-sw-dev:v1.0.4-3
