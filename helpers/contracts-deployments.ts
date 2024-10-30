import { tEthereumAddress, eContractid } from './types';
import { getPegasysV2Mocked, getFirstSigner } from './contracts-getters';
import {
  PegasysGovernanceV2Factory,
  ExecutorFactory,
  GovernanceStrategyFactory,
  InitializableAdminUpgradeabilityProxyFactory,
  PegasysTokenV2MockFactory,
  FlashAttacksFactory,
  GovernanceV2HelperFactory,
  MockTransferHookFactory,
} from '../types';
import { withSaveAndVerify } from './contracts-helpers';
import { waitForTx } from './misc-utils';
import { Interface } from 'ethers/lib/utils';
import { ONE_ADDRESS } from './constants';

// Deploy governance helper contract for additional utility functions
export const deployGovernanceV2Helper = async (
  verify?: boolean // Whether to verify contract on etherscan
) => {
  return withSaveAndVerify(
    await new GovernanceV2HelperFactory(await getFirstSigner()).deploy(),
    eContractid.GovernanceV2Helper,
    [],
    verify
  );
};

// Deploy main governance contract that handles proposal creation and voting
export const deployPegasysGovernanceV2 = async (
  governanceStrategy: tEthereumAddress, // Address of governance strategy contract
  votingDelay: string, // Delay before voting begins (in blocks)
  guardian: tEthereumAddress, // Address of guardian (can cancel proposals)
  executors: tEthereumAddress[], // Array of authorized executor addresses
  verify?: boolean // Whether to verify contract on etherscan
) => {
  const args: [tEthereumAddress, string, string, tEthereumAddress[]] = [
    governanceStrategy,
    votingDelay,
    guardian,
    executors,
  ];
  return withSaveAndVerify(
    await new PegasysGovernanceV2Factory(await getFirstSigner()).deploy(...args),
    eContractid.PegasysGovernanceV2,
    args,
    verify
  );
};

// Deploy governance strategy contract that defines voting power calculation
export const deployGovernanceStrategy = async (
  psys: tEthereumAddress, // PSYS token address
  stakedPSYSV3: tEthereumAddress, // Staked PSYS token address
  verify?: boolean // Whether to verify contract on etherscan
) => {
  const args: [tEthereumAddress, tEthereumAddress] = [psys, stakedPSYSV3];
  return withSaveAndVerify(
    await new GovernanceStrategyFactory(await getFirstSigner()).deploy(...args),
    eContractid.GovernanceStrategy,
    args,
    verify
  );
};

// Deploy executor contract that handles proposal execution after successful voting
export const deployExecutor = async (
  admin: tEthereumAddress, // Admin address for executor
  delay: string, // Delay between queue & execution (in seconds)
  gracePeriod: string, // Grace period after delay (in seconds)
  minimumDelay: string, // Minimum delay for proposals (in seconds)
  maximumDelay: string, // Maximum delay for proposals (in seconds)
  propositionThreshold: string, // Threshold for proposition (in basis points: 100 = 1%)
  voteDuration: string, // Duration of vote (in seconds)
  voteDifferential: string, // Required vote differential (in basis points: 100 = 1%)
  minimumQuorum: string, // Minimum quorum needed (in basis points: 100 = 1%)
  verify?: boolean // Whether to verify contract on etherscan
) => {
  const args: [tEthereumAddress, string, string, string, string, string, string, string, string] = [
    admin,
    delay,
    gracePeriod,
    minimumDelay,
    maximumDelay,
    propositionThreshold,
    voteDuration,
    voteDifferential,
    minimumQuorum,
  ];
  return withSaveAndVerify(
    await new ExecutorFactory(await getFirstSigner()).deploy(...args),
    eContractid.Executor,
    args,
    verify
  );
};

// Deploy a generic proxy contract with custom identifier
export const deployProxy = async (
  customId: string, // Custom identifier for the proxy contract
  verify?: boolean // Whether to verify contract on etherscan
) =>
  await withSaveAndVerify(
    await new InitializableAdminUpgradeabilityProxyFactory(await getFirstSigner()).deploy(),
    eContractid.InitializableAdminUpgradeabilityProxy,
    [],
    verify,
    customId
  );

