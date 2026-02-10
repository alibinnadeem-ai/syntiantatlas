import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import {
  Marketplace,
  SyntiantToken,
  PropertyToken,
} from "../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

describe("Marketplace", function () {
  // ---------------------------------------------------------------------------
  //  Shared fixture
  // ---------------------------------------------------------------------------

  async function deployMarketplaceFixture() {
    const [deployer, seller, buyer, other] = await ethers.getSigners();

    // 1. Deploy SyntiantToken -- deployer receives 100 M SAT (18 decimals)
    const SyntiantTokenFactory = await ethers.getContractFactory("SyntiantToken");
    const sat = await SyntiantTokenFactory.deploy(deployer.address);
    await sat.waitForDeployment();

    // 2. Deploy a PropertyToken (0 decimals, totalShares = 1000)
    const PropertyTokenFactory = await ethers.getContractFactory("PropertyToken");
    const propToken = await PropertyTokenFactory.deploy(
      "Test Property #1",
      "TP1",
      1,       // propertyId
      1000,    // totalShares
      deployer.address
    );
    await propToken.waitForDeployment();

    // 3. Deploy Marketplace
    const MarketplaceFactory = await ethers.getContractFactory("Marketplace");
    const marketplace = await MarketplaceFactory.deploy(
      await sat.getAddress(),
      deployer.address
    );
    await marketplace.waitForDeployment();

    // 4. Mint 500 PropertyTokens to the seller
    await propToken.mint(seller.address, 500);

    // 5. Transfer 10 000 SAT to the buyer
    const buyerSATAmount = ethers.parseEther("10000");
    await sat.transfer(buyer.address, buyerSATAmount);

    // 6. Pre-approve: seller approves marketplace for PropertyTokens,
    //    buyer approves marketplace for a large SAT amount
    const marketplaceAddress = await marketplace.getAddress();
    await propToken.connect(seller).approve(marketplaceAddress, 1000);
    await sat.connect(buyer).approve(marketplaceAddress, buyerSATAmount);

    return { deployer, seller, buyer, other, sat, propToken, marketplace };
  }

  // ---------------------------------------------------------------------------
  //  1. Deployment
  // ---------------------------------------------------------------------------

  describe("Deployment", function () {
    it("should set the platform fee to 250 (2.5%)", async function () {
      const { marketplace } = await loadFixture(deployMarketplaceFixture);
      expect(await marketplace.platformFee()).to.equal(250);
    });

    it("should set the fee recipient to the owner", async function () {
      const { marketplace, deployer } = await loadFixture(deployMarketplaceFixture);
      expect(await marketplace.feeRecipient()).to.equal(deployer.address);
    });

    it("should store the correct SyntiantToken address", async function () {
      const { marketplace, sat } = await loadFixture(deployMarketplaceFixture);
      expect(await marketplace.syntiantToken()).to.equal(await sat.getAddress());
    });

    it("should set the deployer as owner", async function () {
      const { marketplace, deployer } = await loadFixture(deployMarketplaceFixture);
      expect(await marketplace.owner()).to.equal(deployer.address);
    });

    it("should revert when deployed with zero address for syntiantToken", async function () {
      const MarketplaceFactory = await ethers.getContractFactory("Marketplace");
      const [deployer] = await ethers.getSigners();
      await expect(
        MarketplaceFactory.deploy(ethers.ZeroAddress, deployer.address)
      ).to.be.revertedWithCustomError(MarketplaceFactory, "InvalidAddress");
    });

    it("should revert when deployed with zero address for owner", async function () {
      const { sat } = await loadFixture(deployMarketplaceFixture);
      const MarketplaceFactory = await ethers.getContractFactory("Marketplace");
      // OpenZeppelin's Ownable constructor reverts before our custom check
      await expect(
        MarketplaceFactory.deploy(await sat.getAddress(), ethers.ZeroAddress)
      ).to.be.revertedWithCustomError(MarketplaceFactory, "OwnableInvalidOwner");
    });

    it("should expose MAX_FEE = 1000 and FEE_DENOMINATOR = 10000", async function () {
      const { marketplace } = await loadFixture(deployMarketplaceFixture);
      expect(await marketplace.MAX_FEE()).to.equal(1000);
      expect(await marketplace.FEE_DENOMINATOR()).to.equal(10_000);
    });
  });

  // ---------------------------------------------------------------------------
  //  2. createListing
  // ---------------------------------------------------------------------------

  describe("createListing", function () {
    it("should create a listing and escrow tokens in the contract", async function () {
      const { marketplace, seller, propToken } = await loadFixture(deployMarketplaceFixture);

      const propTokenAddress = await propToken.getAddress();
      const pricePerToken = ethers.parseEther("10"); // 10 SAT each

      await marketplace.connect(seller).createListing(propTokenAddress, 100, pricePerToken);

      // Listing id 0 should exist
      const listing = await marketplace.getActiveListing(0);
      expect(listing.id).to.equal(0);
      expect(listing.seller).to.equal(seller.address);
      expect(listing.propertyToken).to.equal(propTokenAddress);
      expect(listing.amount).to.equal(100);
      expect(listing.pricePerToken).to.equal(pricePerToken);
      expect(listing.active).to.equal(true);

      // Tokens should now be held by the marketplace
      const marketplaceAddress = await marketplace.getAddress();
      expect(await propToken.balanceOf(marketplaceAddress)).to.equal(100);
      expect(await propToken.balanceOf(seller.address)).to.equal(400); // 500 - 100
    });

    it("should emit ListingCreated event with correct parameters", async function () {
      const { marketplace, seller, propToken } = await loadFixture(deployMarketplaceFixture);

      const propTokenAddress = await propToken.getAddress();
      const pricePerToken = ethers.parseEther("5");

      await expect(
        marketplace.connect(seller).createListing(propTokenAddress, 50, pricePerToken)
      )
        .to.emit(marketplace, "ListingCreated")
        .withArgs(0, seller.address, propTokenAddress, 50, pricePerToken);
    });

    it("should increment nextListingId for each new listing", async function () {
      const { marketplace, seller, propToken } = await loadFixture(deployMarketplaceFixture);
      const propTokenAddress = await propToken.getAddress();
      const price = ethers.parseEther("1");

      await marketplace.connect(seller).createListing(propTokenAddress, 10, price);
      await marketplace.connect(seller).createListing(propTokenAddress, 20, price);

      expect(await marketplace.nextListingId()).to.equal(2);

      const listing0 = await marketplace.getActiveListing(0);
      const listing1 = await marketplace.getActiveListing(1);
      expect(listing0.amount).to.equal(10);
      expect(listing1.amount).to.equal(20);
    });

    it("should track seller listings via getSellerListings", async function () {
      const { marketplace, seller, propToken } = await loadFixture(deployMarketplaceFixture);
      const propTokenAddress = await propToken.getAddress();
      const price = ethers.parseEther("1");

      await marketplace.connect(seller).createListing(propTokenAddress, 10, price);
      await marketplace.connect(seller).createListing(propTokenAddress, 20, price);

      const ids = await marketplace.getSellerListings(seller.address);
      expect(ids).to.deep.equal([0n, 1n]);
    });

    it("should revert when propertyToken is the zero address", async function () {
      const { marketplace, seller } = await loadFixture(deployMarketplaceFixture);
      await expect(
        marketplace.connect(seller).createListing(ethers.ZeroAddress, 100, ethers.parseEther("1"))
      ).to.be.revertedWithCustomError(marketplace, "InvalidAddress");
    });

    it("should revert when amount is 0", async function () {
      const { marketplace, seller, propToken } = await loadFixture(deployMarketplaceFixture);
      await expect(
        marketplace.connect(seller).createListing(await propToken.getAddress(), 0, ethers.parseEther("1"))
      ).to.be.revertedWithCustomError(marketplace, "InvalidAmount");
    });

    it("should revert when pricePerToken is 0", async function () {
      const { marketplace, seller, propToken } = await loadFixture(deployMarketplaceFixture);
      await expect(
        marketplace.connect(seller).createListing(await propToken.getAddress(), 100, 0)
      ).to.be.revertedWithCustomError(marketplace, "InvalidPrice");
    });
  });

  // ---------------------------------------------------------------------------
  //  3. cancelListing
  // ---------------------------------------------------------------------------

  describe("cancelListing", function () {
    it("should return escrowed tokens to the seller and deactivate the listing", async function () {
      const { marketplace, seller, propToken } = await loadFixture(deployMarketplaceFixture);
      const propTokenAddress = await propToken.getAddress();
      const marketplaceAddress = await marketplace.getAddress();

      await marketplace.connect(seller).createListing(propTokenAddress, 100, ethers.parseEther("10"));

      // Cancel
      await marketplace.connect(seller).cancelListing(0);

      // Listing should be inactive
      const listing = await marketplace.getActiveListing(0);
      expect(listing.active).to.equal(false);

      // Tokens returned to seller
      expect(await propToken.balanceOf(seller.address)).to.equal(500);
      expect(await propToken.balanceOf(marketplaceAddress)).to.equal(0);
    });

    it("should emit ListingCancelled event", async function () {
      const { marketplace, seller, propToken } = await loadFixture(deployMarketplaceFixture);
      const propTokenAddress = await propToken.getAddress();

      await marketplace.connect(seller).createListing(propTokenAddress, 100, ethers.parseEther("10"));

      await expect(marketplace.connect(seller).cancelListing(0))
        .to.emit(marketplace, "ListingCancelled")
        .withArgs(0, seller.address);
    });

    it("should revert if a non-seller tries to cancel", async function () {
      const { marketplace, seller, buyer, propToken } = await loadFixture(deployMarketplaceFixture);
      const propTokenAddress = await propToken.getAddress();

      await marketplace.connect(seller).createListing(propTokenAddress, 100, ethers.parseEther("10"));

      await expect(
        marketplace.connect(buyer).cancelListing(0)
      ).to.be.revertedWithCustomError(marketplace, "NotListingSeller");
    });

    it("should revert if the listing is already cancelled", async function () {
      const { marketplace, seller, propToken } = await loadFixture(deployMarketplaceFixture);
      const propTokenAddress = await propToken.getAddress();

      await marketplace.connect(seller).createListing(propTokenAddress, 100, ethers.parseEther("10"));
      await marketplace.connect(seller).cancelListing(0);

      await expect(
        marketplace.connect(seller).cancelListing(0)
      ).to.be.revertedWithCustomError(marketplace, "ListingNotActive");
    });

    it("should revert if the listing id does not exist (inactive by default)", async function () {
      const { marketplace, seller } = await loadFixture(deployMarketplaceFixture);

      await expect(
        marketplace.connect(seller).cancelListing(999)
      ).to.be.revertedWithCustomError(marketplace, "ListingNotActive");
    });
  });

  // ---------------------------------------------------------------------------
  //  4. buyListing
  // ---------------------------------------------------------------------------

  describe("buyListing", function () {
    const pricePerToken = ethers.parseEther("10"); // 10 SAT each

    async function listingFixture() {
      const base = await deployMarketplaceFixture();
      const { marketplace, seller, propToken } = base;
      const propTokenAddress = await propToken.getAddress();

      // Seller creates listing: 100 tokens at 10 SAT each
      await marketplace.connect(seller).createListing(propTokenAddress, 100, pricePerToken);

      return base;
    }

    it("should allow a full purchase of all listed tokens", async function () {
      const { marketplace, seller, buyer, sat, propToken, deployer } =
        await loadFixture(listingFixture);

      const sellerSATBefore = await sat.balanceOf(seller.address);
      const feeRecipientSATBefore = await sat.balanceOf(deployer.address);
      const buyerSATBefore = await sat.balanceOf(buyer.address);

      await marketplace.connect(buyer).buyListing(0, 100);

      // totalCost = 100 * 10 SAT = 1000 SAT
      const totalCost = ethers.parseEther("1000");
      // fee = 1000 * 250 / 10000 = 25 SAT
      const fee = ethers.parseEther("25");
      // sellerProceeds = 1000 - 25 = 975 SAT
      const sellerProceeds = ethers.parseEther("975");

      // Check SAT balances
      expect(await sat.balanceOf(seller.address)).to.equal(sellerSATBefore + sellerProceeds);
      expect(await sat.balanceOf(deployer.address)).to.equal(feeRecipientSATBefore + fee);
      expect(await sat.balanceOf(buyer.address)).to.equal(buyerSATBefore - totalCost);

      // Check PropertyToken balances
      expect(await propToken.balanceOf(buyer.address)).to.equal(100);

      // Listing should be inactive after full purchase
      const listing = await marketplace.getActiveListing(0);
      expect(listing.active).to.equal(false);
      expect(listing.amount).to.equal(0);
    });

    it("should support partial fills (buy fewer tokens than listed)", async function () {
      const { marketplace, seller, buyer, sat, propToken, deployer } =
        await loadFixture(listingFixture);

      const sellerSATBefore = await sat.balanceOf(seller.address);
      const buyerSATBefore = await sat.balanceOf(buyer.address);

      // Buy only 30 out of 100
      await marketplace.connect(buyer).buyListing(0, 30);

      // totalCost = 30 * 10 = 300 SAT
      const totalCost = ethers.parseEther("300");
      const fee = ethers.parseEther("7.5"); // 300 * 250 / 10000 = 7.5
      const sellerProceeds = ethers.parseEther("292.5"); // 300 - 7.5

      expect(await sat.balanceOf(seller.address)).to.equal(sellerSATBefore + sellerProceeds);
      expect(await sat.balanceOf(buyer.address)).to.equal(buyerSATBefore - totalCost);
      expect(await propToken.balanceOf(buyer.address)).to.equal(30);

      // Listing should still be active with reduced amount
      const listing = await marketplace.getActiveListing(0);
      expect(listing.active).to.equal(true);
      expect(listing.amount).to.equal(70); // 100 - 30
    });

    it("should allow multiple partial buys until listing is exhausted", async function () {
      const { marketplace, buyer, propToken } =
        await loadFixture(listingFixture);

      // Buy 60, then 40
      await marketplace.connect(buyer).buyListing(0, 60);

      let listing = await marketplace.getActiveListing(0);
      expect(listing.active).to.equal(true);
      expect(listing.amount).to.equal(40);

      await marketplace.connect(buyer).buyListing(0, 40);

      listing = await marketplace.getActiveListing(0);
      expect(listing.active).to.equal(false);
      expect(listing.amount).to.equal(0);

      expect(await propToken.balanceOf(buyer.address)).to.equal(100);
    });

    it("should calculate fees correctly", async function () {
      const { marketplace, deployer, buyer, sat } =
        await loadFixture(listingFixture);

      const feeRecipientBefore = await sat.balanceOf(deployer.address);

      // Buy 100 tokens at 10 SAT => totalCost = 1000 SAT, fee = 25 SAT
      await marketplace.connect(buyer).buyListing(0, 100);

      const feeRecipientAfter = await sat.balanceOf(deployer.address);
      const expectedFee = ethers.parseEther("25"); // 1000 * 250 / 10000 = 25
      expect(feeRecipientAfter - feeRecipientBefore).to.equal(expectedFee);
    });

    it("should emit ListingSold event with correct parameters", async function () {
      const { marketplace, buyer } = await loadFixture(listingFixture);

      const totalCost = ethers.parseEther("500"); // 50 * 10
      const fee = ethers.parseEther("12.5"); // 500 * 250 / 10000

      await expect(marketplace.connect(buyer).buyListing(0, 50))
        .to.emit(marketplace, "ListingSold")
        .withArgs(0, buyer.address, 50, totalCost, fee);
    });

    it("should revert when buying from an inactive listing", async function () {
      const { marketplace, seller, buyer, propToken } =
        await loadFixture(listingFixture);

      // Cancel the listing first
      await marketplace.connect(seller).cancelListing(0);

      await expect(
        marketplace.connect(buyer).buyListing(0, 10)
      ).to.be.revertedWithCustomError(marketplace, "ListingNotActive");
    });

    it("should revert when buying 0 tokens", async function () {
      const { marketplace, buyer } = await loadFixture(listingFixture);

      await expect(
        marketplace.connect(buyer).buyListing(0, 0)
      ).to.be.revertedWithCustomError(marketplace, "InvalidAmount");
    });

    it("should revert when buying more tokens than available", async function () {
      const { marketplace, buyer } = await loadFixture(listingFixture);

      await expect(
        marketplace.connect(buyer).buyListing(0, 101)
      ).to.be.revertedWithCustomError(marketplace, "InsufficientListingAmount");
    });

    it("should revert when buying more than the remaining amount after partial fill", async function () {
      const { marketplace, buyer } = await loadFixture(listingFixture);

      // Buy 80, then try to buy 30 (only 20 left)
      await marketplace.connect(buyer).buyListing(0, 80);

      await expect(
        marketplace.connect(buyer).buyListing(0, 30)
      ).to.be.revertedWithCustomError(marketplace, "InsufficientListingAmount");
    });

    it("should revert when buying from a non-existent listing id", async function () {
      const { marketplace, buyer } = await loadFixture(listingFixture);

      await expect(
        marketplace.connect(buyer).buyListing(999, 1)
      ).to.be.revertedWithCustomError(marketplace, "ListingNotActive");
    });

    it("should work with zero fee (fee set to 0)", async function () {
      const { marketplace, deployer, seller, buyer, sat } =
        await loadFixture(listingFixture);

      // Owner sets fee to 0
      await marketplace.connect(deployer).setFee(0);

      const sellerSATBefore = await sat.balanceOf(seller.address);
      const buyerSATBefore = await sat.balanceOf(buyer.address);

      await marketplace.connect(buyer).buyListing(0, 10);

      // totalCost = 10 * 10 = 100 SAT, fee = 0, sellerProceeds = 100
      const totalCost = ethers.parseEther("100");
      expect(await sat.balanceOf(seller.address)).to.equal(sellerSATBefore + totalCost);
      expect(await sat.balanceOf(buyer.address)).to.equal(buyerSATBefore - totalCost);
    });
  });

  // ---------------------------------------------------------------------------
  //  5. Pausing
  // ---------------------------------------------------------------------------

  describe("Pausing", function () {
    it("should prevent createListing when paused", async function () {
      const { marketplace, deployer, seller, propToken } =
        await loadFixture(deployMarketplaceFixture);

      await marketplace.connect(deployer).pause();

      await expect(
        marketplace.connect(seller).createListing(
          await propToken.getAddress(),
          50,
          ethers.parseEther("10")
        )
      ).to.be.revertedWithCustomError(marketplace, "EnforcedPause");
    });

    it("should prevent buyListing when paused", async function () {
      const { marketplace, deployer, seller, buyer, propToken } =
        await loadFixture(deployMarketplaceFixture);

      // Create a listing first
      await marketplace.connect(seller).createListing(
        await propToken.getAddress(),
        50,
        ethers.parseEther("10")
      );

      // Pause
      await marketplace.connect(deployer).pause();

      await expect(
        marketplace.connect(buyer).buyListing(0, 10)
      ).to.be.revertedWithCustomError(marketplace, "EnforcedPause");
    });

    it("should still allow cancelListing when paused", async function () {
      const { marketplace, deployer, seller, propToken } =
        await loadFixture(deployMarketplaceFixture);

      await marketplace.connect(seller).createListing(
        await propToken.getAddress(),
        50,
        ethers.parseEther("10")
      );

      // Pause
      await marketplace.connect(deployer).pause();

      // Cancel should still work
      await expect(marketplace.connect(seller).cancelListing(0))
        .to.emit(marketplace, "ListingCancelled")
        .withArgs(0, seller.address);

      const listing = await marketplace.getActiveListing(0);
      expect(listing.active).to.equal(false);
    });

    it("should allow createListing and buyListing again after unpausing", async function () {
      const { marketplace, deployer, seller, buyer, propToken, sat } =
        await loadFixture(deployMarketplaceFixture);

      // Pause then unpause
      await marketplace.connect(deployer).pause();
      await marketplace.connect(deployer).unpause();

      const propTokenAddress = await propToken.getAddress();

      // createListing should work
      await expect(
        marketplace.connect(seller).createListing(propTokenAddress, 50, ethers.parseEther("10"))
      ).to.emit(marketplace, "ListingCreated");

      // buyListing should work
      await expect(
        marketplace.connect(buyer).buyListing(0, 10)
      ).to.emit(marketplace, "ListingSold");
    });

    it("should only allow the owner to pause", async function () {
      const { marketplace, seller } = await loadFixture(deployMarketplaceFixture);

      await expect(
        marketplace.connect(seller).pause()
      ).to.be.revertedWithCustomError(marketplace, "OwnableUnauthorizedAccount");
    });

    it("should only allow the owner to unpause", async function () {
      const { marketplace, deployer, seller } = await loadFixture(deployMarketplaceFixture);

      await marketplace.connect(deployer).pause();

      await expect(
        marketplace.connect(seller).unpause()
      ).to.be.revertedWithCustomError(marketplace, "OwnableUnauthorizedAccount");
    });
  });

  // ---------------------------------------------------------------------------
  //  6. Admin functions
  // ---------------------------------------------------------------------------

  describe("Admin: setFee", function () {
    it("should allow the owner to update the platform fee", async function () {
      const { marketplace, deployer } = await loadFixture(deployMarketplaceFixture);

      await marketplace.connect(deployer).setFee(500); // 5%
      expect(await marketplace.platformFee()).to.equal(500);
    });

    it("should emit PlatformFeeUpdated event", async function () {
      const { marketplace, deployer } = await loadFixture(deployMarketplaceFixture);

      await expect(marketplace.connect(deployer).setFee(500))
        .to.emit(marketplace, "PlatformFeeUpdated")
        .withArgs(250, 500);
    });

    it("should allow setting fee to 0", async function () {
      const { marketplace, deployer } = await loadFixture(deployMarketplaceFixture);

      await marketplace.connect(deployer).setFee(0);
      expect(await marketplace.platformFee()).to.equal(0);
    });

    it("should allow setting fee to exactly MAX_FEE (1000)", async function () {
      const { marketplace, deployer } = await loadFixture(deployMarketplaceFixture);

      await marketplace.connect(deployer).setFee(1000);
      expect(await marketplace.platformFee()).to.equal(1000);
    });

    it("should revert when fee exceeds MAX_FEE", async function () {
      const { marketplace, deployer } = await loadFixture(deployMarketplaceFixture);

      await expect(
        marketplace.connect(deployer).setFee(1001)
      ).to.be.revertedWithCustomError(marketplace, "FeeTooHigh");
    });

    it("should revert when a non-owner tries to set fee", async function () {
      const { marketplace, seller } = await loadFixture(deployMarketplaceFixture);

      await expect(
        marketplace.connect(seller).setFee(100)
      ).to.be.revertedWithCustomError(marketplace, "OwnableUnauthorizedAccount");
    });
  });

  describe("Admin: setFeeRecipient", function () {
    it("should allow the owner to update the fee recipient", async function () {
      const { marketplace, deployer, other } = await loadFixture(deployMarketplaceFixture);

      await marketplace.connect(deployer).setFeeRecipient(other.address);
      expect(await marketplace.feeRecipient()).to.equal(other.address);
    });

    it("should emit FeeRecipientUpdated event", async function () {
      const { marketplace, deployer, other } = await loadFixture(deployMarketplaceFixture);

      await expect(marketplace.connect(deployer).setFeeRecipient(other.address))
        .to.emit(marketplace, "FeeRecipientUpdated")
        .withArgs(deployer.address, other.address);
    });

    it("should revert when setting fee recipient to zero address", async function () {
      const { marketplace, deployer } = await loadFixture(deployMarketplaceFixture);

      await expect(
        marketplace.connect(deployer).setFeeRecipient(ethers.ZeroAddress)
      ).to.be.revertedWithCustomError(marketplace, "InvalidAddress");
    });

    it("should revert when a non-owner tries to set fee recipient", async function () {
      const { marketplace, seller, other } = await loadFixture(deployMarketplaceFixture);

      await expect(
        marketplace.connect(seller).setFeeRecipient(other.address)
      ).to.be.revertedWithCustomError(marketplace, "OwnableUnauthorizedAccount");
    });

    it("should direct fees to the new recipient after update", async function () {
      const { marketplace, deployer, seller, buyer, other, sat, propToken } =
        await loadFixture(deployMarketplaceFixture);

      // Change fee recipient to 'other'
      await marketplace.connect(deployer).setFeeRecipient(other.address);

      // Create a listing and buy
      const propTokenAddress = await propToken.getAddress();
      await marketplace.connect(seller).createListing(propTokenAddress, 100, ethers.parseEther("10"));

      const otherSATBefore = await sat.balanceOf(other.address);
      await marketplace.connect(buyer).buyListing(0, 100);

      // Fee: 1000 SAT * 250 / 10000 = 25 SAT should go to 'other'
      const expectedFee = ethers.parseEther("25");
      expect(await sat.balanceOf(other.address)).to.equal(otherSATBefore + expectedFee);
    });
  });

  // ---------------------------------------------------------------------------
  //  7. Edge cases
  // ---------------------------------------------------------------------------

  describe("Edge cases", function () {
    it("should handle listing with a single token", async function () {
      const { marketplace, seller, buyer, propToken, sat } =
        await loadFixture(deployMarketplaceFixture);

      const propTokenAddress = await propToken.getAddress();
      const price = ethers.parseEther("100");

      await marketplace.connect(seller).createListing(propTokenAddress, 1, price);
      await marketplace.connect(buyer).buyListing(0, 1);

      const listing = await marketplace.getActiveListing(0);
      expect(listing.active).to.equal(false);
      expect(listing.amount).to.equal(0);
      expect(await propToken.balanceOf(buyer.address)).to.equal(1);
    });

    it("should return an empty array for sellers with no listings", async function () {
      const { marketplace, other } = await loadFixture(deployMarketplaceFixture);
      const ids = await marketplace.getSellerListings(other.address);
      expect(ids).to.deep.equal([]);
    });

    it("should return a listing struct even for non-existent ids (all zeros, inactive)", async function () {
      const { marketplace } = await loadFixture(deployMarketplaceFixture);
      const listing = await marketplace.getActiveListing(999);
      expect(listing.active).to.equal(false);
      expect(listing.seller).to.equal(ethers.ZeroAddress);
      expect(listing.amount).to.equal(0);
    });

    it("should not allow buying from a fully purchased listing", async function () {
      const { marketplace, seller, buyer, propToken } =
        await loadFixture(deployMarketplaceFixture);

      const propTokenAddress = await propToken.getAddress();
      await marketplace.connect(seller).createListing(propTokenAddress, 50, ethers.parseEther("10"));

      // Buy all 50
      await marketplace.connect(buyer).buyListing(0, 50);

      // Try to buy again
      await expect(
        marketplace.connect(buyer).buyListing(0, 1)
      ).to.be.revertedWithCustomError(marketplace, "ListingNotActive");
    });

    it("should handle multiple listings from the same seller independently", async function () {
      const { marketplace, seller, buyer, propToken, sat } =
        await loadFixture(deployMarketplaceFixture);

      const propTokenAddress = await propToken.getAddress();

      // Seller creates two listings
      await marketplace.connect(seller).createListing(propTokenAddress, 100, ethers.parseEther("5"));
      await marketplace.connect(seller).createListing(propTokenAddress, 200, ethers.parseEther("8"));

      // Cancel listing 0
      await marketplace.connect(seller).cancelListing(0);

      // Listing 1 should still be active
      const listing1 = await marketplace.getActiveListing(1);
      expect(listing1.active).to.equal(true);
      expect(listing1.amount).to.equal(200);

      // Buy from listing 1
      await marketplace.connect(buyer).buyListing(1, 50);
      const listing1After = await marketplace.getActiveListing(1);
      expect(listing1After.active).to.equal(true);
      expect(listing1After.amount).to.equal(150);

      // Seller listings array should contain both ids regardless of status
      const ids = await marketplace.getSellerListings(seller.address);
      expect(ids).to.deep.equal([0n, 1n]);
    });

    it("should correctly apply the updated fee to new purchases", async function () {
      const { marketplace, deployer, seller, buyer, sat, propToken } =
        await loadFixture(deployMarketplaceFixture);

      const propTokenAddress = await propToken.getAddress();
      await marketplace.connect(seller).createListing(propTokenAddress, 100, ethers.parseEther("10"));

      // Update fee to 500 (5%)
      await marketplace.connect(deployer).setFee(500);

      const feeRecipientBefore = await sat.balanceOf(deployer.address);
      await marketplace.connect(buyer).buyListing(0, 100);

      // totalCost = 1000 SAT, fee at 5% = 50 SAT
      const expectedFee = ethers.parseEther("50");
      const feeRecipientAfter = await sat.balanceOf(deployer.address);
      expect(feeRecipientAfter - feeRecipientBefore).to.equal(expectedFee);
    });

    it("should apply fee at MAX_FEE (10%) correctly", async function () {
      const { marketplace, deployer, seller, buyer, sat, propToken } =
        await loadFixture(deployMarketplaceFixture);

      const propTokenAddress = await propToken.getAddress();
      await marketplace.connect(seller).createListing(propTokenAddress, 100, ethers.parseEther("10"));

      // Set fee to max (1000 = 10%)
      await marketplace.connect(deployer).setFee(1000);

      const sellerSATBefore = await sat.balanceOf(seller.address);
      const feeRecipientBefore = await sat.balanceOf(deployer.address);

      await marketplace.connect(buyer).buyListing(0, 100);

      // totalCost = 1000 SAT, fee = 1000 * 1000 / 10000 = 100 SAT
      const expectedFee = ethers.parseEther("100");
      const expectedSellerProceeds = ethers.parseEther("900");

      expect(await sat.balanceOf(deployer.address)).to.equal(feeRecipientBefore + expectedFee);
      expect(await sat.balanceOf(seller.address)).to.equal(sellerSATBefore + expectedSellerProceeds);
    });
  });
});
