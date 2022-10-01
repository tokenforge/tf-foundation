import {ethers} from 'hardhat';
import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';

import {SignerWithAddress} from '@nomiclabs/hardhat-ethers/signers';

import {BigNumber, BigNumberish, Signer} from "ethers";
import {TokenForge1155v2, TokenForge1155v2__factory} from "../../typechain";


chai.use(chaiAsPromised);
const {expect} = chai;

describe('TokenForge1155v2 BasicTests', () => {
    let token: TokenForge1155v2,
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

        const tokenFactory = (await ethers.getContractFactory('TokenForge1155v2', governance)) as TokenForge1155v2__factory;

        token = await tokenFactory.deploy(backend.address, 'ipfs://');
        await token.deployed();

        expect(token.address).to.properAddress;
    });

    describe('we can mint tokens', async () => {
        const
            tokenId = 1001,
            amount = 1,
            hash = 'NgcFOAfYXwVrmQrUOyB0U5kWU4w1a8Gf2gPPTPBrGTqTl-6qe7ERStbEMamFV4niv1bhFKI5167vzMLApLOEBs0ArvvUiClrRAFb=w600';

        let sigForAxel: string,
            axelAsMinter: TokenForge1155v2,
            chantalAsMinter: TokenForge1155v2;

        beforeEach(async () => {
            sigForAxel = await createSignature(axel.address, tokenId, amount, hash, backend);
            axelAsMinter = token.connect(axel);
            chantalAsMinter = token.connect(chantal);

            await token.grantRole(await token.MINTER_ROLE(), axel.address);
        })
        
        const checkTokenBalanceForAxel = async(totalSupplyBefore: BigNumber) => {
            const balance = await token.balanceOf(axel.address, tokenId);
            expect(balance).to.eq(1);

            const totalSupply = await token.totalSupply(tokenId);
            expect(totalSupply).to.eq(totalSupplyBefore.add(amount));

            const uri = await token.uri(tokenId);
            expect(uri).to.eq(hash);
        }

        it('should mint tokens to Axel successfully', async () => {
            const totalSupplyBefore = await token.totalSupply(tokenId);

            const balanceBefore = await token.balanceOf(axel.address, tokenId);
            expect(balanceBefore).to.eq(0);

            await axelAsMinter.mint(tokenId, amount, hash);

            await checkTokenBalanceForAxel(totalSupplyBefore);
        });

        it('should mint tokens to Axel successfully with signature', async () => {
            const totalSupplyBefore = await token.totalSupply(tokenId);

            const balanceBefore = await token.balanceOf(axel.address, tokenId);
            expect(balanceBefore).to.eq(0);

            await axelAsMinter.mintWithSignature(tokenId, amount, hash, sigForAxel);

            await checkTokenBalanceForAxel(totalSupplyBefore);
        });

    })

    describe('testing some governance stuff', async () => {
        let axelAsMinter: TokenForge1155v2;

        beforeEach(async () => {
            axelAsMinter = token.connect(axel);
        })

        it('will revert if non-owners will change signer account', async() => {
            const benAsSigner = token.connect(ben)
            await expect(benAsSigner.setSigner(axel.address)).to.be.revertedWith('TokenForge1155v2: caller is not the owner nor admin')
        })

        it('governance can change signer account', async() => {
            await expect(token.setSigner(axel.address))
                .to.emit(token, 'SignerChanged')
                .withArgs(backend.address, axel.address);
        })

        it('Withdrawal as non-owner will be reverted', async () => {
            await expect(axelAsMinter.withdraw()).to.be.revertedWith('TokenForge1155v2: caller is not the owner')
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
