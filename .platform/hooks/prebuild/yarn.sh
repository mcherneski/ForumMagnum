#!/bin/bash

# need to install node first to be able to install yarn (as at prebuild no node is present yet)
# curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.34.0/install.sh | bash
# export NVM_DIR="$HOME/.nvm"


# install
cd /var/app/staging/

nvm install 15

echo "installed node version:"
node --version

# debugging..
ls -lah

yarn install --prod

chown -R webapp:webapp node_modules/ || true # allow to fail


