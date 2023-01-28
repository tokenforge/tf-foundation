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
import {TokenForge721, TokenForge721__factory} from "../../typechain";


chai.use(chaiAsPromised);
const {expect} = chai;
describe('TokenForge721 BasicTests', () => {
    let token: TokenForge721,
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

        const tokenFactory = (await ethers.getContractFactory('TokenForge721', governance)) as TokenForge721__factory;

        token = await tokenFactory.deploy('name', 'symbol', backend.address, 'ipfs://');
        await token.deployed();

        expect(token.address).to.properAddress;
    });

    // 4
    describe('we can mint tokens', async () => {
        const
            tokenId = 1001,
            hash = 'NgcFOAfYXwVrmQrUOyB0U5kWU4w1a8Gf2gPPTPBrGTqTl-6qe7ERStbEMamFV4niv1bhFKI5167vzMLApLOEBs0ArvvUiClrRAFb=w600';

        let sigForAxel: string,
            axelAsSigner: TokenForge721,
            chantalAsMinter: TokenForge721;

        beforeEach(async () => {
            sigForAxel = await createSignature(axel.address, tokenId, hash, backend);
            axelAsSigner = token.connect(axel);
            chantalAsMinter = token.connect(chantal);
        })

        it('should mint tokens to Axel successfully', async () => {
            const totalSupplyBefore = await token.totalSupply();

            const balanceBefore = await token.balanceOf(axel.address);
            expect(balanceBefore).to.eq(0);

            await axelAsSigner.mintWithSignature(tokenId, hash, sigForAxel);

            const balance = await token.balanceOf(axel.address);
            expect(balance).to.eq(1);

            const totalSupply = await token.totalSupply();
            expect(totalSupply).to.eq(totalSupplyBefore.add(1));

            const uri = await token.tokenURI(tokenId);
            expect(uri).to.eq('ipfs://' + hash);
        });

        it('should auto mint tokens to Axel successfully with signature', async () => {
            const totalSupplyBefore = await token.totalSupply();

            const balanceBefore = await token.balanceOf(axel.address);
            expect(balanceBefore).to.eq(0);

            const sig = await createSignature(axel.address, 0, hash, backend);

            // this will revert without reason
            await expect(axelAsSigner.mintAutoWithSignature(hash, sig))
                .to.emit(token, 'Transfer')

            const balance = await token.balanceOf(axel.address);
            expect(balance).to.eq(1);

            const totalSupply = await token.totalSupply();
            expect(totalSupply).to.eq(totalSupplyBefore.add(1));

            const tokenId = await token.currentTokenId();
            const uri = await token.tokenURI(tokenId);
            expect(uri).to.eq('ipfs://' + hash);
        });

        it('should revert when auto minting tokens with wrong signature', async () => {
            const sig = await createSignature(axel.address, 0, hash + '-manipulated', backend);

            // this will revert without reason
            await expect(axelAsSigner.mintAutoWithSignature(hash, sig))
                .to.be.revertedWith('Either signature is wrong or parameters have been corrupted');
        });

        it('should revert when non-minter will try auto mint', async () => {
            // this will revert without reason
            await expect(chantalAsMinter.mintAuto(hash))
                .to.be.revertedWith('TokenForge721: caller has no minter role');
        });

        it('will revert if non-owners will change signer account', async () => {
            const benAsSigner = token.connect(ben)
            await expect(benAsSigner.setSigner(axel.address)).to.be.revertedWith('Ownable: caller is not the owner')
        })

        it('governance can change signer account', async () => {
            await expect(token.setSigner(axel.address))
                .to.emit(token, 'SignerChanged')
                .withArgs(backend.address, axel.address);
        })

        it('governance can change baseUri', async () => {
            await expect(token.setBaseUri('new://uri'))
                .to.emit(token, 'BaseUriChanged')
                .withArgs('ipfs://', 'new://uri');
        })

        it('non-governance can NOT change baseUri', async () => {
            await expect(axelAsSigner.setBaseUri('new://uri'))
                .to.revertedWith('Ownable: caller is not the owner');
        })
        
        describe('with Axel as a minter', async () => {

            let axelAsMinter: TokenForge721;


            beforeEach(async () => {
                const minterRole = await token.MINTER_ROLE();
                await token.grantRole(minterRole, axel.address)

                axelAsMinter = token.connect(axel);
            })

            it('should auto mint tokens to Axel successfully', async () => {
                const totalSupplyBefore = await token.totalSupply();

                const balanceBefore = await token.balanceOf(axel.address);
                expect(balanceBefore).to.eq(0);

                // this will revert without reason
                await expect(axelAsMinter.mintAuto(hash))
                    .to.emit(axelAsMinter, 'Transfer')
                    .withArgs(ethers.constants.AddressZero, axel.address, 1)

                const balance = await token.balanceOf(axel.address);
                expect(balance).to.eq(1);

                const totalSupply = await token.totalSupply();
                expect(totalSupply).to.eq(totalSupplyBefore.add(1));

                const tokenId = await token.currentTokenId();
                const uri = await token.tokenURI(tokenId);
                expect(uri).to.eq('ipfs://' + hash);
            });

            it('should mint specific tokens to Axel successfully', async () => {
                const totalSupplyBefore = await token.totalSupply();

                const balanceBefore = await token.balanceOf(axel.address);
                expect(balanceBefore).to.eq(0);

                // this will revert without reason
                await expect(axelAsMinter.mint(98, hash))
                    .to.emit(axelAsMinter, 'Transfer')
                    .withArgs(ethers.constants.AddressZero, axel.address, 98)

                const balance = await token.balanceOf(axel.address);
                expect(balance).to.eq(1);

                const totalSupply = await token.totalSupply();
                expect(totalSupply).to.eq(totalSupplyBefore.add(1));

                const tokenId = await token.currentTokenId();
                const uri = await token.tokenURI(tokenId);
                expect(uri).to.eq('ipfs://' + hash);
            });

            it('Axel should be able to burn his own tokens', async () => {
                // this will revert without reason
                expect(axelAsMinter.mint(512, hash))
                    .to.emit(axelAsMinter, 'Transfer')
                    .withArgs(ethers.constants.AddressZero, axel.address, 512)
                
                await expect(axelAsMinter.burn(512))
                    .to.emit(token, 'Transfer')
                    .withArgs(axel.address, ethers.constants.AddressZero, 512)
            })

            it('Ben should NOT be able to burn Axels tokens', async () => {
                // this will revert without reason
                await axelAsMinter.mint(512, hash)

                const benAsBurner = token.connect(ben);
                await expect(benAsBurner.burn(512))
                    .to.revertedWith('ERC721: caller is not token owner nor approved')                 
            })

            it('Ben should be allowed to burn Axels tokens once he got approval from Axel to do that', async () => {
                // this will revert without reason
                await axelAsMinter.mint(512, hash)
                await axelAsMinter.approve(ben.address, 512);

                const benAsBurner = token.connect(ben);
                await expect(benAsBurner.burn(512))
                    .to.emit(token, 'Transfer')
                    .withArgs(axel.address, ethers.constants.AddressZero, 512)
            })

        })

        describe('Playing with TokenId', async () => {

            it('Sets the TokenID manually', async () => {
                await token.setTokenId(43114)
                await expect(await token.currentTokenId()).to.eq(43114);
            })

            it('Sets the TokenID forbidden for non-owners', async () => {
                expect(axelAsSigner.setTokenId(12345))
                    .to.be.revertedWith('Ownable: caller is not the owner');
                
            })

            it('Sets the TokenID with minting accordingly', async () => {
                const sig = await createSignature(axel.address, 98, hash, backend);
                await axelAsSigner.mintWithSignature(98, hash, sig)
                await expect(await token.currentTokenId()).to.eq(98);
            })

            it('Wont lower the TokenID when minting with later tokenId later', async () => {
                let sig = await createSignature(axel.address, 98, hash, backend);
                await axelAsSigner.mintWithSignature(98, hash, sig)
                await expect(await token.currentTokenId()).to.eq(98);

                sig = await createSignature(axel.address, 45, hash, backend);
                await axelAsSigner.mintWithSignature(45, hash, sig)
                
                // will be still 98
                await expect(await token.currentTokenId()).to.eq(98);
            })

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
