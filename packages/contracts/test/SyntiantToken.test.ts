import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { SyntiantToken } from "../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

describe("SyntiantToken", function () {
  // Constants matching the contract
  const TOKEN_NAME = "Syntiant Atlas Token";
  const TOKEN_SYMBOL = "SAT";
  const DECIMALS = 18;
  const MAX_SUPPLY = ethers.parseEther("1000000000"); // 1 billion
  const INITIAL_SUPPLY = ethers.parseEther("100000000"); // 100 million

  async function deployTokenFixture() {
    const [owner, alice, bob] = await ethers.getSigners();

    const SyntiantTokenFactory = await ethers.getContractFactory("SyntiantToken");
    const token = await SyntiantTokenFactory.deploy(owner.address);

    return { token, owner, alice, bob };
  }

  // ---------------------------------------------------------------------------
  //  1. Deployment
  // ---------------------------------------------------------------------------
  describe("Deployment", function () {
    it("Should set the correct token name", async function () {
      const { token } = await loadFixture(deployTokenFixture);
      expect(await token.name()).to.equal(TOKEN_NAME);
    });

    it("Should set the correct token symbol", async function () {
      const { token } = await loadFixture(deployTokenFixture);
      expect(await token.symbol()).to.equal(TOKEN_SYMBOL);
    });

    it("Should have 18 decimals", async function () {
      const { token } = await loadFixture(deployTokenFixture);
      expect(await token.decimals()).to.equal(DECIMALS);
    });

    it("Should mint INITIAL_SUPPLY to the initial owner", async function () {
      const { token, owner } = await loadFixture(deployTokenFixture);
      expect(await token.balanceOf(owner.address)).to.equal(INITIAL_SUPPLY);
    });

    it("Should set totalSupply to INITIAL_SUPPLY", async function () {
      const { token } = await loadFixture(deployTokenFixture);
      expect(await token.totalSupply()).to.equal(INITIAL_SUPPLY);
    });

    it("Should assign the correct owner", async function () {
      const { token, owner } = await loadFixture(deployTokenFixture);
      expect(await token.owner()).to.equal(owner.address);
    });

    it("Should expose MAX_SUPPLY constant", async function () {
      const { token } = await loadFixture(deployTokenFixture);
      expect(await token.MAX_SUPPLY()).to.equal(MAX_SUPPLY);
    });

    it("Should expose INITIAL_SUPPLY constant", async function () {
      const { token } = await loadFixture(deployTokenFixture);
      expect(await token.INITIAL_SUPPLY()).to.equal(INITIAL_SUPPLY);
    });

    it("Should not be paused initially", async function () {
      const { token } = await loadFixture(deployTokenFixture);
      expect(await token.paused()).to.equal(false);
    });
  });

  // ---------------------------------------------------------------------------
  //  2. Minting
  // ---------------------------------------------------------------------------
  describe("Minting", function () {
    it("Should allow the owner to mint tokens", async function () {
      const { token, owner, alice } = await loadFixture(deployTokenFixture);
      const mintAmount = ethers.parseEther("500");

      await token.connect(owner).mint(alice.address, mintAmount);

      expect(await token.balanceOf(alice.address)).to.equal(mintAmount);
      expect(await token.totalSupply()).to.equal(INITIAL_SUPPLY + mintAmount);
    });

    it("Should revert when a non-owner tries to mint", async function () {
      const { token, alice, bob } = await loadFixture(deployTokenFixture);
      const mintAmount = ethers.parseEther("100");

      // OZ v5 Ownable uses custom error: OwnableUnauthorizedAccount(address)
      await expect(
        token.connect(alice).mint(bob.address, mintAmount)
      ).to.be.revertedWithCustomError(token, "OwnableUnauthorizedAccount")
        .withArgs(alice.address);
    });

    it("Should allow minting up to exactly MAX_SUPPLY", async function () {
      const { token, owner, alice } = await loadFixture(deployTokenFixture);
      const remaining = MAX_SUPPLY - INITIAL_SUPPLY;

      await token.connect(owner).mint(alice.address, remaining);

      expect(await token.totalSupply()).to.equal(MAX_SUPPLY);
    });

    it("Should revert when minting would exceed MAX_SUPPLY", async function () {
      const { token, owner, alice } = await loadFixture(deployTokenFixture);
      const remaining = MAX_SUPPLY - INITIAL_SUPPLY;
      const tooMuch = remaining + 1n;

      await expect(
        token.connect(owner).mint(alice.address, tooMuch)
      ).to.be.revertedWith("SyntiantToken: cap exceeded");
    });

    it("Should revert when minting any amount after MAX_SUPPLY is reached", async function () {
      const { token, owner, alice } = await loadFixture(deployTokenFixture);
      const remaining = MAX_SUPPLY - INITIAL_SUPPLY;

      // Mint up to cap
      await token.connect(owner).mint(alice.address, remaining);
      expect(await token.totalSupply()).to.equal(MAX_SUPPLY);

      // Even minting 1 wei more should fail
      await expect(
        token.connect(owner).mint(alice.address, 1n)
      ).to.be.revertedWith("SyntiantToken: cap exceeded");
    });

    it("Should allow minting zero tokens without error", async function () {
      const { token, owner, alice } = await loadFixture(deployTokenFixture);

      await expect(token.connect(owner).mint(alice.address, 0n)).to.not.be.reverted;
      expect(await token.totalSupply()).to.equal(INITIAL_SUPPLY);
    });
  });

  // ---------------------------------------------------------------------------
  //  3. Pausing
  // ---------------------------------------------------------------------------
  describe("Pausing", function () {
    it("Should allow the owner to pause", async function () {
      const { token, owner } = await loadFixture(deployTokenFixture);

      await token.connect(owner).pause();

      expect(await token.paused()).to.equal(true);
    });

    it("Should allow the owner to unpause", async function () {
      const { token, owner } = await loadFixture(deployTokenFixture);

      await token.connect(owner).pause();
      expect(await token.paused()).to.equal(true);

      await token.connect(owner).unpause();
      expect(await token.paused()).to.equal(false);
    });

    it("Should revert when a non-owner tries to pause", async function () {
      const { token, alice } = await loadFixture(deployTokenFixture);

      await expect(
        token.connect(alice).pause()
      ).to.be.revertedWithCustomError(token, "OwnableUnauthorizedAccount")
        .withArgs(alice.address);
    });

    it("Should revert when a non-owner tries to unpause", async function () {
      const { token, owner, alice } = await loadFixture(deployTokenFixture);

      await token.connect(owner).pause();

      await expect(
        token.connect(alice).unpause()
      ).to.be.revertedWithCustomError(token, "OwnableUnauthorizedAccount")
        .withArgs(alice.address);
    });

    it("Should block transfers when paused", async function () {
      const { token, owner, alice } = await loadFixture(deployTokenFixture);
      const transferAmount = ethers.parseEther("100");

      // Transfer some tokens to alice first
      await token.connect(owner).transfer(alice.address, transferAmount);

      // Pause
      await token.connect(owner).pause();

      // OZ v5 Pausable uses custom error: EnforcedPause()
      await expect(
        token.connect(alice).transfer(owner.address, transferAmount)
      ).to.be.revertedWithCustomError(token, "EnforcedPause");
    });

    it("Should block minting when paused", async function () {
      const { token, owner, alice } = await loadFixture(deployTokenFixture);
      const mintAmount = ethers.parseEther("1000");

      await token.connect(owner).pause();

      await expect(
        token.connect(owner).mint(alice.address, mintAmount)
      ).to.be.revertedWithCustomError(token, "EnforcedPause");
    });

    it("Should block burning when paused", async function () {
      const { token, owner } = await loadFixture(deployTokenFixture);
      const burnAmount = ethers.parseEther("50");

      await token.connect(owner).pause();

      await expect(
        token.connect(owner).burn(burnAmount)
      ).to.be.revertedWithCustomError(token, "EnforcedPause");
    });

    it("Should resume transfers after unpausing", async function () {
      const { token, owner, alice } = await loadFixture(deployTokenFixture);
      const transferAmount = ethers.parseEther("100");

      // Pause then unpause
      await token.connect(owner).pause();
      await token.connect(owner).unpause();

      // Transfer should work again
      await expect(
        token.connect(owner).transfer(alice.address, transferAmount)
      ).to.not.be.reverted;

      expect(await token.balanceOf(alice.address)).to.equal(transferAmount);
    });

    it("Should resume minting after unpausing", async function () {
      const { token, owner, alice } = await loadFixture(deployTokenFixture);
      const mintAmount = ethers.parseEther("5000");

      await token.connect(owner).pause();
      await token.connect(owner).unpause();

      await expect(
        token.connect(owner).mint(alice.address, mintAmount)
      ).to.not.be.reverted;

      expect(await token.balanceOf(alice.address)).to.equal(mintAmount);
    });
  });

  // ---------------------------------------------------------------------------
  //  4. Burning
  // ---------------------------------------------------------------------------
  describe("Burning", function () {
    it("Should allow a holder to burn their own tokens", async function () {
      const { token, owner } = await loadFixture(deployTokenFixture);
      const burnAmount = ethers.parseEther("1000");

      await token.connect(owner).burn(burnAmount);

      expect(await token.balanceOf(owner.address)).to.equal(INITIAL_SUPPLY - burnAmount);
      expect(await token.totalSupply()).to.equal(INITIAL_SUPPLY - burnAmount);
    });

    it("Should revert when burning more than the holder's balance", async function () {
      const { token, alice } = await loadFixture(deployTokenFixture);

      // alice has 0 tokens
      await expect(
        token.connect(alice).burn(1n)
      ).to.be.revertedWithCustomError(token, "ERC20InsufficientBalance");
    });

    it("Should allow burnFrom when allowance is granted", async function () {
      const { token, owner, alice } = await loadFixture(deployTokenFixture);
      const burnAmount = ethers.parseEther("500");

      // Owner approves alice to spend tokens
      await token.connect(owner).approve(alice.address, burnAmount);

      // Alice burns from owner's balance
      await token.connect(alice).burnFrom(owner.address, burnAmount);

      expect(await token.balanceOf(owner.address)).to.equal(INITIAL_SUPPLY - burnAmount);
      expect(await token.totalSupply()).to.equal(INITIAL_SUPPLY - burnAmount);
    });

    it("Should revert burnFrom without sufficient allowance", async function () {
      const { token, owner, alice } = await loadFixture(deployTokenFixture);
      const burnAmount = ethers.parseEther("500");

      // No approval given
      await expect(
        token.connect(alice).burnFrom(owner.address, burnAmount)
      ).to.be.revertedWithCustomError(token, "ERC20InsufficientAllowance");
    });

    it("Should reduce totalSupply correctly after burning", async function () {
      const { token, owner } = await loadFixture(deployTokenFixture);
      const burnAmount = ethers.parseEther("10000000"); // 10 million

      await token.connect(owner).burn(burnAmount);

      expect(await token.totalSupply()).to.equal(INITIAL_SUPPLY - burnAmount);
    });
  });

  // ---------------------------------------------------------------------------
  //  5. Transfers
  // ---------------------------------------------------------------------------
  describe("Transfers", function () {
    it("Should transfer tokens between accounts", async function () {
      const { token, owner, alice } = await loadFixture(deployTokenFixture);
      const transferAmount = ethers.parseEther("1000");

      await token.connect(owner).transfer(alice.address, transferAmount);

      expect(await token.balanceOf(alice.address)).to.equal(transferAmount);
      expect(await token.balanceOf(owner.address)).to.equal(INITIAL_SUPPLY - transferAmount);
    });

    it("Should allow chained transfers between multiple accounts", async function () {
      const { token, owner, alice, bob } = await loadFixture(deployTokenFixture);
      const amount = ethers.parseEther("500");

      // owner -> alice
      await token.connect(owner).transfer(alice.address, amount);
      // alice -> bob
      await token.connect(alice).transfer(bob.address, amount);

      expect(await token.balanceOf(owner.address)).to.equal(INITIAL_SUPPLY - amount);
      expect(await token.balanceOf(alice.address)).to.equal(0n);
      expect(await token.balanceOf(bob.address)).to.equal(amount);
    });

    it("Should revert transfer when sender has insufficient balance", async function () {
      const { token, alice, bob } = await loadFixture(deployTokenFixture);

      // alice has 0 tokens
      await expect(
        token.connect(alice).transfer(bob.address, 1n)
      ).to.be.revertedWithCustomError(token, "ERC20InsufficientBalance");
    });

    it("Should fail transfers when paused", async function () {
      const { token, owner, alice } = await loadFixture(deployTokenFixture);
      const transferAmount = ethers.parseEther("100");

      await token.connect(owner).pause();

      await expect(
        token.connect(owner).transfer(alice.address, transferAmount)
      ).to.be.revertedWithCustomError(token, "EnforcedPause");
    });

    it("Should work via transferFrom with approval", async function () {
      const { token, owner, alice, bob } = await loadFixture(deployTokenFixture);
      const approveAmount = ethers.parseEther("2000");
      const transferAmount = ethers.parseEther("1000");

      // Owner approves alice
      await token.connect(owner).approve(alice.address, approveAmount);

      // Alice transfers from owner to bob
      await token.connect(alice).transferFrom(owner.address, bob.address, transferAmount);

      expect(await token.balanceOf(bob.address)).to.equal(transferAmount);
      expect(await token.balanceOf(owner.address)).to.equal(INITIAL_SUPPLY - transferAmount);
      expect(await token.allowance(owner.address, alice.address)).to.equal(
        approveAmount - transferAmount
      );
    });

    it("Should revert transferFrom without sufficient allowance", async function () {
      const { token, owner, alice, bob } = await loadFixture(deployTokenFixture);

      await expect(
        token.connect(alice).transferFrom(owner.address, bob.address, 1n)
      ).to.be.revertedWithCustomError(token, "ERC20InsufficientAllowance");
    });

    it("Should block transferFrom when paused", async function () {
      const { token, owner, alice, bob } = await loadFixture(deployTokenFixture);
      const amount = ethers.parseEther("100");

      await token.connect(owner).approve(alice.address, amount);
      await token.connect(owner).pause();

      await expect(
        token.connect(alice).transferFrom(owner.address, bob.address, amount)
      ).to.be.revertedWithCustomError(token, "EnforcedPause");
    });

    it("Should emit Transfer event on successful transfer", async function () {
      const { token, owner, alice } = await loadFixture(deployTokenFixture);
      const amount = ethers.parseEther("100");

      await expect(token.connect(owner).transfer(alice.address, amount))
        .to.emit(token, "Transfer")
        .withArgs(owner.address, alice.address, amount);
    });
  });

  // ---------------------------------------------------------------------------
  //  6. ERC20Permit (nonces)
  // ---------------------------------------------------------------------------
  describe("ERC20Permit / Nonces", function () {
    it("Should return nonce 0 for a fresh address", async function () {
      const { token, alice } = await loadFixture(deployTokenFixture);
      expect(await token.nonces(alice.address)).to.equal(0n);
    });
  });
});
