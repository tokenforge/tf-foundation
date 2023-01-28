// SPDX-License-Identifier: MIT
// (C) by TokenForge GmbH, Berlin
// Author: Hagen Hübel, hagen@token-forge.io
/**
 * @dev Learn more about this on https://token-forge.io


 _______    _              ______
 |__   __|  | |            |  ____|
 | | ___ | | _____ _ __ | |__ ___  _ __ __ _  ___
 | |/ _ \| |/ / _ \ '_ \|  __/ _ \| '__/ _` |/ _ \
 | | (_) |   <  __/ | | | | | (_) | | | (_| |  __/
 |_|\___/|_|\_\___|_| |_|_|  \___/|_|  \__, |\___|
 __/ |
 |___/

 */


import {ethers, upgrades} from 'hardhat';
import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';

import {SignerWithAddress} from '@nomiclabs/hardhat-ethers/signers';

import {BigNumber, BigNumberish, Signer} from "ethers";
import {
    TokenForge1155v3Upgradeable,
    TokenForge1155v3Upgradeable__factory
} from "../../typechain";


chai.use(chaiAsPromised);
const {expect} = chai;

describe('TokenForge1155v3 Upgradeable BasicTests', () => {
    let token: TokenForge1155v3Upgradeable,
        axel: SignerWithAddress,
        ben: SignerWithAddress,
        chantal: SignerWithAddress,
        governance: SignerWithAddress,
        backend: SignerWithAddress
    ;

    const createSignature = async (
        to: string,
        tokenId: BigNumberish,
        amount: BigNumberish,
        hash: string,
        signerAccount: Signer = backend,
    ) => {
        const message = await token.createMessage(to, tokenId, amount, hash);
        return await signerAccount.signMessage(ethers.utils.arrayify(message));
    };

    beforeEach(async () => {
        [axel, ben, chantal, governance, backend] = await ethers.getSigners();

        try {
            const tokenFactory = (await ethers.getContractFactory('TokenForge1155v3Upgradeable', governance)) as TokenForge1155v3Upgradeable__factory;

            token = (await upgrades.deployProxy(tokenFactory, [backend.address, 'ipfs://'])) as TokenForge1155v3Upgradeable;
            await token.deployed();

            expect(token.address).to.properAddress;
        }
        catch(e) {
            console.log(e);
        }
    });

    describe('we can mint tokens', async () => {
        const
            tokenId = 1001,
            amount = 1,
            hash = 'NgcFOAfYXwVrmQrUOyB0U5kWU4w1a8Gf2gPPTPBrGTqTl-6qe7ERStbEMamFV4niv1bhFKI5167vzMLApLOEBs0ArvvUiClrRAFb=w600';

        let sigForBenCreate: string,
            sigForAxelMint: string,
            sigForChantalMint: string,
            axelAsMinter: TokenForge1155v3Upgradeable,
            benAsMinter: TokenForge1155v3Upgradeable,
            chantalAsMinterWithSignature: TokenForge1155v3Upgradeable;

        beforeEach(async () => {
            // Signature for Ben to create a token into axels wallet
            sigForBenCreate = await createSignature(axel.address, tokenId, amount, hash, backend);
            sigForAxelMint = await createSignature(axel.address, tokenId, amount, '', backend);
            sigForChantalMint = await createSignature(chantal.address, tokenId, amount, '', backend);
            
            axelAsMinter = token.connect(axel);
            benAsMinter = token.connect(ben);
            chantalAsMinterWithSignature = token.connect(chantal);

            // Only Axel gets Minter role
            // Chantal will sign with createMessage-signature
            // Ben has nothing, no roles, nada, niente
            
            await token.grantRole(await token.MINTER_ROLE(), axel.address);
        })
        
        const checkTokenBalanceForAxel = async(totalSupplyBefore: BigNumber, delta: number = 0) => {
            const balance = await token.balanceOf(axel.address, tokenId);
            expect(balance).to.eq(1 + delta);

            const totalSupply = await token.totalSupply(tokenId);
            expect(totalSupply).to.eq(totalSupplyBefore.add(amount + delta));

            const uri = await token.uri(tokenId);
            expect(uri).to.eq(hash);
        }

        it('should create tokens to Axel successfully', async () => {
            const totalSupplyBefore = await token.totalSupply(tokenId);

            const balanceBefore = await token.balanceOf(axel.address, tokenId);
            expect(balanceBefore).to.eq(0);

            await axelAsMinter.create(axel.address, tokenId, amount, hash);

            await checkTokenBalanceForAxel(totalSupplyBefore);

            await axelAsMinter.mint(tokenId, amount);

            await checkTokenBalanceForAxel(totalSupplyBefore, 1);

        });

        it('should create tokens by Ben and mint to Chantal successfully with signature', async () => {
            const totalSupplyBefore = await token.totalSupply(tokenId);

            const balanceBefore = await token.balanceOf(axel.address, tokenId);
            expect(balanceBefore).to.eq(0);

            await benAsMinter.createWithSignature(axel.address, tokenId, amount, hash, sigForBenCreate);
            await checkTokenBalanceForAxel(totalSupplyBefore);

            await chantalAsMinterWithSignature.mintWithSignature(tokenId, amount, sigForChantalMint);
        });

        it('should fail when minting tokens happens without creation', async () => {
            const balanceBefore = await token.balanceOf(axel.address, tokenId);
            expect(balanceBefore).to.eq(0);

            await expect(chantalAsMinterWithSignature.mintWithSignature(tokenId, amount, sigForAxelMint)).to.be.revertedWith('TokenForge1155v3Upgradeable: token is not defined yet');
        });

        it('should fail when non-minter-role will create tokens', async () => {
            await expect(benAsMinter.create(ben.address, tokenId, amount, hash)).to.be.revertedWith('TokenForge1155v3Upgradeable: caller has no minter role');
        });

    })

    describe('testing some governance stuff', async () => {
        let axelAsMinter: TokenForge1155v3Upgradeable;

        beforeEach(async () => {
            axelAsMinter = token.connect(axel);
        })

        it('will revert if non-owners will change signer account', async() => {
            const benAsSigner = token.connect(ben)
            await expect(benAsSigner.setSigner(axel.address)).to.be.revertedWith('TokenForge1155v3Upgradeable: caller is not the owner nor admin')
        })

        it('governance can change signer account', async() => {
            await expect(token.setSigner(axel.address))
                .to.emit(token, 'SignerChanged')
                .withArgs(backend.address, axel.address);
        })

        it('Withdrawal as non-owner will be reverted', async () => {
            await expect(axelAsMinter.withdraw()).to.be.revertedWith('TokenForge1155v3Upgradeable: caller is not the owner')
        })

    });

});

export function ether(e: BigNumberish): BigNumber {
    return ethers.utils.parseUnits(e.toString(), 'ether');
}

export function formatBytesString(text: string): string {
    const bytes = ethers.utils.toUtf8Bytes(text);

    return ethers.utils.hexlify(bytes);
}
