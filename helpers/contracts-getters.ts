import {
  PegasysGovernanceV2Factory,
  AaveTokenV2Factory as PegasysTokenV2Factory,
  ExecutorFactory,
  GovernanceStrategyFactory,
  GovernanceV2HelperFactory,
} from '../types';
import {DRE, getDb} from './misc-utils';
import {eContractid, tEthereumAddress} from './types';

export const getFirstSigner = async () => (await DRE.ethers.getSigners())[0];

export const getPegasysGovernanceV2 = async (address?: tEthereumAddress) =>
  await PegasysGovernanceV2Factory.connect(
    address ||
      (await getDb().get(`${eContractid.PegasysGovernanceV2}.${DRE.network.name}`).value()).address,
    await getFirstSigner()
  );

export const getPegasysV2Mocked = async (address?: tEthereumAddress) =>
  await PegasysTokenV2Factory.connect(
    address ||
      (await getDb().get(`${eContractid.PegasysTokenV2Mock}.${DRE.network.name}`).value()).address,
    await getFirstSigner()
  );

export const getStkPSYSV2Mocked = async (address?: tEthereumAddress) =>
  await PegasysTokenV2Factory.connect(
    address ||
      (await getDb().get(`${eContractid.StkPSYSTokenV2Mock}.${DRE.network.name}`).value()).address,
    await getFirstSigner()
  );

export const getGovernanceStrategy = async (address?: tEthereumAddress) =>
  await GovernanceStrategyFactory.connect(
    address ||
      (await getDb().get(`${eContractid.GovernanceStrategy}.${DRE.network.name}`).value()).address,
    await getFirstSigner()
  );

export const getExecutor = async (address?: tEthereumAddress) =>
  await ExecutorFactory.connect(
    address || (await getDb().get(`${eContractid.Executor}.${DRE.network.name}`).value()).address,
    await getFirstSigner()
  );

export const getGovernanceV2Helper = async (address?: tEthereumAddress) =>
  await GovernanceV2HelperFactory.connect(
    address ||
      (await getDb().get(`${eContractid.GovernanceV2Helper}.${DRE.network.name}`).value()).address,
    await getFirstSigner()
  );
