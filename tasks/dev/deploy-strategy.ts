import { task } from 'hardhat/config';
import { ZERO_ADDRESS } from '../../helpers/constants';
import { deployGovernanceStrategy } from '../../helpers/contracts-deployments';

const PSYS = '0x7ff9E9065769DD73ab705C19E769cf84e60Ea83b';
const STK_PSYS = '0xD119EE281a4952D519F55B84F36f9f2f195c8a51';

task(`deploy:strategy`, `Deploy governance for tests and development purposes`)
  .addFlag('verify')
  .addParam('psys', '', PSYS)
  .addParam('stkPSYS', '', STK_PSYS)
  .setAction(async ({ psys, stkPSYS, verify }, _DRE) => {
    _DRE.run('set-DRE');
    return await deployGovernanceStrategy(psys, stkPSYS, verify);
  });
