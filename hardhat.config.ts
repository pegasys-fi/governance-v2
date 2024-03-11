import path from 'path';
import fs from 'fs';
import {HardhatUserConfig} from 'hardhat/config';
// @ts-ignore
import {accounts} from './test-wallets.js';
import {eEthereumNetwork} from './helpers/types';
import dotenv from 'dotenv';

import {BUIDLEREVM_CHAINID, COVERAGE_CHAINID} from './helpers/buidler-constants';

import '@nomiclabs/hardhat-ethers';
import '@nomiclabs/hardhat-waffle';
import '@nomiclabs/hardhat-etherscan';
import 'hardhat-gas-reporter';
import 'hardhat-typechain';
import 'solidity-coverage';

dotenv.config();

const SKIP_LOAD = process.env.SKIP_LOAD === 'true';
const DEFAULT_BLOCK_GAS_LIMIT = 12450000;
const PRIVATE_KEY = process.env.PRIVATE_KEY || '';
const ETHERSCAN_KEY = process.env.ETHERSCAN_KEY || '';

// Prevent to load scripts before compilation and typechain
if (!SKIP_LOAD) {
  ['misc', 'migrations', 'dev', 'full'].forEach((folder) => {
    const tasksPath = path.join(__dirname, 'tasks', folder);
    fs.readdirSync(tasksPath)
      .filter((pth) => pth.includes('.ts'))
      .forEach((task) => {
        require(`${tasksPath}/${task}`);
      });
  });
}

require(`${path.join(__dirname, 'tasks/misc')}/set-DRE.ts`);

const buidlerConfig: HardhatUserConfig = {
  solidity: {
    compilers: [
      {
        version: '0.7.5',
        settings: {
          optimizer: {enabled: true, runs: 200},
          evmVersion: 'istanbul',
        },
      },
      {
        version: '0.6.10',
        settings: {
          optimizer: {enabled: true, runs: 200},
          evmVersion: 'istanbul',
        },
      },
      {
        version: '0.6.12',
        settings: {
          optimizer: {enabled: true, runs: 200},
          evmVersion: 'istanbul',
        },
      },
    ],
  },
  typechain: {
    outDir: 'types',
    target: 'ethers-v5',
  },
  etherscan: {
    apiKey: ETHERSCAN_KEY,
  },
  mocha: {
    timeout: 0,
  },
  defaultNetwork: 'hardhat',
  networks: {
    main: {
      chainId: 570,
      url: 'https://rpc.rollux.com',
      accounts: [PRIVATE_KEY],
    },
    hardhat: {
      hardfork: 'istanbul',
      blockGasLimit: DEFAULT_BLOCK_GAS_LIMIT,
      gas: DEFAULT_BLOCK_GAS_LIMIT,
      gasPrice: 8000000000,
      chainId: BUIDLEREVM_CHAINID,
      throwOnTransactionFailures: true,
      throwOnCallFailures: true,
      accounts: accounts.map(({secretKey, balance}: {secretKey: string; balance: string}) => ({
        privateKey: secretKey,
        balance,
      })),
    },
  },
};

export default buidlerConfig;
