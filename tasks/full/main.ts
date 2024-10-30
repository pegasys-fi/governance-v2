import { BigNumber } from 'ethers';
import { task } from 'hardhat/config';
import { DRE, waitForTx } from '../../helpers/misc-utils';
import { deployFullGovernance } from '../../helpers/contracts-deployments';
import { getFirstSigner } from '../../helpers/contracts-getters';

// Basic time unit for calculations (in seconds)
const ONE_DAY = BigNumber.from('60').mul('60').mul('24'); // 86400 seconds

// Time-related parameters (in seconds)
const DELAY = ONE_DAY.mul('7').toString(); // Time between queue & execution (7 days = 604800 seconds)
const GRACE = ONE_DAY.mul('5').toString(); // Grace period after delay (5 days = 432000 seconds)
const MAX_DELAY = ONE_DAY.mul('30').toString(); // Maximum delay (30 days = 2592000 seconds)
const MIN_DELAY = '10'; // Minimum delay (10 seconds)
const VOTE_DURATION = ONE_DAY.mul('10').toString(); // Duration of voting period (10 days = 864000 seconds)

// Governance thresholds (in basis points: 100 = 1%)
const PROPOSITION_THRESHOLD = '12500'; // Required power to create proposal (125.00%)
const VOTE_DIFFERENTIAL = '65000'; // Required difference between for/against (650.00%)
const MINIMUM_QUORUM = '65000'; // Minimum participation required (650.00%)

// Voting delay (in blocks)
const VOTING_DELAY = '15'; // Number of blocks to wait before voting begins

// Contract addresses
const PSYS_ADDRESS = '0xB2cd2D3d1a009f3aa8F35DAC38BD2e9d4Bd92d31';
const STK_PSYS_ADDRESS = '0x3C72568C296902Dc75c6BEfa113eF8dBfb015347';

task(`deploy:main`, `Deploy governance contracts`)
  .addFlag('verify')
  .setAction(async ({ verify, silent }, _DRE) => {
    await _DRE.run('set-DRE');
    const [adminSigner] = await _DRE.ethers.getSigners();
    const ADMIN_ADDRESS = await adminSigner.getAddress();
    const GUARDIAN_ADDRESS = ADMIN_ADDRESS;

    const { governance, executor, strategy, helper } = await deployFullGovernance(
      PSYS_ADDRESS, // PSYS token address
      STK_PSYS_ADDRESS, // Staked PSYS address
      ADMIN_ADDRESS, // Admin address
      DELAY, // 7 days delay
      GRACE, // 5 days grace period
      MIN_DELAY, // 10 seconds minimum delay
      MAX_DELAY, // 30 days maximum delay
      PROPOSITION_THRESHOLD, // 1.25% proposition threshold
      VOTE_DURATION, // 10 days voting duration
      VOTE_DIFFERENTIAL, // 6.5% vote differential
      MINIMUM_QUORUM, // 6.5% minimum quorum
      VOTING_DELAY, // 15 blocks voting delay
      GUARDIAN_ADDRESS, // Guardian address
      verify // verify contracts
    );

    // set up the proper ownership structure
    await waitForTx(await governance.authorizeExecutors([executor.address]));
    await waitForTx(
      await governance.connect(await getFirstSigner()).transferOwnership(executor.address)
    );

    if (!silent) {
      console.log('\nDeployed Addresses:');
      console.log('- Governance:', governance.address);
      console.log('- Executor:', executor.address);
      console.log('- Governance Strategy:', strategy.address);
      console.log('- Governance Helper:', helper.address);
    }
  });