// Deploy mocked version of PegasysV2 token for testing
export const deployMockedPegasysV2 = async (
  minter: tEthereumAddress, // Address that can mint tokens
  verify?: boolean // Whether to verify contract on etherscan
) => {
  const mockTransferHook = await withSaveAndVerify(
    await new MockTransferHookFactory(await getFirstSigner()).deploy(),
    eContractid.MockTransferHook,
    [],
    verify
  );

  const proxy = await deployProxy(eContractid.PegasysTokenV2Mock);

  const implementation = await withSaveAndVerify(
    await new PegasysTokenV2MockFactory(await getFirstSigner()).deploy(),
    eContractid.PegasysTokenV2Mock,
    [],
    verify,
    eContractid.PegasysTokenV2MockImpl
  );

  const encodedPayload = new Interface([
    'function initialize(address minter, address governance, address pegasysToken)',
  ]).encodeFunctionData('initialize', [minter, mockTransferHook.address, ONE_ADDRESS]);

  try {
    await waitForTx(
      await proxy.functions['initialize(address,address,bytes)'](
        implementation.address,
        await (await getFirstSigner()).getAddress(),
        encodedPayload,
        { gasLimit: 1000000 }
      )
    );
  } catch (error) {
    throw error;
  }

  return await getPegasysV2Mocked(proxy.address);
};

// Deploy mocked version of Staked PSYS V2 token for testing
export const deployMockedStkPSYSV2 = async (
  minter: tEthereumAddress, // Address that can mint tokens
  verify?: boolean // Whether to verify contract on etherscan
) => {
  const mockTransferHook = await withSaveAndVerify(
    await new MockTransferHookFactory(await getFirstSigner()).deploy(),
    eContractid.MockTransferHook,
    [],
    verify
  );

  // Deploy proxy
  const proxy = await deployProxy(eContractid.StkPSYSTokenV3Mock);

  // Deploy implementation using PegasysTokenV2MockFactory
  const implementation = await withSaveAndVerify(
    await new PegasysTokenV2MockFactory(await getFirstSigner()).deploy(),
    eContractid.StkPSYSTokenV3,
    [],
    verify,
    eContractid.StkPSYSTokenV3MockImpl
  );

  // Encode initialization parameters
  const encodedPayload = new Interface([
    'function initialize(address minter, address governance, address psysToken)',
  ]).encodeFunctionData('initialize', [
    minter,
    mockTransferHook.address, // Use mock transfer hook as governance
    ONE_ADDRESS,
  ]);

  try {
    await waitForTx(
      await proxy.functions['initialize(address,address,bytes)'](
        implementation.address,
        await (await getFirstSigner()).getAddress(),
        encodedPayload,
        { gasLimit: 1000000 }
      )
    );
  } catch (error) {
    throw error;
  }

  return await getPegasysV2Mocked(proxy.address);
};

// Deploy flash attacks contract for testing purposes
export const deployFlashAttacks = async (
  token: tEthereumAddress, // Token address to test flash attacks against
  minter: tEthereumAddress, // Address that can mint tokens
  governance: tEthereumAddress, // Governance contract address
  verify?: boolean // Whether to verify contract on etherscan
) => {
  const args: [string, string, string] = [token, minter, governance];
  return await withSaveAndVerify(
    await new FlashAttacksFactory(await getFirstSigner()).deploy(...args),
    eContractid.InitializableAdminUpgradeabilityProxy,
    args,
    verify
  );
};

// Deploy all governance related contracts in one function
export const deployFullGovernance = async (
  psys: tEthereumAddress, // PSYS token address
  stakedPSYSV3: tEthereumAddress, // Staked PSYS token address
  admin: tEthereumAddress, // Admin address for executor
  delay: string, // Delay between queue & execution
  gracePeriod: string, // Grace period after delay
  minimumDelay: string, // Minimum delay for proposals
  maximumDelay: string, // Maximum delay for proposals
  propositionThreshold: string, // Threshold for proposition (in basis points)
  voteDuration: string, // Duration of vote
  voteDifferential: string, // Required vote differential (in basis points)
  minimumQuorum: string, // Minimum quorum needed (in basis points)
  votingDelay: string, // Delay before voting begins (in blocks)
  guardian: tEthereumAddress, // Guardian address
  verify?: boolean // Whether to verify contracts
) => {
  // Deploy Governance Strategy
  const governanceStrategy = await deployGovernanceStrategy(psys, stakedPSYSV3, verify);

  // Deploy Executor
  const executor = await deployExecutor(
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

  // Deploy Governance
  const governance = await deployPegasysGovernanceV2(
    governanceStrategy.address,
    votingDelay,
    guardian,
    [executor.address],
    verify
  );

  // Deploy Helper
  const helper = await deployGovernanceV2Helper(verify);

  return {
    governance, // Main governance contract
    executor, // Executor contract
    strategy: governanceStrategy, // Governance strategy contract
    helper, // Governance helper contract
  };
};
