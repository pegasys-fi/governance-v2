import {expect, use} from 'chai';
import {solidity} from 'ethereum-waffle';
import {BigNumber} from 'ethers';
import {MAX_UINT_AMOUNT} from '../helpers/constants';
import {DRE} from '../helpers/misc-utils';
import {buildDelegateByTypeParams, buildDelegateParams} from './helpers/delegation';
import {calculateUserTotalPowers, setTokenBalance} from './helpers/gov-utils';
import {deployGovernance, makeSuite, TestEnv} from './helpers/make-suite';
import {getSignatureFromTypedData} from './helpers/permit';

enum DelegationType {
  VOTING_POWER = 0,
  PROPOSITION_POWER,
}

use(solidity);

makeSuite('Pegasys Governance v2 Helpers tests', deployGovernance, (testEnv: TestEnv) => {
  const expiry = MAX_UINT_AMOUNT;
  const USER1_PSYS_BALANCE = BigNumber.from(1000);
  const USER1_STKPSYS_BALANCE = BigNumber.from(2000);
  const USER2_PSYS_BALANCE = BigNumber.from(3000);
  const USER2_STKPSYS_BALANCE = BigNumber.from(4000);

  beforeEach(async () => {
    const {
      users: [user1, user2],
    } = testEnv;

    await setTokenBalance(user1, USER1_PSYS_BALANCE, testEnv.psys, testEnv);
    await setTokenBalance(user1, USER1_STKPSYS_BALANCE, testEnv.stkPSYS, testEnv);

    await setTokenBalance(user2, USER2_PSYS_BALANCE, testEnv.psys, testEnv);
    await setTokenBalance(user2, USER2_STKPSYS_BALANCE, testEnv.stkPSYS, testEnv);
  });

  describe('Testing delegateTokensBySig function', () => {
    it('should revert with INCONSISTENT_PARAMS_LENGTH if length of tokens is different than params', async () => {
      const {
        govHelper,
        psys,
        users: [user1],
      } = testEnv;
      await expect(
        govHelper.connect(user1.signer).delegateTokensBySig([psys.address], [])
      ).to.revertedWith('INCONSISTENT_PARAMS_LENGTH');
    });
    it('should delegate both VOTING and PROPOSITION power from both PSYS and stkPSYS', async () => {
      const {chainId} = await DRE.ethers.provider.getNetwork();
      const {
        govHelper,
        psys,
        stkPSYS,
        users: [user1, user2],
      } = testEnv;
      const user1PrivateKey = require('../test-wallets.js').accounts[2].secretKey;

      // building pegasys signature
      const psysNonce = (await psys.connect(user1.signer)._nonces(user1.address)).toString();
      const pegasysTypedData = buildDelegateParams(
        chainId,
        psys.address,
        await psys.connect(user1.signer).name(),
        user2.address,
        psysNonce,
        expiry
      );
      const {v, r, s} = getSignatureFromTypedData(user1PrivateKey, pegasysTypedData);
      const psysParams = {
        delegatee: user2.address,
        nonce: psysNonce,
        expiry,
        v,
        r,
        s,
      };

      // building stkPSYS signature
      const stkPSYSNonce = (await stkPSYS.connect(user1.signer)._nonces(user1.address)).toString();
      const stkPSYSTypedData = buildDelegateParams(
        chainId,
        stkPSYS.address,
        await stkPSYS.connect(user1.signer).name(),
        user2.address,
        stkPSYSNonce,
        expiry
      );
      const {v: v1, r: r1, s: s1} = getSignatureFromTypedData(user1PrivateKey, stkPSYSTypedData);
      const stkPSYSParams = {
        delegatee: user2.address,
        nonce: stkPSYSNonce,
        expiry,
        v: v1,
        r: r1,
        s: s1,
      };

      const user2Powers = await calculateUserTotalPowers(
        user2,
        [psys.address, stkPSYS.address],
        testEnv
      );

      expect(
        await govHelper
          .connect(user1.signer)
          .delegateTokensBySig([psys.address, stkPSYS.address], [psysParams, stkPSYSParams])
      );

      const user2NewPowers = await calculateUserTotalPowers(
        user2,
        [psys.address, stkPSYS.address],
        testEnv
      );

      expect(user2NewPowers.propositionPower).to.eq(
        user2Powers.propositionPower.add(USER1_PSYS_BALANCE).add(USER1_STKPSYS_BALANCE)
      );
      expect(user2NewPowers.votingPower).to.eq(
        user2Powers.votingPower.add(USER1_PSYS_BALANCE).add(USER1_STKPSYS_BALANCE)
      );
    });
  });

  describe('Testing delegateTokensByTypeBySig function', () => {
    it('should revert with INCONSISTENT_PARAMS_LENGTH if length of tokens is different than params', async () => {
      const {
        govHelper,
        psys,
        users: [user1],
      } = testEnv;
      await expect(
        govHelper.connect(user1.signer).delegateTokensByTypeBySig([psys.address], [])
      ).to.revertedWith('INCONSISTENT_PARAMS_LENGTH');
    });
    it('should delegate VOTING power from both PSYS and stkPSYS', async () => {
      const {chainId} = await DRE.ethers.provider.getNetwork();
      const {
        govHelper,
        psys,
        stkPSYS,
        users: [user1, user2],
      } = testEnv;
      const user1PrivateKey = require('../test-wallets.js').accounts[2].secretKey;

      const powerType = DelegationType.VOTING_POWER;

      // building pegasys signature
      const psysNonce = (await psys.connect(user1.signer)._nonces(user1.address)).toString();
      const pegasysTypedData = buildDelegateByTypeParams(
        chainId,
        psys.address,
        await psys.connect(user1.signer).name(),
        user2.address,
        powerType.toString(),
        psysNonce,
        expiry
      );
      const {v, r, s} = getSignatureFromTypedData(user1PrivateKey, pegasysTypedData);
      const psysParams = {
        delegatee: user2.address,
        delegationType: powerType,
        nonce: psysNonce,
        expiry,
        v,
        r,
        s,
      };

      // building stkPSYS signature
      const stkPSYSNonce = (await stkPSYS.connect(user1.signer)._nonces(user1.address)).toString();
      const stkPSYSTypedData = buildDelegateByTypeParams(
        chainId,
        stkPSYS.address,
        await stkPSYS.connect(user1.signer).name(),
        user2.address,
        powerType.toString(),
        stkPSYSNonce,
        expiry
      );
      const {v: v1, r: r1, s: s1} = getSignatureFromTypedData(user1PrivateKey, stkPSYSTypedData);
      const stkPSYSParams = {
        delegatee: user2.address,
        delegationType: powerType,
        nonce: stkPSYSNonce,
        expiry,
        v: v1,
        r: r1,
        s: s1,
      };
      const user2Powers = await calculateUserTotalPowers(
        user2,
        [psys.address, stkPSYS.address],
        testEnv
      );

      expect(
        await govHelper
          .connect(user1.signer)
          .delegateTokensByTypeBySig([psys.address, stkPSYS.address], [psysParams, stkPSYSParams])
      );

      const user2NewPowers = await calculateUserTotalPowers(
        user2,
        [psys.address, stkPSYS.address],
        testEnv
      );

      expect(user2NewPowers.propositionPower).to.eq(user2Powers.propositionPower);
      expect(user2NewPowers.votingPower).to.eq(
        user2Powers.votingPower.add(USER1_PSYS_BALANCE).add(USER1_STKPSYS_BALANCE)
      );
    });

    it('should delegate PROPOSITION power from both PSYS and stkPSYS', async () => {
      const {chainId} = await DRE.ethers.provider.getNetwork();
      const {
        govHelper,
        psys,
        stkPSYS,
        users: [user1, user2],
      } = testEnv;
      const user1PrivateKey = require('../test-wallets.js').accounts[2].secretKey;

      const powerType = DelegationType.PROPOSITION_POWER;

      // building pegasys signature
      const psysNonce = (await psys.connect(user1.signer)._nonces(user1.address)).toString();
      const pegasysTypedData = buildDelegateByTypeParams(
        chainId,
        psys.address,
        await psys.connect(user1.signer).name(),
        user2.address,
        powerType.toString(),
        psysNonce,
        expiry
      );
      const {v, r, s} = getSignatureFromTypedData(user1PrivateKey, pegasysTypedData);
      const psysParams = {
        delegatee: user2.address,
        delegationType: powerType,
        nonce: psysNonce,
        expiry,
        v,
        r,
        s,
      };

      // building stkPSYS signature

      const stkPSYSNonce = (await stkPSYS.connect(user1.signer)._nonces(user1.address)).toString();
      const stkPSYSTypedData = buildDelegateByTypeParams(
        chainId,
        stkPSYS.address,
        await stkPSYS.connect(user1.signer).name(),
        user2.address,
        powerType.toString(),
        stkPSYSNonce,
        expiry
      );
      const {v: v1, r: r1, s: s1} = getSignatureFromTypedData(user1PrivateKey, stkPSYSTypedData);
      const stkPSYSParams = {
        delegatee: user2.address,
        delegationType: powerType,
        nonce: stkPSYSNonce,
        expiry,
        v: v1,
        r: r1,
        s: s1,
      };

      const user2Powers = await calculateUserTotalPowers(
        user2,
        [psys.address, stkPSYS.address],
        testEnv
      );

      expect(
        await govHelper
          .connect(user1.signer)
          .delegateTokensByTypeBySig([psys.address, stkPSYS.address], [psysParams, stkPSYSParams])
      );

      const user2NewPowers = await calculateUserTotalPowers(
        user2,
        [psys.address, stkPSYS.address],
        testEnv
      );

      expect(user2NewPowers.votingPower).to.eq(user2Powers.votingPower);
      expect(user2NewPowers.propositionPower).to.eq(
        user2Powers.propositionPower.add(USER1_PSYS_BALANCE).add(USER1_STKPSYS_BALANCE)
      );
    });
  });
});
