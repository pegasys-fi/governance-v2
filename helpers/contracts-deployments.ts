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

export const deployGovernanceV2Helper = async (verify?: boolean) => {
  return withSaveAndVerify(
    await new GovernanceV2HelperFactory(await getFirstSigner()).deploy(),
    eContractid.GovernanceV2Helper,
    [],
    verify
  );
};

export const deployPegasysGovernanceV2 = async (
  governanceStrategy: tEthereumAddress,
  votingDelay: string,
  guardian: tEthereumAddress,
  executors: tEthereumAddress[],
  verify?: boolean
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

export const deployGovernanceStrategy = async (
  psys: tEthereumAddress,
  stakedPSYSV3: tEthereumAddress,
  verify?: boolean
) => {
  const args: [tEthereumAddress, tEthereumAddress] = [psys, stakedPSYSV3];
  return withSaveAndVerify(
    await new GovernanceStrategyFactory(await getFirstSigner()).deploy(...args),
    eContractid.GovernanceStrategy,
    args,
    verify
  );
};

export const deployExecutor = async (
  admin: tEthereumAddress,
  delay: string,
  gracePeriod: string,
  minimumDelay: string,
  maximumDelay: string,
  propositionThreshold: string,
  voteDuration: string,
  voteDifferential: string,
  minimumQuorum: string,

  verify?: boolean
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

export const deployProxy = async (customId: string, verify?: boolean) =>
  await withSaveAndVerify(
    await new InitializableAdminUpgradeabilityProxyFactory(await getFirstSigner()).deploy(),
    eContractid.InitializableAdminUpgradeabilityProxy,
    [],
    verify,
    customId
  );

export const deployMockedPegasysV2 = async (minter: tEthereumAddress, verify?: boolean) => {
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

export const deployMockedStkPSYSV2 = async (minter: tEthereumAddress, verify?: boolean) => {
  // First deploy the MockTransferHook
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

export const deployFlashAttacks = async (
  token: tEthereumAddress,
  minter: tEthereumAddress,
  governance: tEthereumAddress,
  verify?: boolean
) => {
  const args: [string, string, string] = [token, minter, governance];
  return await withSaveAndVerify(
    await new FlashAttacksFactory(await getFirstSigner()).deploy(...args),
    eContractid.InitializableAdminUpgradeabilityProxy,
    args,
    verify
  );
};
