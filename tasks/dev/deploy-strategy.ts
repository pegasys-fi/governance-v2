import {task} from 'hardhat/config';
import {ZERO_ADDRESS} from '../../helpers/constants';
import {deployGovernanceStrategy} from '../../helpers/contracts-deployments';

task(`deploy:strategy`, `Deploy governance for tests and development purposes`)
  .addFlag('verify')
  .addParam('psys', '', ZERO_ADDRESS)
  .addParam('stkPSYS', '', ZERO_ADDRESS)
  .setAction(async ({psys, stkPSYS, verify}, _DRE) => {
    _DRE.run('set-DRE');
    return await deployGovernanceStrategy(psys, stkPSYS, verify);
  });
