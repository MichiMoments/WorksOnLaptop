#npx hardhat compile

# npx hardhat ignition deploy ./ignition/modules/Lock.js --network localhost

import os

network = "besu"

os.system(f"npx hardhat compile")

modules = [
    "deploy"
]

for module in modules:
    os.system(f"npx hardhat ignition deploy ./ignition/modules/{module}.js --network {network}")