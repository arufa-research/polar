# Setting up local developer testnet

# Requirements

 -Install docker for your environment

```bash
docker run -it --rm \
		-p 26657:26657 -p 26656:26656 -p 1317:1317 \
		-v $$(pwd):/root/code \
		--name secretdev enigmampc/secret-network-sw-dev:v1.0.4-3
```
This will start a local SecretNetwork full-node.