import {ethers, upgrades} from 'hardhat';
import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';

import {SignerWithAddress} from '@nomiclabs/hardhat-ethers/signers';

import {BigNumber, BigNumberish, Signer} from "ethers";
import {
    TokenForge721,
    TokenForge721__factory,
    TokenForge721Upgradeable,
    TokenForge721Upgradeable__factory
} from "../../typechain";


chai.use(chaiAsPromised);
const {expect} = chai;

const VALUES_SPV_NAME = 'Unlimited Financial Services';

describe('TokenForge721 Upgradeable BasicTests', () => {
    let token: TokenForge721Upgradeable,
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

        const message = await token["createMessage(address,uint256,string)"](to, tokenId, hash);
        return await signerAccount.signMessage(ethers.utils.arrayify(message));
    };

    const createSignature2 = async (
        to: string,
        hash: string,
        signerAccount: Signer = backend,
    ) => {

        const message = await token["createMessage(address,string)"](to, hash);
        return await signerAccount.signMessage(ethers.utils.arrayify(message));
    };

    beforeEach(async () => {
        [axel, ben, chantal, governance, backend] = await ethers.getSigners();

        const tokenFactory = (await ethers.getContractFactory('TokenForge721Upgradeable', governance)) as TokenForge721Upgradeable__factory;

        token = await upgrades.deployProxy(tokenFactory, ['name', 'symbol', backend.address, 'ipfs://']) as TokenForge721Upgradeable;
        await token.deployed();

        expect(token.address).to.properAddress;
    });

    // 4
    describe('we can mint tokens', async () => {
        const 
            tokenId = 1001,
            hash = 'NgcFOAfYXwVrmQrUOyB0U5kWU4w1a8Gf2gPPTPBrGTqTl-6qe7ERStbEMamFV4niv1bhFKI5167vzMLApLOEBs0ArvvUiClrRAFb=w600';

        let sigForAxel: string,
            axelAsMinter: TokenForge721Upgradeable,
            chantalAsMinter: TokenForge721Upgradeable;

        beforeEach(async () => {
            sigForAxel = await createSignature(axel.address, tokenId, hash, backend);
            axelAsMinter = token.connect(axel);
            chantalAsMinter = token.connect(chantal);
        })

        it('should mint tokens to Axel successfully', async () => {
            const totalSupplyBefore = await token.totalSupply();

            const balanceBefore = await token.balanceOf(axel.address);
            expect(balanceBefore).to.eq(0);

            await axelAsMinter.mintWithSignature(tokenId, hash, sigForAxel);

            const balance = await token.balanceOf(axel.address);
            expect(balance).to.eq(1);

            const totalSupply = await token.totalSupply();
            expect(totalSupply).to.eq(totalSupplyBefore.add(1));

            const uri = await token.tokenURI(tokenId);
            expect(uri).to.eq('ipfs://' + hash);
        });

        it('should auto mint tokens to Axel successfully', async () => {
            const totalSupplyBefore = await token.totalSupply();

            const balanceBefore = await token.balanceOf(axel.address);
            expect(balanceBefore).to.eq(0);

            const sig = await createSignature2(axel.address, hash, backend);

            // this will revert without reason
            await expect(axelAsMinter.mintAutoWithSignature(hash, sig)).to.emit(axelAsMinter, 'Transfer')

            const balance = await token.balanceOf(axel.address);
            expect(balance).to.eq(1);

            const totalSupply = await token.totalSupply();
            expect(totalSupply).to.eq(totalSupplyBefore.add(1));

            const tokenId = await token.currentTokenId();
            const uri = await token.tokenURI(tokenId);
            expect(uri).to.eq('ipfs://' + hash);
        });
        
        it('will revert if non-owners will change signer account', async() => {
            const benAsSigner = token.connect(ben)
            await expect(benAsSigner.setSigner(axel.address)).to.be.revertedWith('Ownable: caller is not the owner')
        })

        it('governance can change signer account', async() => {
            await expect(token.setSigner(axel.address))
                .to.emit(token, 'SignerChanged')
                .withArgs(backend.address, axel.address);
        })

        it('Withdrawal as non-owner will be reverted', async () => {
            await expect(axelAsMinter.withdraw()).to.be.revertedWith('Ownable: caller is not the owner')
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
