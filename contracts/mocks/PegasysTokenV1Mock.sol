import {AaveToken} from '@aave/aave-token/contracts/token/AaveToken.sol';

contract PegasysTokenV1Mock is AaveToken {
  /**
   * @dev initializes the contract upon assignment to the InitializableAdminUpgradeabilityProxy
   * @param minter the address of the LEND -> PSYS migration contract
   */
  function initialize(address minter) external initializer {
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
    // _pegasysGovernance = pegasysGovernance;
    _mint(minter, MIGRATION_AMOUNT);
    _mint(minter, DISTRIBUTION_AMOUNT);
  }
}
