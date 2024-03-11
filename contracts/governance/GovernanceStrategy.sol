// SPDX-License-Identifier: agpl-3.0
pragma solidity 0.7.5;
pragma abicoder v2;

import {IGovernanceStrategy} from '../interfaces/IGovernanceStrategy.sol';
import {IERC20} from '../interfaces/IERC20.sol';
import {IGovernancePowerDelegationToken} from '../interfaces/IGovernancePowerDelegationToken.sol';

/**
 * @title Governance Strategy contract
 * @dev Smart contract containing logic to measure users' relative power to propose and vote.
 * User Power = User Power from Pegasys Token + User Power from stkPSYS Token.
 * User Power from Token = Token Power + Token Power as Delegatee [- Token Power if user has delegated]
 * Two wrapper functions linked to Pegasys Tokens's GovernancePowerDelegationERC20.sol implementation
 * - getPropositionPowerAt: fetching a user Proposition Power at a specified block
 * - getVotingPowerAt: fetching a user Voting Power at a specified block
 * @author Pegasys
 **/
contract GovernanceStrategy is IGovernanceStrategy {
  address public immutable PSYS;
  address public immutable STK_PSYS;

  /**
   * @dev Constructor, register tokens used for Voting and Proposition Powers.
   * @param psys The address of the PSYS Token contract.
   * @param stkPSYS The address of the stkPSYS Token Contract
   **/
  constructor(address psys, address stkPSYS) {
    PSYS = psys;
    STK_PSYS = stkPSYS;
  }

  /**
   * @dev Returns the total supply of Proposition Tokens Available for Governance
   * = PSYS Available for governance      + stkPSYS available
   * The supply of PSYS staked in stkPSYS are not taken into account so:
   * = (Supply of PSYS - PSYS in stkPSYS) + (Supply of stkPSYS)
   * = Supply of PSYS, Since the supply of stkPSYS is equal to the number of PSYS staked
   * @param blockNumber Blocknumber at which to evaluate
   * @return total supply at blockNumber
   **/
  function getTotalPropositionSupplyAt(uint256 blockNumber) public view override returns (uint256) {
    return IERC20(PSYS).totalSupplyAt(blockNumber);
  }

  /**
   * @dev Returns the total supply of Outstanding Voting Tokens
   * @param blockNumber Blocknumber at which to evaluate
   * @return total supply at blockNumber
   **/
  function getTotalVotingSupplyAt(uint256 blockNumber) public view override returns (uint256) {
    return getTotalPropositionSupplyAt(blockNumber);
  }

  /**
   * @dev Returns the Proposition Power of a user at a specific block number.
   * @param user Address of the user.
   * @param blockNumber Blocknumber at which to fetch Proposition Power
   * @return Power number
   **/
  function getPropositionPowerAt(address user, uint256 blockNumber)
    public
    view
    override
    returns (uint256)
  {
    return
      _getPowerByTypeAt(
        user,
        blockNumber,
        IGovernancePowerDelegationToken.DelegationType.PROPOSITION_POWER
      );
  }

  /**
   * @dev Returns the Vote Power of a user at a specific block number.
   * @param user Address of the user.
   * @param blockNumber Blocknumber at which to fetch Vote Power
   * @return Vote number
   **/
  function getVotingPowerAt(address user, uint256 blockNumber)
    public
    view
    override
    returns (uint256)
  {
    return
      _getPowerByTypeAt(
        user,
        blockNumber,
        IGovernancePowerDelegationToken.DelegationType.VOTING_POWER
      );
  }

  function _getPowerByTypeAt(
    address user,
    uint256 blockNumber,
    IGovernancePowerDelegationToken.DelegationType powerType
  ) internal view returns (uint256) {
    return
      IGovernancePowerDelegationToken(PSYS).getPowerAtBlock(user, blockNumber, powerType) +
      IGovernancePowerDelegationToken(STK_PSYS).getPowerAtBlock(user, blockNumber, powerType);
  }
}
