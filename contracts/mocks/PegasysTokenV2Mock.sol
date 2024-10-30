// SPDX-License-Identifier: agpl-3.0
pragma solidity 0.7.5;

import {PegasysTokenV2, ITransferHook, IERC20} from '@pollum-io/psys-token-v2/contracts/token/PegasysTokenV2.sol';

contract PegasysTokenV2Mock is PegasysTokenV2 {
  /**
   * @dev initializes the contract upon assignment to the InitializableAdminUpgradeabilityProxy
   * @param minter the address of receiver
   * @param governance the address of the governance contract
   * @param pegasysToken the address of the existing Pegasys token
   */
  function initialize(
    address minter,
    ITransferHook governance,
    IERC20 pegasysToken
  ) external initializer {
    uint256 chainId;

    //solium-disable-next-line
    assembly {
      chainId := chainid()
    }

    DOMAIN_SEPARATOR = keccak256(
      abi.encode(
        EIP712_DOMAIN,
        keccak256(bytes(NAME)),
        keccak256(EIP712_REVISION),
        chainId,
        address(this)
      )
    );

    _name = NAME;
    _symbol = SYMBOL;
    _setupDecimals(DECIMALS);

    PEGASYS_TOKEN = pegasysToken;
    _pegasysGovernance = governance;
    _mint(minter, 1e26);
  }
}
