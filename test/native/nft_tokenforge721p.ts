import {ethers} from 'hardhat';
import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';

import {SignerWithAddress} from '@nomiclabs/hardhat-ethers/signers';

import {BigNumber, BigNumberish, Signer} from "ethers";
import {TokenForge721p, TokenForge721p__factory} from "../../typechain";


chai.use(chaiAsPromised);
const {expect} = chai;

const VALUES_SPV_NAME = 'Unlimited Financial Services';

describe('TokenForge721p BasicTests', () => {
    let token: TokenForge721p,
        axel: SignerWithAddress,
        ben: SignerWithAddress,
        chantal: SignerWithAddress,
        governance: SignerWithAddress,
        backend: SignerWithAddress
    ;

    const createSignature = async (
        tokenId: BigNumberish,
        price: BigNumberish,
        hash: string,
        signerAccount: Signer = backend,
    ) => {

        const message = await token.createMessage(tokenId, price, hash);
        const signature = await signerAccount.signMessage(ethers.utils.arrayify(message));

        return signature;
    };


    beforeEach(async () => {
        [axel, ben, chantal, governance, backend] = await ethers.getSigners();

        const tokenFactory = (await ethers.getContractFactory('TokenForge721p', governance)) as TokenForge721p__factory;

        token = await tokenFactory.deploy(backend.address, 'ipfs://');
        await token.deployed();

        expect(token.address).to.properAddress;
    });

    // 4
    describe('we can mint tokens', async () => {
        const price = ether(1.2),
            underpaid = ether(1.199),
            overpaid = ether(1.201),
            price2 = ether(4),
            tokenId = 1001,
            hash = 'NgcFOAfYXwVrmQrUOyB0U5kWU4w1a8Gf2gPPTPBrGTqTl-6qe7ERStbEMamFV4niv1bhFKI5167vzMLApLOEBs0ArvvUiClrRAFb=w600';

        let sig: string,
            axelAsMinter: TokenForge721p,
            chantalAsMinter: TokenForge721p;

        beforeEach(async () => {
            sig = await createSignature(tokenId, price, hash, backend);
            axelAsMinter = token.connect(axel);
            chantalAsMinter = token.connect(chantal);
        })

        it('should mint tokens to Axel successfully after paying the correct price', async () => {
            const totalSupplyBefore = await token.totalSupply();

            const balanceBefore = await token.balanceOf(axel.address);
            expect(balanceBefore).to.eq(0);

            await axelAsMinter.mint(tokenId, price, hash, sig, {
                value: price
            });

            const balance = await token.balanceOf(axel.address);
            expect(balance).to.eq(1);

            const totalSupply = await token.totalSupply();
            expect(totalSupply).to.eq(totalSupplyBefore.add(1));

            const uri = await token.tokenURI(tokenId);
            expect(uri).to.eq('ipfs://' + hash);
        });

        it('will revert if paid price will not match (overpaid)', async () => {
            await expect(axelAsMinter.mint(tokenId, price, hash, sig, {
                value: overpaid
            })).to.be.revertedWith('Price did not match');
        })

        it('will revert if paid price will not match (underpaid)', async () => {
            await expect(axelAsMinter.mint(tokenId, price, hash, sig, {
                value: underpaid
            })).to.be.revertedWith('Price did not match');
        })

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

        it('will withdraw the correct amount of money', async () => {
            await axelAsMinter.mint(tokenId, price, hash, sig, {
                value: price
            });

            const sig2 = await createSignature(tokenId + 1, price2, hash, backend);
            await chantalAsMinter.mint(tokenId + 1, price2, hash, sig2, {
                value: price2
            });

            const total = price.add(price2);

            // Balance-total of Contract is > 0
            await expect(await ethers.provider.getBalance(token.address)).to.eq(total);

            // Check Balance before withdrawal
            const balanceOfGovernance = await ethers.provider.getBalance(governance.address);

            // Withdraw
            const withdrawer = token.connect(governance)
            const tx = await withdrawer.withdraw();

            // detect gas fees of withdrawal function
            const receipt = await tx.wait();

            const gasFees = receipt.gasUsed.mul(receipt.effectiveGasPrice)

            // Balance-total of Contract is 0
            await expect(await ethers.provider.getBalance(token.address)).to.eq(0);

            // Balance of Governance contains the total, reduced by gas fees
            await expect(await ethers.provider.getBalance(governance.address)).to.eq(balanceOfGovernance.add(total).sub(gasFees));
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
