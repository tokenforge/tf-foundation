import {ethers} from 'hardhat';
import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';

import {SignerWithAddress} from '@nomiclabs/hardhat-ethers/signers';

import {BigNumber, BigNumberish, Signer} from "ethers";
import {
    TokenForge1155v3,
    TokenForge1155v3__factory,
    TokenForge1155v3Factory,
    TokenForge1155v3Factory__factory, TokenForge721__factory, TokenForge721Factory, TokenForge721Factory__factory
} from "../../typechain";
import {ContractReceipt, ContractTransaction} from "@ethersproject/contracts";
import {findEventArgsByNameFromReceipt} from "../lib/ethers-utils";
import {loadFixture} from "ethereum-waffle";


chai.use(chaiAsPromised);
const {expect} = chai;

describe('TokenForge721v2 Factory tests', () => {
    let tokenFactory: TokenForge721Factory,
        axel: SignerWithAddress,
        ben: SignerWithAddress,
        chantal: SignerWithAddress,
        governance: SignerWithAddress,
        backend: SignerWithAddress,
        tokenFactoryAsChantal: TokenForge721Factory
    ;

    beforeEach(async () => {
        [axel, ben, chantal, governance, backend] = await ethers.getSigners();

        const tokenFactoryFactory = (await ethers.getContractFactory('TokenForge721Factory', governance)) as TokenForge721Factory__factory;

        tokenFactory = await tokenFactoryFactory.deploy();
        await tokenFactory.deployed();

        expect(tokenFactory.address).to.properAddress;

        tokenFactoryAsChantal = await tokenFactory.connect(chantal);
    });

    describe('we can deploy token contracts using factory', async () => {


        it('should deploy new token contract', async () => {
            
            const factoryTransaction: ContractTransaction = await tokenFactoryAsChantal.createTokenForge721('test', 'nft', axel.address, 'https://uri', true);
            const receipt: ContractReceipt = await factoryTransaction.wait();
            const tokenAddress = findEventArgsByNameFromReceipt(receipt, 'ContractDeployed', 'contractAddress');

            expect(tokenAddress).to.be.properAddress;

            const contractFactory = (await ethers.getContractFactory('TokenForge721')) as TokenForge721__factory;
            const token = contractFactory.attach(tokenAddress);

            expect(token.address).to.properAddress;
        });
    })
    
    describe('working with factories', async () => {
        async function deployTokenForge712v2() {
            const signer = ben;
            const tokenTransaction: ContractTransaction = await tokenFactoryAsChantal.createTokenForge721('token', 'nft', signer.address, 'tokenforge://', true );

            const receipt: ContractReceipt = await tokenTransaction.wait();

            const contractAddress = findEventArgsByNameFromReceipt(receipt, 'ContractDeployed', 'contractAddress');

            expect(contractAddress).to.be.properAddress;

            const contractFactory = (await ethers.getContractFactory('TokenForge721')) as TokenForge721__factory;
            const tf721 = contractFactory.attach(contractAddress);

            return {tf721, signer};
        }

        it('has the proper permissions in deployed contract', async () => {
            const {tf721, signer} = await loadFixture(deployTokenForge712v2);
            
            const defaultAdminRole = await tf721.DEFAULT_ADMIN_ROLE();
            const adminRole = await tf721.DEFAULT_ADMIN_ROLE();
            const minterRole = await tf721.MINTER_ROLE();
            
            await expect(await tf721.hasRole(defaultAdminRole, chantal.address)).to.be.true;
            await expect(await tf721.hasRole(adminRole, chantal.address)).to.be.true;
            await expect(await tf721.hasRole(minterRole, chantal.address)).to.be.true;

            await expect(await tf721.owner()).to.eq(chantal.address);
        })

        it('chantal can assign new minter', async () => {
            const {tf721, signer} = await loadFixture(deployTokenForge712v2);

            const minterRole = await tf721.MINTER_ROLE();

            const tokenAsChantal = tf721.connect(chantal);
            await expect(
                tokenAsChantal.grantRole(minterRole, axel.address))
                .to.emit(tf721, 'RoleGranted')
                .withArgs(minterRole, axel.address, chantal.address)
        })

    })
    
});

