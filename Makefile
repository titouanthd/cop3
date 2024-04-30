BIN_PATH = "./bin/index.js"
DEV_PATH = "./src/index.ts"
NODE_DEV = NODE_ENV=dev
NODE_PROD = NODE_ENV=prod
TS_NODE = "./node_modules/.bin/ts-node"
NODE = "node"

build:
	npm run build

dev:
	$(NODE_DEV) $(TS_NODE) $(DEV_PATH) $(cmd)

prod:
	$(NODE_PROD) $(NODE) $(DEV_PATH) $(cmd)

watch:
	npm run watch

eslint:
	npx eslint -c eslint-config.json src

prettier:
	npm run format

lint:
	make prettier
	make eslint

install:
	npm install
	make build

global_install:
	npm install
	npm run build
	npm install -g .
	cop3 -h

uninstall:
	npm uninstall -g cop3

dev:
	$(NODE_DEV) $(TS_NODE) $(DEV_PATH) $(cmd) $(f)