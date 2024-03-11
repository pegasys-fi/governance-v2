import {evmRevert, evmSnapshot, DRE} from '../../helpers/misc-utils';
import {Signer} from 'ethers';
import rawBRE from 'hardhat';
import chai from 'chai';
// @ts-ignore
import {solidity} from 'ethereum-waffle';
import {getEthersSigners} from '../../helpers/contracts-helpers';
import {
  getPegasysGovernanceV2,
  getPegasysV2Mocked,
  getExecutor,
  getGovernanceStrategy,
  getGovernanceV2Helper,
  getStkPSYSV2Mocked,
} from '../../helpers/contracts-getters';
import {tEthereumAddress} from '../../helpers/types';
import {PegasysGovernanceV2} from '../../types/PegasysGovernanceV2';
import {PegasysTokenV2} from '../../types/PegasysTokenV2';
import {Executor} from '../../types/Executor';
import {GovernanceStrategy} from '../../types/GovernanceStrategy';
import {GovernanceV2Helper} from '../../types/GovernanceV2Helper';

chai.use(solidity);

export interface SignerWithAddress {
  signer: Signer;
  address: tEthereumAddress;
}
export interface TestEnv {
  deployer: SignerWithAddress;
  minter: SignerWithAddress;
  users: SignerWithAddress[];
  psys: PegasysTokenV2;
  stkPSYS: PegasysTokenV2; // TODO change to a mock of stkPSYS
  gov: PegasysGovernanceV2;
  strategy: GovernanceStrategy;
  executor: Executor;
  govHelper: GovernanceV2Helper;
}

let buidlerevmSnapshotId: string = '0x1';
const setBuidlerevmSnapshotId = (id: string) => {
  buidlerevmSnapshotId = id;
};

const testEnv: TestEnv = {
  deployer: {} as SignerWithAddress,
  minter: {} as SignerWithAddress,
  users: [] as SignerWithAddress[],
  psys: {} as PegasysTokenV2,
  stkPSYS: {} as PegasysTokenV2,
  gov: {} as PegasysGovernanceV2,
  strategy: {} as GovernanceStrategy,
  govHelper: {} as GovernanceV2Helper,
  executor: {} as Executor,
} as TestEnv;

export async function initializeMakeSuite() {
  const [_deployer, _minter, ...restSigners] = await getEthersSigners();
  const deployer: SignerWithAddress = {
    address: await _deployer.getAddress(),
    signer: _deployer,
  };
  const minter: SignerWithAddress = {
    address: await _minter.getAddress(),
    signer: _minter,
  };

  testEnv.users = await Promise.all(
    restSigners.map(async (signer) => ({
      signer,
      address: await signer.getAddress(),
    }))
  );

  testEnv.deployer = deployer;
  testEnv.minter = minter;
  testEnv.psys = await getPegasysV2Mocked();
  testEnv.stkPSYS = await getStkPSYSV2Mocked();
  testEnv.gov = await getPegasysGovernanceV2();
  testEnv.strategy = await getGovernanceStrategy();
  testEnv.executor = await getExecutor();
  testEnv.govHelper = await getGovernanceV2Helper();
}

export async function deployGovernance() {
  console.log('-> Deploying governance test environment...');
  await rawBRE.run('set-DRE');
  await rawBRE.run('migrate:dev');
  await initializeMakeSuite();
  console.log('\n***************');
  console.log('Setup and snapshot finished');
  console.log('***************\n');
}

export async function deployGovernanceWithoutExecutorAsOwner() {
  console.log('-> Deploying governance test environment...');
  await rawBRE.run('set-DRE');
  await rawBRE.run('migrate:dev', {executorAsOwner: 'false'});
  await initializeMakeSuite();
  console.log('\n***************');
  console.log('Setup and snapshot finished');
  console.log('***************\n');
}

export async function deployGovernanceNoDelay() {
  console.log('-> Deploying governance test environment with no delay...');
  await rawBRE.run('set-DRE');
  await rawBRE.run('migrate:dev', {votingDelay: '0'});
  await initializeMakeSuite();
  console.log('\n***************');
  console.log('Setup and snapshot finished');
  console.log('***************\n');
}

export async function makeSuite(
  name: string,
  deployment: () => Promise<void>,
  tests: (testEnv: TestEnv) => void
) {
  beforeEach(async () => {
    setBuidlerevmSnapshotId(await evmSnapshot());
  });
  describe(name, async () => {
    before(deployment);
    tests(testEnv);
  });
  afterEach(async () => {
    await evmRevert(buidlerevmSnapshotId);
  });
}
