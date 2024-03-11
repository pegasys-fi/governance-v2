import {tEthereumAddress, eContractid} from './types';
import {getPegasysV2Mocked, getFirstSigner} from './contracts-getters';
import {
  PegasysGovernanceV2Factory,
  ExecutorFactory,
  GovernanceStrategyFactory,
  InitializableAdminUpgradeabilityProxyFactory,
  PegasysTokenV1MockFactory,
  AaveTokenV2Factory as PegasysTokenV2Factory,
  FlashAttacksFactory,
  GovernanceV2HelperFactory,
} from '../types';
import {withSaveAndVerify} from './contracts-helpers';
import {waitForTx} from './misc-utils';
import {Interface} from 'ethers/lib/utils';

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
  stkPSYS: tEthereumAddress,
  verify?: boolean
) => {
  const args: [tEthereumAddress, tEthereumAddress] = [psys, stkPSYS];
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
  const proxy = await deployProxy(eContractid.PegasysTokenV2Mock);

  const implementationV1 = await withSaveAndVerify(
    await new PegasysTokenV1MockFactory(await getFirstSigner()).deploy(),
    eContractid.PegasysTokenV1Mock,
    [],
    verify,
    eContractid.PegasysTokenV1MockImpl
  );
  const implementationV2 = await withSaveAndVerify(
    await new PegasysTokenV2Factory(await getFirstSigner()).deploy(),
    eContractid.PegasysTokenV2,
    [],
    verify,
    eContractid.PegasysTokenV2MockImpl
  );
  const encodedPayload = new Interface([
    'function initialize(address minter)',
  ]).encodeFunctionData('initialize', [minter]);
  await waitForTx(
    await proxy.functions['initialize(address,address,bytes)'](
      implementationV1.address,
      await (await getFirstSigner()).getAddress(),
      encodedPayload
    )
  );
  const encodedPayloadV2 = implementationV2.interface.encodeFunctionData('initialize');
  await waitForTx(await proxy.upgradeToAndCall(implementationV2.address, encodedPayloadV2));
  return await getPegasysV2Mocked(proxy.address);
};

export const deployMockedStkPSYSV2 = async (minter: tEthereumAddress, verify?: boolean) => {
  const proxy = await deployProxy(eContractid.StkPSYSTokenV2Mock);

  const implementationV1 = await withSaveAndVerify(
    await new PegasysTokenV1MockFactory(await getFirstSigner()).deploy(),
    eContractid.StkPSYSTokenV1Mock,
    [],
    verify,
    eContractid.StkPSYSTokenV1MockImpl
  );
  const implementationV2 = await withSaveAndVerify(
    await new PegasysTokenV2Factory(await getFirstSigner()).deploy(),
    eContractid.StkPSYSTokenV2,
    [],
    verify,
    eContractid.StkPSYSTokenV2MockImpl
  );
  const encodedPayload = new Interface([
    'function initialize(address minter)',
  ]).encodeFunctionData('initialize', [minter]);
  await waitForTx(
    await proxy.functions['initialize(address,address,bytes)'](
      implementationV1.address,
      await (await getFirstSigner()).getAddress(),
      encodedPayload
    )
  );
  const encodedPayloadV2 = implementationV2.interface.encodeFunctionData('initialize');
  await waitForTx(await proxy.upgradeToAndCall(implementationV2.address, encodedPayloadV2));
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
