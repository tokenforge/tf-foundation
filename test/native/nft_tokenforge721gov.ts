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


import {ethers} from 'hardhat';
import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';

import {SignerWithAddress} from '@nomiclabs/hardhat-ethers/signers';

import {BigNumber, BigNumberish, Signer} from "ethers";
import {TokenForge721gov, TokenForge721gov__factory} from "../../typechain";


chai.use(chaiAsPromised);
const {expect} = chai;
describe('TokenForge721gov Tests', () => {
    let token: TokenForge721gov,
        axel: SignerWithAddress,
        ben: SignerWithAddress,
        chantal: SignerWithAddress,
        governance: SignerWithAddress,
        backend: SignerWithAddress
    ;

    const createSignature = async (
        to: string,
        tokenId: BigNumberish,
        hash: string,
        signerAccount: Signer = backend,
    ) => {

        const message = await token.createMessage(to, tokenId, hash);
        return await signerAccount.signMessage(ethers.utils.arrayify(message));
    };

    beforeEach(async () => {
        [axel, ben, chantal, governance, backend] = await ethers.getSigners();

        const tokenFactory = (await ethers.getContractFactory('TokenForge721gov', governance)) as TokenForge721gov__factory;

        token = await tokenFactory.deploy('name', 'symbol', backend.address, 'ipfs://');
        await token.deployed();

        expect(token.address).to.properAddress;

        await token.grantRole(await token.TRANSFEROR_ROLE(), governance.address);
    });

    // 4
    describe('we can mint tokens', async () => {
        const
            tokenId = 1001,
            hash = 'NgcFOAfYXwVrmQrUOyB0U5kWU4w1a8Gf2gPPTPBrGTqTl-6qe7ERStbEMamFV4niv1bhFKI5167vzMLApLOEBs0ArvvUiClrRAFb=w600';

        let sigForAxel: string,
            axelAsSigner: TokenForge721gov,
            chantalAsSigner: TokenForge721gov,
            benAsBurner: TokenForge721gov;

        beforeEach(async () => {
            sigForAxel = await createSignature(axel.address, tokenId, hash, backend);
            axelAsSigner = token.connect(axel);
            benAsBurner = token.connect(ben);
            chantalAsSigner = token.connect(chantal);

            await token.grantRole(await token.BURNER_ROLE(), ben.address);
        })

        describe.only('With Axel minting tokens...', async () => {
            
            let governanceAsSigner: TokenForge721gov;

            beforeEach(async () => {
                await axelAsSigner.mintWithSignature(tokenId, hash, sigForAxel);
                
                governanceAsSigner = token.connect(governance);
            })

            it('Burner is allowed to burn Axels token', async () => {
                await expect(benAsBurner.burnAs(tokenId))
                    .to.emit(token, 'Transfer')
                    .withArgs(axel.address, ethers.constants.AddressZero, tokenId)
            });

            it('Non-Burner is NOT allowed to burn Axels token', async () => {
                await expect(chantalAsSigner.burnAs(tokenId))
                    .to.revertedWith('TokenForge721gov: caller has no burner role');
            });

            it('Governance account will be allowed to transfer Axels token', async() => {
                await expect(governanceAsSigner.transferFromAs(axel.address, ben.address, tokenId))
                    .to.emit(token, 'Transfer')
                    .withArgs(axel.address, ben.address, tokenId)
            })

            it('Governance account will be allowed to safe-transfer Axels token', async() => {
                await expect(governanceAsSigner.safeTransferFromAs(axel.address, ben.address, tokenId, '0x'))
                    .to.emit(token, 'Transfer')
                    .withArgs(axel.address, ben.address, tokenId)
            })

            it('Non-Governance account will NOT be allowed to transfer Axels token', async() => {
                await expect(benAsBurner.transferFromAs(axel.address, ben.address, tokenId))
                    .to.be.revertedWith('TokenForge721gov: caller has no transferor role')
            })

            it('Non-Governance account will NOT be allowed to safe-transfer Axels token', async() => {
                await expect(benAsBurner.safeTransferFromAs(axel.address, ben.address, tokenId, '0x'))
                    .to.be.revertedWith('TokenForge721gov: caller has no transferor role')
            })
            
        })


    });

});

