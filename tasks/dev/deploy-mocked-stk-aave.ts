import {isAddress} from 'ethers/lib/utils';
import {task} from 'hardhat/config';
import {deployMockedStkPSYSV2} from '../../helpers/contracts-deployments';

task(`deploy:mocked-stk-psys`, `Deploy mocked PSYS V2`)
  .addFlag('verify')
  .addParam('minter', 'Minter to mint all the supply of mock PSYS v2 token')
  .setAction(async ({minter, verify}, _DRE) => {
    _DRE.run('set-DRE');
    if (!isAddress(minter)) {
      throw Error('minter param must be an Ethereum address');
    }

    return await deployMockedStkPSYSV2(minter, verify);
  });
