export enum eEthereumNetwork {
  main = 'main',
  coverage = 'coverage',
  hardhat = 'hardhat',
}

export enum EthereumNetworkNames {
  main = 'main',
}

export enum PegasysPools {
  proto = 'proto',
  secondary = 'secondary',
}

export enum eContractid {
  PegasysGovernanceV2 = 'PegasysGovernanceV2',
  GovernanceStrategy = 'GovernanceStrategy',
  Executor = 'Executor',
  InitializableAdminUpgradeabilityProxy = 'InitializableAdminUpgradeabilityProxy',
  PegasysTokenV2MockImpl = 'PegasysTokenV1MockImpl',
  PegasysTokenV2Mock = 'PegasysTokenV2Mock',
  ExecutorMock = 'ExecutorMock',
  StkPSYSTokenV3Mock = 'StkPSYSTokenV2Mock',
  StkPSYSTokenV3 = 'StkPSYSTokenV2',
  StkPSYSTokenV3MockImpl = 'StkPSYSTokenV2MockImpl',
  GovernanceV2Helper = 'GovernanceV2Helper',
  MockTransferHook = 'MockTransferHook',
}

export type tEthereumAddress = string;
