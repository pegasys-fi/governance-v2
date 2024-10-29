import { BigNumber } from 'ethers';
import { task } from 'hardhat/config';
import { getFirstSigner } from '../../helpers/contracts-getters';
import { DRE } from '../../helpers/misc-utils';

const ONE_DAY = BigNumber.from('60').mul('60').mul('24');
const DELAY = ONE_DAY.mul('7').toString(); // 7 days
const GRACE = ONE_DAY.mul('5').toString(); // 5 days
const MAX_DELAY = ONE_DAY.mul('30').toString(); // 30 days
const VOTE_DURATION = ONE_DAY.mul('10').toString(); // 10 days
const minimumDelay = '10'; // 10 sec
const propositionThreshold = '125'; // 1.25%
const voteDifferential = '650'; // 6.5%
const minimumQuorum = '650'; // 6.5%

task(`migrate:dev`, `Deploy governance for tests and development purposes`)
  .addFlag('verify')
  .addFlag('silent')
  .addParam('votingDelay', '', '15')
  .addParam('voteDuration', '', '1000')
  .addParam('executorAsOwner', '', 'true') // had issue with other types than string
  .setAction(async ({ votingDelay, voteDuration, executorAsOwner, verify, silent }, _DRE) => {
    await _DRE.run('set-DRE');
    const [adminSigner, tokenMinterSigner] = await _DRE.ethers.getSigners();

    const admin = await adminSigner.getAddress();
    const tokenMinter = await tokenMinterSigner.getAddress();

    // Deploy mocked PSYS v2
    const token = await DRE.run('deploy:mocked-psys', {
      minter: tokenMinter,
      verify,
    });

    // Deploy mocked STK PSYS v2
    const stkToken = await DRE.run('deploy:mocked-stk-psys', {
      minter: tokenMinter,
      verify,
    });

    // Deploy strategy
    const strategy = await DRE.run('deploy:strategy', {
      psys: token.address,
      stkPSYS: stkToken.address,
      verify,
    });
    console.log('Strategy address:', strategy.address);

    // Deploy governance v2
    const governance = await DRE.run('deploy:gov', {
      strategy: strategy.address,
      guardian: admin,
      votingDelay,
      verify,
    });
    console.log('Governance address:', governance.address);
    const ADMIN = governance.address;
    // Deploy governance v2 helper
    await DRE.run('deploy:gov-helper');

    const executor = await DRE.run('deploy:executor', {
      admin: ADMIN,
      delay: DELAY,
      gracePeriod: GRACE,
      minimumDelay: minimumDelay,
      maximumDelay: MAX_DELAY,
      propositionThreshold: propositionThreshold,
      voteDuration: voteDuration,
      voteDifferential: voteDifferential,
      minimumQuorum: minimumQuorum,
      verify: verify,
    });
    console.log('Executor address:', executor.address);

    // authorize executor
    await DRE.run('init:gov', {
      executorAsOwner,
      governance: governance.address,
      executor: executor.address,
    });

    if (!silent) {
      console.log('- Contracts deployed for development');
    }
  });
