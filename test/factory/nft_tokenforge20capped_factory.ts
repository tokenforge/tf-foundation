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

import {
    TokenForge20Capped__factory,
    TokenForge20CappedFactory,
    TokenForge20CappedFactory__factory,
} from "../../typechain";
import {ContractReceipt, ContractTransaction} from "@ethersproject/contracts";
import {findEventArgsByNameFromReceipt} from "../lib/ethers-utils";
import {loadFixture} from "ethereum-waffle";


chai.use(chaiAsPromised);
const {expect} = chai;

describe('TokenForge20capped Factory tests', () => {
    let tokenFactory: TokenForge20CappedFactory,
        axel: SignerWithAddress,
        ben: SignerWithAddress,
        chantal: SignerWithAddress,
        governance: SignerWithAddress,
        backend: SignerWithAddress,
        tokenFactoryAsChantal: TokenForge20CappedFactory
    ;

    beforeEach(async () => {
        [axel, ben, chantal, governance, backend] = await ethers.getSigners();

        const tokenFactoryFactory = (await ethers.getContractFactory('TokenForge20CappedFactory', governance)) as TokenForge20CappedFactory__factory;

        tokenFactory = await tokenFactoryFactory.deploy();
        await tokenFactory.deployed();

        expect(tokenFactory.address).to.properAddress;

        tokenFactoryAsChantal = await tokenFactory.connect(chantal);
    });

    describe('we can deploy token contracts using factory', async () => {


        it('should deploy new token contract', async () => {
            
            const factoryTransaction: ContractTransaction = await tokenFactoryAsChantal.createTokenForge20Capped('TokenForge', 'TF20', 50, true);
            const receipt: ContractReceipt = await factoryTransaction.wait();
            const tokenAddress = findEventArgsByNameFromReceipt(receipt, 'ContractDeployed', 'contractAddress');

            expect(tokenAddress).to.be.properAddress;

            const contractFactory = (await ethers.getContractFactory('TokenForge20Capped')) as TokenForge20Capped__factory;
            const token = contractFactory.attach(tokenAddress);

            expect(token.address).to.properAddress;
        });
    })
    
    describe('working with factories', async () => {
        async function deployTokenForge20() {
            const tokenTransaction: ContractTransaction = await tokenFactoryAsChantal.createTokenForge20Capped('TokenForge', 'TF20', 50, true);

            const receipt: ContractReceipt = await tokenTransaction.wait();

            const contractAddress = findEventArgsByNameFromReceipt(receipt, 'ContractDeployed', 'contractAddress');

            expect(contractAddress).to.be.properAddress;

            const contractFactory = (await ethers.getContractFactory('TokenForge20Capped')) as TokenForge20Capped__factory;
            const token = contractFactory.attach(contractAddress);
            
            return {token};
        }

        it('has the proper permissions in deployed contract', async () => {
            const {token} = await loadFixture(deployTokenForge20);
            
            await expect(await token.owner()).to.eq(chantal.address);
        })

        it('chantal can assign new minter', async () => {
            const {token} = await loadFixture(deployTokenForge20);

            const tokenAsChantal = token.connect(chantal);
            await expect(tokenAsChantal.mint(ben.address, 10)).to.emit(token, 'Transfer');
        })

    })
    
});

