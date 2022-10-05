import {ethers} from 'hardhat';
import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';

import {SignerWithAddress} from '@nomiclabs/hardhat-ethers/signers';

import {BigNumber, BigNumberish, Signer} from "ethers";
import {
    TokenForge1155v3,
    TokenForge1155v3__factory,
    TokenForge1155v3Factory,
    TokenForge1155v3Factory__factory
} from "../../typechain";
import {ContractReceipt, ContractTransaction} from "@ethersproject/contracts";
import {findEventArgsByNameFromReceipt} from "../lib/ethers-utils";
import {loadFixture} from "ethereum-waffle";


chai.use(chaiAsPromised);
const {expect} = chai;

describe('TokenForge1155v3 Factory tests', () => {
    let tokenFactory: TokenForge1155v3Factory,
        axel: SignerWithAddress,
        ben: SignerWithAddress,
        chantal: SignerWithAddress,
        governance: SignerWithAddress,
        backend: SignerWithAddress,
        tokenFactoryAsChantal: TokenForge1155v3Factory
    ;

    beforeEach(async () => {
        [axel, ben, chantal, governance, backend] = await ethers.getSigners();

        const tokenFactoryFactory = (await ethers.getContractFactory('TokenForge1155v3Factory', governance)) as TokenForge1155v3Factory__factory;

        tokenFactory = await tokenFactoryFactory.deploy();
        await tokenFactory.deployed();

        expect(tokenFactory.address).to.properAddress;

        tokenFactoryAsChantal = await tokenFactory.connect(chantal);
    });

    describe('we can deploy token contracts using factory', async () => {


        it('should deploy new token contract', async () => {
            
            const factoryTransaction: ContractTransaction = await tokenFactoryAsChantal.createTokenForge1155v3('nft', axel.address, 'https://uri', true);
            const receipt: ContractReceipt = await factoryTransaction.wait();
            const tokenAddress = findEventArgsByNameFromReceipt(receipt, 'ContractDeployed', 'contractAddress');

            expect(tokenAddress).to.be.properAddress;

            const contractFactory = (await ethers.getContractFactory('TokenForge1155v3')) as TokenForge1155v3__factory;
            const token = contractFactory.attach(tokenAddress);

            expect(token.address).to.properAddress;
        });
    })
    
    describe('working with factories', async () => {
        async function deployTokenForge1155v3() {
            const signer = ben;
            const tokenTransaction: ContractTransaction = await tokenFactoryAsChantal.createTokenForge1155v3('nft', signer.address, 'tokenforge://', true );

            const receipt: ContractReceipt = await tokenTransaction.wait();

            const contractAddress = findEventArgsByNameFromReceipt(receipt, 'ContractDeployed', 'contractAddress');

            expect(contractAddress).to.be.properAddress;

            const contractFactory = (await ethers.getContractFactory('TokenForge1155v3')) as TokenForge1155v3__factory;
            const tf1155 = contractFactory.attach(contractAddress);

            return {tf1155, signer};
        }

        it('has the proper permissions in deployed contract', async () => {
            const {tf1155, signer} = await loadFixture(deployTokenForge1155v3);
            
            const defaultAdminRole = await tf1155.DEFAULT_ADMIN_ROLE();
            const adminRole = await tf1155.ADMIN_ROLE();
            const minterRole = await tf1155.MINTER_ROLE();
            
            await expect(await tf1155.hasRole(defaultAdminRole, chantal.address)).to.be.true;
            await expect(await tf1155.hasRole(adminRole, chantal.address)).to.be.true;
            await expect(await tf1155.hasRole(minterRole, chantal.address)).to.be.true;

            await expect(await tf1155.owner()).to.eq(chantal.address);
        })

        it('chantal can assign new minter', async () => {
            const {tf1155, signer} = await loadFixture(deployTokenForge1155v3);

            const minterRole = await tf1155.MINTER_ROLE();

            const tokenAsChantal = tf1155.connect(chantal);
            await expect(
                tokenAsChantal.grantRole(minterRole, axel.address))
                .to.emit(tf1155, 'RoleGranted')
                .withArgs(minterRole, axel.address, chantal.address)
        })

    })
    
});

