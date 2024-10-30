import { exit } from 'process';
import fs from 'fs';
import globby from 'globby';
import { file } from 'tmp-promise';
import { DRE } from './misc-utils';

const listSolidityFiles = (dir: string) => globby(`${dir}/**/*.sol`);

const fatalErrors = [
  `The address provided as argument contains a contract, but its bytecode`,
  `Rate limit reached`,
];

export const getContractPath = async (contractName: string) => {
  const paths = await listSolidityFiles(DRE.config.paths.sources);
  const path = paths.find((p) => p.includes(contractName));
  if (!path) {
    throw new Error(
      `Contract path not found for ${contractName}. Check if smart contract file is equal to contractName input.`
    );
  }

  return `${path}:${contractName}`;
};

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export const verifyContract = async (
  contractName: string,
  address: string,
  constructorArguments: (string | string[])[],
  libraries?: string
) => {
  try {
    // Initial 10 second delay to allow for contract indexing
    console.log('[BLOCKSCOUT][INFO] Waiting 10 seconds for contract indexing...');
    await delay(10000);

    console.log('[BLOCKSCOUT][INFO] Starting verification process...');
    const msDelay = 5000; // Delay between retry attempts
    const times = 10;

    const params = {
      address: address,
      constructorArguments: constructorArguments,
    };

    if (libraries) {
      params['libraries'] = libraries;
    }

    console.log('[BLOCKSCOUT][INFO] Verification params:', params);

    await runTaskWithRetry('verify:verify', params, times, msDelay, () => {});
  } catch (error) {
    console.error('[BLOCKSCOUT][ERROR] Verification failed:', error);
  }
};

export const runTaskWithRetry = async (
  task: string,
  params: any,
  times: number,
  msDelay: number,
  cleanup: () => void
) => {
  let counter = times;
  await delay(msDelay);

  try {
    if (times) {
      await DRE.run(task, params);
      cleanup();
      console.log('[BLOCKSCOUT][SUCCESS] Contract verified successfully');
    } else {
      cleanup();
      console.error(
        '[BLOCKSCOUT][ERROR] Verification failed after all retries. Check logs for details.'
      );
    }
  } catch (error) {
    counter--;
    console.info(`[BLOCKSCOUT][INFO] Retry attempts remaining: ${counter}`);
    console.error('[BLOCKSCOUT][ERROR]', error.message);

    if (fatalErrors.some((fatalError) => error.message.includes(fatalError))) {
      console.error(
        '[BLOCKSCOUT][ERROR] Fatal error detected, skipping retries and continuing deployment.'
      );
      return;
    }

    if (counter > 0) {
      await runTaskWithRetry(task, params, counter, msDelay, cleanup);
    }
  }
};

export const checkVerification = () => {
  return true;
};
