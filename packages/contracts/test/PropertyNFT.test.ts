import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";

describe("PropertyNFT", function () {
  // ---------------------------------------------------------------
  //  Shared fixture
  // ---------------------------------------------------------------

  async function deployPropertyNFTFixture() {
    const [owner, seller, otherAccount, authorizedContract, anotherContract] =
      await ethers.getSigners();

    const PropertyNFT = await ethers.getContractFactory("PropertyNFT");
    const propertyNFT = await PropertyNFT.deploy(owner.address);

    // Default property parameters used across many tests
    const defaultProperty = {
      seller: seller.address,
      uri: "ipfs://QmTestHash",
      title: "Luxury Apartment",
      location: "123 Main St, New York, NY",
      totalValue: ethers.parseEther("100"),
      fundingTarget: ethers.parseEther("50"),
      minInvestment: ethers.parseEther("1"),
    };

    return {
      propertyNFT,
      owner,
      seller,
      otherAccount,
      authorizedContract,
      anotherContract,
      defaultProperty,
    };
  }

  /**
   * Helper: deploys the contract and mints one property so tests that need
   * an existing token don't have to repeat boilerplate.
   */
  async function deployAndMintFixture() {
    const fixture = await deployPropertyNFTFixture();
    const { propertyNFT, owner, defaultProperty } = fixture;

    const tx = await propertyNFT.connect(owner).mintProperty(
      defaultProperty.seller,
      defaultProperty.uri,
      defaultProperty.title,
      defaultProperty.location,
      defaultProperty.totalValue,
      defaultProperty.fundingTarget,
      defaultProperty.minInvestment
    );
    await tx.wait();

    return { ...fixture, mintedTokenId: 0n };
  }

  // ---------------------------------------------------------------
  //  1. Deployment
  // ---------------------------------------------------------------

  describe("Deployment", function () {
    it("Should set the correct token name", async function () {
      const { propertyNFT } = await loadFixture(deployPropertyNFTFixture);
      expect(await propertyNFT.name()).to.equal("Syntiant Atlas Property");
    });

    it("Should set the correct token symbol", async function () {
      const { propertyNFT } = await loadFixture(deployPropertyNFTFixture);
      expect(await propertyNFT.symbol()).to.equal("SAP");
    });

    it("Should set the correct owner", async function () {
      const { propertyNFT, owner } = await loadFixture(
        deployPropertyNFTFixture
      );
      expect(await propertyNFT.owner()).to.equal(owner.address);
    });

    it("Should start with zero total supply", async function () {
      const { propertyNFT } = await loadFixture(deployPropertyNFTFixture);
      expect(await propertyNFT.totalSupply()).to.equal(0);
    });
  });

  // ---------------------------------------------------------------
  //  2. Minting
  // ---------------------------------------------------------------

  describe("Minting", function () {
    it("Should allow the owner to mint a property", async function () {
      const { propertyNFT, owner, defaultProperty, seller } =
        await loadFixture(deployPropertyNFTFixture);

      await expect(
        propertyNFT.connect(owner).mintProperty(
          defaultProperty.seller,
          defaultProperty.uri,
          defaultProperty.title,
          defaultProperty.location,
          defaultProperty.totalValue,
          defaultProperty.fundingTarget,
          defaultProperty.minInvestment
        )
      ).to.not.be.reverted;

      // Token should be owned by the seller
      expect(await propertyNFT.ownerOf(0)).to.equal(seller.address);
    });

    it("Should revert when a non-owner tries to mint", async function () {
      const { propertyNFT, otherAccount, defaultProperty } =
        await loadFixture(deployPropertyNFTFixture);

      await expect(
        propertyNFT.connect(otherAccount).mintProperty(
          defaultProperty.seller,
          defaultProperty.uri,
          defaultProperty.title,
          defaultProperty.location,
          defaultProperty.totalValue,
          defaultProperty.fundingTarget,
          defaultProperty.minInvestment
        )
      ).to.be.revertedWithCustomError(propertyNFT, "OwnableUnauthorizedAccount");
    });

    it("Should auto-increment tokenId starting from 0", async function () {
      const { propertyNFT, owner, defaultProperty } = await loadFixture(
        deployPropertyNFTFixture
      );

      // Mint first
      const tx1 = await propertyNFT.connect(owner).mintProperty(
        defaultProperty.seller,
        defaultProperty.uri,
        "Property One",
        defaultProperty.location,
        defaultProperty.totalValue,
        defaultProperty.fundingTarget,
        defaultProperty.minInvestment
      );
      const receipt1 = await tx1.wait();

      // Mint second
      const tx2 = await propertyNFT.connect(owner).mintProperty(
        defaultProperty.seller,
        "ipfs://QmSecondHash",
        "Property Two",
        "456 Elm St",
        ethers.parseEther("200"),
        ethers.parseEther("100"),
        ethers.parseEther("5")
      );
      const receipt2 = await tx2.wait();

      // Verify both tokens exist with the right owners
      expect(await propertyNFT.ownerOf(0)).to.equal(defaultProperty.seller);
      expect(await propertyNFT.ownerOf(1)).to.equal(defaultProperty.seller);
      expect(await propertyNFT.totalSupply()).to.equal(2);
    });

    it("Should set correct PropertyInfo on mint", async function () {
      const { propertyNFT, mintedTokenId, defaultProperty } =
        await loadFixture(deployAndMintFixture);

      const info = await propertyNFT.getPropertyInfo(mintedTokenId);

      expect(info.title).to.equal(defaultProperty.title);
      expect(info.location).to.equal(defaultProperty.location);
      expect(info.totalValue).to.equal(defaultProperty.totalValue);
      expect(info.fundingTarget).to.equal(defaultProperty.fundingTarget);
      expect(info.minInvestment).to.equal(defaultProperty.minInvestment);
      expect(info.status).to.equal(0); // Pending
      expect(info.seller).to.equal(defaultProperty.seller);
      expect(info.createdAt).to.be.greaterThan(0);
    });

    it("Should set the correct tokenURI", async function () {
      const { propertyNFT, mintedTokenId, defaultProperty } =
        await loadFixture(deployAndMintFixture);

      expect(await propertyNFT.tokenURI(mintedTokenId)).to.equal(
        defaultProperty.uri
      );
    });

    it("Should emit PropertyMinted event with correct args", async function () {
      const { propertyNFT, owner, defaultProperty } = await loadFixture(
        deployPropertyNFTFixture
      );

      await expect(
        propertyNFT.connect(owner).mintProperty(
          defaultProperty.seller,
          defaultProperty.uri,
          defaultProperty.title,
          defaultProperty.location,
          defaultProperty.totalValue,
          defaultProperty.fundingTarget,
          defaultProperty.minInvestment
        )
      )
        .to.emit(propertyNFT, "PropertyMinted")
        .withArgs(0, defaultProperty.seller, defaultProperty.totalValue);
    });

    // --- Input validation ---

    it("Should revert when seller is the zero address", async function () {
      const { propertyNFT, owner, defaultProperty } = await loadFixture(
        deployPropertyNFTFixture
      );

      await expect(
        propertyNFT.connect(owner).mintProperty(
          ethers.ZeroAddress,
          defaultProperty.uri,
          defaultProperty.title,
          defaultProperty.location,
          defaultProperty.totalValue,
          defaultProperty.fundingTarget,
          defaultProperty.minInvestment
        )
      ).to.be.revertedWith("PropertyNFT: zero address seller");
    });

    it("Should revert when totalValue is zero", async function () {
      const { propertyNFT, owner, defaultProperty } = await loadFixture(
        deployPropertyNFTFixture
      );

      await expect(
        propertyNFT.connect(owner).mintProperty(
          defaultProperty.seller,
          defaultProperty.uri,
          defaultProperty.title,
          defaultProperty.location,
          0,
          defaultProperty.fundingTarget,
          defaultProperty.minInvestment
        )
      ).to.be.revertedWith("PropertyNFT: zero total value");
    });

    it("Should revert when fundingTarget is zero", async function () {
      const { propertyNFT, owner, defaultProperty } = await loadFixture(
        deployPropertyNFTFixture
      );

      await expect(
        propertyNFT.connect(owner).mintProperty(
          defaultProperty.seller,
          defaultProperty.uri,
          defaultProperty.title,
          defaultProperty.location,
          defaultProperty.totalValue,
          0,
          defaultProperty.minInvestment
        )
      ).to.be.revertedWith("PropertyNFT: zero funding target");
    });

    it("Should revert when minInvestment is zero", async function () {
      const { propertyNFT, owner, defaultProperty } = await loadFixture(
        deployPropertyNFTFixture
      );

      await expect(
        propertyNFT.connect(owner).mintProperty(
          defaultProperty.seller,
          defaultProperty.uri,
          defaultProperty.title,
          defaultProperty.location,
          defaultProperty.totalValue,
          defaultProperty.fundingTarget,
          0
        )
      ).to.be.revertedWith("PropertyNFT: invalid min investment");
    });

    it("Should revert when minInvestment exceeds fundingTarget", async function () {
      const { propertyNFT, owner, defaultProperty } = await loadFixture(
        deployPropertyNFTFixture
      );

      const fundingTarget = ethers.parseEther("50");
      const tooHighMin = ethers.parseEther("51");

      await expect(
        propertyNFT.connect(owner).mintProperty(
          defaultProperty.seller,
          defaultProperty.uri,
          defaultProperty.title,
          defaultProperty.location,
          defaultProperty.totalValue,
          fundingTarget,
          tooHighMin
        )
      ).to.be.revertedWith("PropertyNFT: invalid min investment");
    });

    it("Should allow minInvestment equal to fundingTarget", async function () {
      const { propertyNFT, owner, defaultProperty } = await loadFixture(
        deployPropertyNFTFixture
      );

      const target = ethers.parseEther("50");

      await expect(
        propertyNFT.connect(owner).mintProperty(
          defaultProperty.seller,
          defaultProperty.uri,
          defaultProperty.title,
          defaultProperty.location,
          defaultProperty.totalValue,
          target,
          target // minInvestment == fundingTarget
        )
      ).to.not.be.reverted;
    });

    it("Should increment totalSupply after each mint", async function () {
      const { propertyNFT, owner, defaultProperty } = await loadFixture(
        deployPropertyNFTFixture
      );

      expect(await propertyNFT.totalSupply()).to.equal(0);

      await propertyNFT.connect(owner).mintProperty(
        defaultProperty.seller,
        defaultProperty.uri,
        defaultProperty.title,
        defaultProperty.location,
        defaultProperty.totalValue,
        defaultProperty.fundingTarget,
        defaultProperty.minInvestment
      );

      expect(await propertyNFT.totalSupply()).to.equal(1);
    });
  });

  // ---------------------------------------------------------------
  //  3. Status Updates
  // ---------------------------------------------------------------

  describe("Status Updates", function () {
    describe("updateStatus (enum)", function () {
      it("Should allow the owner to update status", async function () {
        const { propertyNFT, owner, mintedTokenId } = await loadFixture(
          deployAndMintFixture
        );

        // Pending -> Active
        await expect(propertyNFT.connect(owner).updateStatus(mintedTokenId, 1))
          .to.not.be.reverted;

        const info = await propertyNFT.getPropertyInfo(mintedTokenId);
        expect(info.status).to.equal(1); // Active
      });

      it("Should allow an authorized contract to update status", async function () {
        const {
          propertyNFT,
          owner,
          authorizedContract,
          mintedTokenId,
        } = await loadFixture(deployAndMintFixture);

        await propertyNFT
          .connect(owner)
          .addAuthorizedContract(authorizedContract.address);

        await expect(
          propertyNFT
            .connect(authorizedContract)
            .updateStatus(mintedTokenId, 1)
        ).to.not.be.reverted;

        const info = await propertyNFT.getPropertyInfo(mintedTokenId);
        expect(info.status).to.equal(1);
      });

      it("Should revert when an unauthorized account updates status", async function () {
        const { propertyNFT, otherAccount, mintedTokenId } =
          await loadFixture(deployAndMintFixture);

        await expect(
          propertyNFT.connect(otherAccount).updateStatus(mintedTokenId, 1)
        ).to.be.revertedWith("PropertyNFT: not owner or authorized");
      });

      it("Should revert when updating a nonexistent token", async function () {
        const { propertyNFT, owner } = await loadFixture(
          deployAndMintFixture
        );

        await expect(
          propertyNFT.connect(owner).updateStatus(999, 1)
        ).to.be.revertedWith("PropertyNFT: nonexistent token");
      });

      it("Should revert when setting the same status", async function () {
        const { propertyNFT, owner, mintedTokenId } = await loadFixture(
          deployAndMintFixture
        );

        // Token starts in Pending (0); updating to Pending should revert.
        await expect(
          propertyNFT.connect(owner).updateStatus(mintedTokenId, 0)
        ).to.be.revertedWith("PropertyNFT: status unchanged");
      });

      it("Should emit PropertyStatusUpdated with correct args", async function () {
        const { propertyNFT, owner, mintedTokenId } = await loadFixture(
          deployAndMintFixture
        );

        await expect(propertyNFT.connect(owner).updateStatus(mintedTokenId, 1))
          .to.emit(propertyNFT, "PropertyStatusUpdated")
          .withArgs(mintedTokenId, 0, 1); // Pending -> Active
      });

      it("Should transition through all statuses", async function () {
        const { propertyNFT, owner, mintedTokenId } = await loadFixture(
          deployAndMintFixture
        );

        // Pending(0) -> Active(1)
        await propertyNFT.connect(owner).updateStatus(mintedTokenId, 1);
        expect((await propertyNFT.getPropertyInfo(mintedTokenId)).status).to.equal(1);

        // Active(1) -> Funded(2)
        await propertyNFT.connect(owner).updateStatus(mintedTokenId, 2);
        expect((await propertyNFT.getPropertyInfo(mintedTokenId)).status).to.equal(2);

        // Funded(2) -> Closed(3)
        await propertyNFT.connect(owner).updateStatus(mintedTokenId, 3);
        expect((await propertyNFT.getPropertyInfo(mintedTokenId)).status).to.equal(3);
      });
    });

    describe("updatePropertyStatus (uint8)", function () {
      it("Should allow the owner to update status via uint8", async function () {
        const { propertyNFT, owner, mintedTokenId } = await loadFixture(
          deployAndMintFixture
        );

        await expect(
          propertyNFT.connect(owner).updatePropertyStatus(mintedTokenId, 1)
        ).to.not.be.reverted;

        expect(await propertyNFT.getPropertyStatus(mintedTokenId)).to.equal(1);
      });

      it("Should allow an authorized contract to update status via uint8", async function () {
        const {
          propertyNFT,
          owner,
          authorizedContract,
          mintedTokenId,
        } = await loadFixture(deployAndMintFixture);

        await propertyNFT
          .connect(owner)
          .addAuthorizedContract(authorizedContract.address);

        await expect(
          propertyNFT
            .connect(authorizedContract)
            .updatePropertyStatus(mintedTokenId, 2)
        ).to.not.be.reverted;

        expect(await propertyNFT.getPropertyStatus(mintedTokenId)).to.equal(2);
      });

      it("Should revert when an unauthorized account calls updatePropertyStatus", async function () {
        const { propertyNFT, otherAccount, mintedTokenId } =
          await loadFixture(deployAndMintFixture);

        await expect(
          propertyNFT
            .connect(otherAccount)
            .updatePropertyStatus(mintedTokenId, 1)
        ).to.be.revertedWith("PropertyNFT: not owner or authorized");
      });

      it("Should revert for a nonexistent token", async function () {
        const { propertyNFT, owner } = await loadFixture(
          deployAndMintFixture
        );

        await expect(
          propertyNFT.connect(owner).updatePropertyStatus(999, 1)
        ).to.be.revertedWith("PropertyNFT: nonexistent token");
      });

      it("Should revert when setting the same status via uint8", async function () {
        const { propertyNFT, owner, mintedTokenId } = await loadFixture(
          deployAndMintFixture
        );

        // Pending == 0
        await expect(
          propertyNFT.connect(owner).updatePropertyStatus(mintedTokenId, 0)
        ).to.be.revertedWith("PropertyNFT: status unchanged");
      });

      it("Should emit PropertyStatusUpdated with correct args", async function () {
        const { propertyNFT, owner, mintedTokenId } = await loadFixture(
          deployAndMintFixture
        );

        await expect(
          propertyNFT.connect(owner).updatePropertyStatus(mintedTokenId, 3)
        )
          .to.emit(propertyNFT, "PropertyStatusUpdated")
          .withArgs(mintedTokenId, 0, 3); // Pending -> Closed
      });
    });
  });

  // ---------------------------------------------------------------
  //  4. Authorization Management
  // ---------------------------------------------------------------

  describe("Authorization", function () {
    it("Should allow the owner to add an authorized contract", async function () {
      const { propertyNFT, owner, authorizedContract } = await loadFixture(
        deployPropertyNFTFixture
      );

      await propertyNFT
        .connect(owner)
        .addAuthorizedContract(authorizedContract.address);

      expect(
        await propertyNFT.authorizedContracts(authorizedContract.address)
      ).to.be.true;
    });

    it("Should emit AuthorizedContractAdded event", async function () {
      const { propertyNFT, owner, authorizedContract } = await loadFixture(
        deployPropertyNFTFixture
      );

      await expect(
        propertyNFT
          .connect(owner)
          .addAuthorizedContract(authorizedContract.address)
      )
        .to.emit(propertyNFT, "AuthorizedContractAdded")
        .withArgs(authorizedContract.address);
    });

    it("Should allow the owner to remove an authorized contract", async function () {
      const { propertyNFT, owner, authorizedContract } = await loadFixture(
        deployPropertyNFTFixture
      );

      await propertyNFT
        .connect(owner)
        .addAuthorizedContract(authorizedContract.address);
      expect(
        await propertyNFT.authorizedContracts(authorizedContract.address)
      ).to.be.true;

      await propertyNFT
        .connect(owner)
        .removeAuthorizedContract(authorizedContract.address);
      expect(
        await propertyNFT.authorizedContracts(authorizedContract.address)
      ).to.be.false;
    });

    it("Should emit AuthorizedContractRemoved event", async function () {
      const { propertyNFT, owner, authorizedContract } = await loadFixture(
        deployPropertyNFTFixture
      );

      await propertyNFT
        .connect(owner)
        .addAuthorizedContract(authorizedContract.address);

      await expect(
        propertyNFT
          .connect(owner)
          .removeAuthorizedContract(authorizedContract.address)
      )
        .to.emit(propertyNFT, "AuthorizedContractRemoved")
        .withArgs(authorizedContract.address);
    });

    it("Should revert when a non-owner adds an authorized contract", async function () {
      const { propertyNFT, otherAccount, authorizedContract } =
        await loadFixture(deployPropertyNFTFixture);

      await expect(
        propertyNFT
          .connect(otherAccount)
          .addAuthorizedContract(authorizedContract.address)
      ).to.be.revertedWithCustomError(propertyNFT, "OwnableUnauthorizedAccount");
    });

    it("Should revert when a non-owner removes an authorized contract", async function () {
      const { propertyNFT, owner, otherAccount, authorizedContract } =
        await loadFixture(deployPropertyNFTFixture);

      await propertyNFT
        .connect(owner)
        .addAuthorizedContract(authorizedContract.address);

      await expect(
        propertyNFT
          .connect(otherAccount)
          .removeAuthorizedContract(authorizedContract.address)
      ).to.be.revertedWithCustomError(propertyNFT, "OwnableUnauthorizedAccount");
    });

    it("Should revert when adding the zero address as authorized", async function () {
      const { propertyNFT, owner } = await loadFixture(
        deployPropertyNFTFixture
      );

      await expect(
        propertyNFT.connect(owner).addAuthorizedContract(ethers.ZeroAddress)
      ).to.be.revertedWith("PropertyNFT: zero address");
    });

    it("Should prevent a removed contract from updating status", async function () {
      const {
        propertyNFT,
        owner,
        authorizedContract,
        mintedTokenId,
      } = await loadFixture(deployAndMintFixture);

      // Authorize then revoke
      await propertyNFT
        .connect(owner)
        .addAuthorizedContract(authorizedContract.address);
      await propertyNFT
        .connect(owner)
        .removeAuthorizedContract(authorizedContract.address);

      await expect(
        propertyNFT
          .connect(authorizedContract)
          .updateStatus(mintedTokenId, 1)
      ).to.be.revertedWith("PropertyNFT: not owner or authorized");
    });
  });

  // ---------------------------------------------------------------
  //  5. Getters
  // ---------------------------------------------------------------

  describe("Getters", function () {
    describe("getPropertyInfo", function () {
      it("Should return correct PropertyInfo for a minted token", async function () {
        const { propertyNFT, mintedTokenId, defaultProperty } =
          await loadFixture(deployAndMintFixture);

        const info = await propertyNFT.getPropertyInfo(mintedTokenId);

        expect(info.title).to.equal(defaultProperty.title);
        expect(info.location).to.equal(defaultProperty.location);
        expect(info.totalValue).to.equal(defaultProperty.totalValue);
        expect(info.fundingTarget).to.equal(defaultProperty.fundingTarget);
        expect(info.minInvestment).to.equal(defaultProperty.minInvestment);
        expect(info.status).to.equal(0);
        expect(info.seller).to.equal(defaultProperty.seller);
        expect(info.createdAt).to.be.greaterThan(0);
      });

      it("Should reflect status changes in getPropertyInfo", async function () {
        const { propertyNFT, owner, mintedTokenId } = await loadFixture(
          deployAndMintFixture
        );

        await propertyNFT.connect(owner).updateStatus(mintedTokenId, 2);
        const info = await propertyNFT.getPropertyInfo(mintedTokenId);
        expect(info.status).to.equal(2); // Funded
      });
    });

    describe("getPropertyStatus", function () {
      it("Should return the correct uint8 status", async function () {
        const { propertyNFT, mintedTokenId } = await loadFixture(
          deployAndMintFixture
        );

        expect(await propertyNFT.getPropertyStatus(mintedTokenId)).to.equal(0);
      });

      it("Should reflect updates", async function () {
        const { propertyNFT, owner, mintedTokenId } = await loadFixture(
          deployAndMintFixture
        );

        await propertyNFT.connect(owner).updateStatus(mintedTokenId, 1);
        expect(await propertyNFT.getPropertyStatus(mintedTokenId)).to.equal(1);
      });
    });

    describe("getFundingTarget", function () {
      it("Should return the correct funding target", async function () {
        const { propertyNFT, mintedTokenId, defaultProperty } =
          await loadFixture(deployAndMintFixture);

        expect(await propertyNFT.getFundingTarget(mintedTokenId)).to.equal(
          defaultProperty.fundingTarget
        );
      });
    });

    describe("getMinInvestment", function () {
      it("Should return the correct minimum investment", async function () {
        const { propertyNFT, mintedTokenId, defaultProperty } =
          await loadFixture(deployAndMintFixture);

        expect(await propertyNFT.getMinInvestment(mintedTokenId)).to.equal(
          defaultProperty.minInvestment
        );
      });
    });
  });

  // ---------------------------------------------------------------
  //  6. Edge Cases
  // ---------------------------------------------------------------

  describe("Edge Cases", function () {
    it("Should revert getPropertyInfo for a nonexistent token", async function () {
      const { propertyNFT } = await loadFixture(deployPropertyNFTFixture);

      await expect(propertyNFT.getPropertyInfo(0)).to.be.revertedWith(
        "PropertyNFT: nonexistent token"
      );
    });

    it("Should revert getPropertyStatus for a nonexistent token", async function () {
      const { propertyNFT } = await loadFixture(deployPropertyNFTFixture);

      await expect(propertyNFT.getPropertyStatus(42)).to.be.revertedWith(
        "PropertyNFT: nonexistent token"
      );
    });

    it("Should revert getFundingTarget for a nonexistent token", async function () {
      const { propertyNFT } = await loadFixture(deployPropertyNFTFixture);

      await expect(propertyNFT.getFundingTarget(99)).to.be.revertedWith(
        "PropertyNFT: nonexistent token"
      );
    });

    it("Should revert getMinInvestment for a nonexistent token", async function () {
      const { propertyNFT } = await loadFixture(deployPropertyNFTFixture);

      await expect(propertyNFT.getMinInvestment(100)).to.be.revertedWith(
        "PropertyNFT: nonexistent token"
      );
    });

    it("Should revert tokenURI for a nonexistent token", async function () {
      const { propertyNFT } = await loadFixture(deployPropertyNFTFixture);

      await expect(propertyNFT.tokenURI(0)).to.be.reverted;
    });

    it("Should support ERC721 interface", async function () {
      const { propertyNFT } = await loadFixture(deployPropertyNFTFixture);

      // ERC721 interfaceId = 0x80ac58cd
      expect(await propertyNFT.supportsInterface("0x80ac58cd")).to.be.true;
    });

    it("Should support ERC721Enumerable interface", async function () {
      const { propertyNFT } = await loadFixture(deployPropertyNFTFixture);

      // ERC721Enumerable interfaceId = 0x780e9d63
      expect(await propertyNFT.supportsInterface("0x780e9d63")).to.be.true;
    });

    it("Should track tokens via ERC721Enumerable (tokenByIndex)", async function () {
      const { propertyNFT, owner, defaultProperty, seller } =
        await loadFixture(deployPropertyNFTFixture);

      await propertyNFT.connect(owner).mintProperty(
        defaultProperty.seller,
        defaultProperty.uri,
        defaultProperty.title,
        defaultProperty.location,
        defaultProperty.totalValue,
        defaultProperty.fundingTarget,
        defaultProperty.minInvestment
      );

      expect(await propertyNFT.tokenByIndex(0)).to.equal(0);
      expect(await propertyNFT.tokenOfOwnerByIndex(seller.address, 0)).to.equal(0);
    });

    it("Should allow minting multiple properties to different sellers", async function () {
      const { propertyNFT, owner, seller, otherAccount, defaultProperty } =
        await loadFixture(deployPropertyNFTFixture);

      await propertyNFT.connect(owner).mintProperty(
        seller.address,
        defaultProperty.uri,
        "Property A",
        "Location A",
        ethers.parseEther("100"),
        ethers.parseEther("50"),
        ethers.parseEther("1")
      );

      await propertyNFT.connect(owner).mintProperty(
        otherAccount.address,
        "ipfs://QmOtherHash",
        "Property B",
        "Location B",
        ethers.parseEther("200"),
        ethers.parseEther("100"),
        ethers.parseEther("5")
      );

      expect(await propertyNFT.ownerOf(0)).to.equal(seller.address);
      expect(await propertyNFT.ownerOf(1)).to.equal(otherAccount.address);
      expect(await propertyNFT.balanceOf(seller.address)).to.equal(1);
      expect(await propertyNFT.balanceOf(otherAccount.address)).to.equal(1);
    });
  });
});
