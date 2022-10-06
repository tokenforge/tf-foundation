import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";

describe("TokenForgeERC20Capped", function () {

  async function deployTokenFixture() {
    // Contracts are deployed using the first signer/account by default
    const [owner, axel, ben, chantal] = await ethers.getSigners();

    const tokenFactory = await ethers.getContractFactory("TokenForge20Capped");
    const token = await tokenFactory.deploy('TokenForge', 'TF', 50);

    return { token, owner, axel, ben, chantal };
  }

  describe("Deployment ERC20", function () {
    it("Should set the right owner", async function () {
      const {token, owner} = await loadFixture(deployTokenFixture);

      expect(await token.owner()).to.equal(owner.address);
    });

    it("Should set the right hardcap", async function () {
      const {token, owner} = await loadFixture(deployTokenFixture);

      expect(await token.cap()).to.equal(50);
    });

  })

  describe("Ownership", function () {
    it("Should transfer Ownership successfully", async function () {
      const {token, owner, axel} = await loadFixture(deployTokenFixture);

      expect(await token.owner()).to.equal(owner.address);
      await token.transferOwnership(axel.address);
      expect(await token.owner()).to.equal(axel.address);
    });
  })

  describe("Minting", function () {
    it("Should be able to mint tokens as Owner", async function () {
      const { token, owner, ben, chantal } = await loadFixture(deployTokenFixture);

      const minter = token.connect(owner); // (should already be owner)
      await minter.mint(ben.address, 23)
      await minter.mint(chantal.address, 6)

      expect(await token.balanceOf(ben.address)).to.equal(23);
      expect(await token.balanceOf(chantal.address)).to.equal(6);
    });

    it("Should fail if non-owner will try to mint tokens", async function () {
      const { token, owner, ben, chantal } = await loadFixture(deployTokenFixture);

      const benAsMinter = token.connect(ben);
      await expect(benAsMinter.mint(ben.address, 10)).to.be.revertedWith(
        "Ownable: caller is not the owner"
      );
    });

    it("New owner should be able to mint tokens", async function () {
      const { token, owner, ben, chantal } = await loadFixture(deployTokenFixture);

      // transfer ownership to chantal
      await token.transferOwnership(chantal.address);

      // chantal becomes minter
      const minter = token.connect(chantal);
      // ... and mints tokens to ben
      await expect(minter.mint(ben.address, 12))
          .to.emit(token, 'Transfer');

      const oldOwnerAsMinter = token.connect(owner)
      // original owner is not allowed to do so anymore
      await expect(oldOwnerAsMinter.mint(ben.address, 14)).to.be.revertedWith(
          "Ownable: caller is not the owner"
      );
    });

    it("Should not be able to mint more tokens than hard cap", async function () {
      const { token, ben } = await loadFixture(deployTokenFixture);

      await expect(token.mint(ben.address, 51)).to.be.revertedWith(
          "ERC20Capped: cap exceeded"
      );
    });

    it("Should not be able to mint more tokens than hard cap II", async function () {
      const { token, axel } = await loadFixture(deployTokenFixture);

      await token.mint(axel.address, await token.cap());

      // once more ... ?
      await expect(token.mint(axel.address, 1)).to.be.revertedWith(
          "ERC20Capped: cap exceeded"
      );
    });

  });

  describe("Events", function () {
    it("Should emit Transfer-Events", async function () {
      const { token, ben } = await loadFixture(deployTokenFixture);

      await expect(token.mint(ben.address, 12))
          .to.emit(token, "Transfer")
          .withArgs(ethers.constants.AddressZero, ben.address, 12);
    });

    it("Should emit OwnershipTransferred-Events", async function () {
      const { token, owner, chantal } = await loadFixture(deployTokenFixture);

      await expect(token.transferOwnership(chantal.address))
          .to.emit(token, "OwnershipTransferred")
          .withArgs(owner.address, chantal.address);
    });
  });
});
