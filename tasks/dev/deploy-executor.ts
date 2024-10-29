import { task } from 'hardhat/config';
import { BigNumber } from 'ethers';

import { ZERO_ADDRESS } from '../../helpers/constants';
import { deployExecutor } from '../../helpers/contracts-deployments';

const ONE_DAY = BigNumber.from('60').mul('60').mul('24');
const DELAY = ONE_DAY.mul('7').toString(); // 7 days
const GRACE = ONE_DAY.mul('5').toString(); // 5 days
const MAX_DELAY = ONE_DAY.mul('30').toString(); // 30 days
const VOTE_DURATION = ONE_DAY.mul('10').toString(); // 10 days
const ADMIN = '0xdC10C120e5df018ed09411F8e8a50761677252fc'; // Goverance
const MIN_DELAY = '10'; // 10 sec
const PROPOSITION_THRESHOLD = '125'; // 1.25%
const VOTE_DIFFERENTIAL = '650'; // 6.5%
const MINIMUM_QUORUM = '650'; // 6.5%

task(`deploy:executor`, `Deploy governance for tests and development purposes`)
  .addFlag('verify')
  .addParam('admin', '', ADMIN)
  .addParam('delay', '', DELAY)
  .addParam('gracePeriod', '', GRACE)
  .addParam('minimumDelay', '', MIN_DELAY)
  .addParam('maximumDelay', '', MAX_DELAY)
  .addParam('propositionThreshold', '', PROPOSITION_THRESHOLD)
  .addParam('voteDuration', '', VOTE_DURATION)
  .addParam('voteDifferential', '', VOTE_DIFFERENTIAL)
  .addParam('minimumQuorum', '', MINIMUM_QUORUM)
  .setAction(
    async (
      {
        admin,
        delay,
        gracePeriod,
        minimumDelay,
        maximumDelay,
        propositionThreshold,
        voteDuration,
        voteDifferential,
        minimumQuorum,
        verify,
      },
      _DRE
    ) => {
      _DRE.run('set-DRE');
      return await deployExecutor(
        admin,
        delay,
        gracePeriod,
        minimumDelay,
        maximumDelay,
        propositionThreshold,
        voteDuration,
        voteDifferential,
        minimumQuorum,
        verify
      );
    }
  );
