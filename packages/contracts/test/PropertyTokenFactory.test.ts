import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";

describe("PropertyToken & PropertyTokenFactory", function () {
  // ---------------------------------------------------------------------------
  // Constants used throughout the tests
  // ---------------------------------------------------------------------------

  const TOTAL_SHARES = 1000n;
  const INITIAL_SAT_SUPPLY = 100_000_000n * 10n ** 18n; // 100M SAT (18 decimals)

  // Property parameters (SAT amounts in 18-decimal wei)
  const PROPERTY_TOTAL_VALUE = 10_000n * 10n ** 18n; // 10,000 SAT
  const FUNDING_TARGET = 1_000n * 10n ** 18n; // 1,000 SAT
  const MIN_INVESTMENT = 10n * 10n ** 18n; // 10 SAT

  // ---------------------------------------------------------------------------
  // Shared deployment fixture
  // ---------------------------------------------------------------------------

  /**
   * Deploys the full ecosystem:
   *   1. SyntiantToken  -- owner gets 100M SAT
   *   2. PropertyNFT     -- deployer is owner
   *   3. PropertyTokenFactory -- wired to SAT + NFT, deployer is owner
   *   4. Authorises the factory on PropertyNFT
   *   5. Mints a property NFT (tokenId 0)
   *   6. Sets the property to Active (status 1)
   *   7. Creates a PropertyToken via the factory for propertyId 0
   */
  async function deployFullEcosystemFixture() {
    const [owner, seller, investor1, investor2, investor3, stranger] =
      await ethers.getSigners();

    // 1. Deploy SyntiantToken
    const SyntiantToken = await ethers.getContractFactory("SyntiantToken");
    const syntiantToken = await SyntiantToken.deploy(owner.address);

    // 2. Deploy PropertyNFT
    const PropertyNFT = await ethers.getContractFactory("PropertyNFT");
    const propertyNFT = await PropertyNFT.deploy(owner.address);

    // 3. Deploy PropertyTokenFactory
    const PropertyTokenFactory = await ethers.getContractFactory(
      "PropertyTokenFactory"
    );
    const factory = await PropertyTokenFactory.deploy(
      await syntiantToken.getAddress(),
      await propertyNFT.getAddress(),
      owner.address
    );

    // 4. Authorise factory on PropertyNFT
    await propertyNFT.addAuthorizedContract(await factory.getAddress());

    // 5. Mint a property (tokenId = 0)
    await propertyNFT.mintProperty(
      seller.address,
      "ipfs://test-uri",
      "Test Property",
      "Test Location",
      PROPERTY_TOTAL_VALUE,
      FUNDING_TARGET,
      MIN_INVESTMENT
    );
    const propertyId = 0n;

    // 6. Set property to Active (enum 1)
    await propertyNFT.updateStatus(propertyId, 1); // PropertyStatus.Active

    // 7. Create PropertyToken via the factory
    await factory.createPropertyToken(
      propertyId,
      "Test Property Token",
      "TPT"
    );

    // Helper: get the deployed PropertyToken contract instance
    const propertyTokenAddress = await factory.getPropertyToken(propertyId);
    const propertyToken = await ethers.getContractAt(
      "PropertyToken",
      propertyTokenAddress
    );

    return {
      owner,
      seller,
      investor1,
      investor2,
      investor3,
      stranger,
      syntiantToken,
      propertyNFT,
      factory,
      propertyToken,
      propertyId,
      propertyTokenAddress,
    };
  }

  /**
   * Minimal fixture that only deploys PropertyToken standalone (not via factory)
   * for isolated unit tests of the PropertyToken contract.
   */
  async function deployStandalonePropertyTokenFixture() {
    const [owner, other] = await ethers.getSigners();

    const PropertyToken = await ethers.getContractFactory("PropertyToken");
    const propertyToken = await PropertyToken.deploy(
      "Standalone Token",
      "STK",
      42n, // propertyId
      TOTAL_SHARES,
      owner.address
    );

    return { owner, other, propertyToken };
  }

  // ===========================================================================
  // 1. PropertyToken (standalone)
  // ===========================================================================

  describe("PropertyToken", function () {
    describe("Deployment", function () {
      it("should set correct name and symbol", async function () {
        const { propertyToken } = await loadFixture(
          deployStandalonePropertyTokenFixture
        );
        expect(await propertyToken.name()).to.equal("Standalone Token");
        expect(await propertyToken.symbol()).to.equal("STK");
      });

      it("should set immutable propertyId", async function () {
        const { propertyToken } = await loadFixture(
          deployStandalonePropertyTokenFixture
        );
        expect(await propertyToken.propertyId()).to.equal(42n);
      });

      it("should set immutable totalShares", async function () {
        const { propertyToken } = await loadFixture(
          deployStandalonePropertyTokenFixture
        );
        expect(await propertyToken.totalShares()).to.equal(TOTAL_SHARES);
      });

      it("should assign owner correctly", async function () {
        const { owner, propertyToken } = await loadFixture(
          deployStandalonePropertyTokenFixture
        );
        expect(await propertyToken.owner()).to.equal(owner.address);
      });

      it("should have zero initial supply", async function () {
        const { propertyToken } = await loadFixture(
          deployStandalonePropertyTokenFixture
        );
        expect(await propertyToken.totalSupply()).to.equal(0n);
      });
    });

    describe("decimals", function () {
      it("should return 0 (whole shares, not fractional)", async function () {
        const { propertyToken } = await loadFixture(
          deployStandalonePropertyTokenFixture
        );
        expect(await propertyToken.decimals()).to.equal(0);
      });
    });

    describe("mint", function () {
      it("should allow owner to mint shares", async function () {
        const { owner, other, propertyToken } = await loadFixture(
          deployStandalonePropertyTokenFixture
        );
        await propertyToken.mint(other.address, 100n);
        expect(await propertyToken.balanceOf(other.address)).to.equal(100n);
        expect(await propertyToken.totalSupply()).to.equal(100n);
      });

      it("should allow minting up to the totalShares cap", async function () {
        const { other, propertyToken } = await loadFixture(
          deployStandalonePropertyTokenFixture
        );
        await propertyToken.mint(other.address, TOTAL_SHARES);
        expect(await propertyToken.totalSupply()).to.equal(TOTAL_SHARES);
      });

      it("should revert when minting exceeds totalShares", async function () {
        const { other, propertyToken } = await loadFixture(
          deployStandalonePropertyTokenFixture
        );
        await expect(propertyToken.mint(other.address, TOTAL_SHARES + 1n))
          .to.be.revertedWithCustomError(propertyToken, "ExceedsMaxSupply")
          .withArgs(TOTAL_SHARES + 1n, TOTAL_SHARES);
      });

      it("should revert when minting would exceed remaining supply", async function () {
        const { other, propertyToken } = await loadFixture(
          deployStandalonePropertyTokenFixture
        );
        await propertyToken.mint(other.address, 900n);
        // Only 100 shares remain; try to mint 200
        await expect(propertyToken.mint(other.address, 200n))
          .to.be.revertedWithCustomError(propertyToken, "ExceedsMaxSupply")
          .withArgs(200n, 100n);
      });

      it("should revert when non-owner tries to mint", async function () {
        const { other, propertyToken } = await loadFixture(
          deployStandalonePropertyTokenFixture
        );
        await expect(
          propertyToken.connect(other).mint(other.address, 1n)
        ).to.be.revertedWithCustomError(propertyToken, "OwnableUnauthorizedAccount");
      });
    });
  });

  // ===========================================================================
  // 2. PropertyTokenFactory -- Deployment & createPropertyToken
  // ===========================================================================

  describe("PropertyTokenFactory", function () {
    describe("Deployment", function () {
      it("should set the syntiantToken address", async function () {
        const { factory, syntiantToken } = await loadFixture(
          deployFullEcosystemFixture
        );
        expect(await factory.syntiantToken()).to.equal(
          await syntiantToken.getAddress()
        );
      });

      it("should set the propertyNFT address", async function () {
        const { factory, propertyNFT } = await loadFixture(
          deployFullEcosystemFixture
        );
        expect(await factory.propertyNFT()).to.equal(
          await propertyNFT.getAddress()
        );
      });

      it("should set the owner correctly", async function () {
        const { factory, owner } = await loadFixture(
          deployFullEcosystemFixture
        );
        expect(await factory.owner()).to.equal(owner.address);
      });

      it("should expose TOTAL_SHARES_PER_PROPERTY constant", async function () {
        const { factory } = await loadFixture(deployFullEcosystemFixture);
        expect(await factory.TOTAL_SHARES_PER_PROPERTY()).to.equal(1000n);
      });
    });

    describe("createPropertyToken", function () {
      it("should deploy a PropertyToken with correct parameters", async function () {
        const { factory, propertyToken, propertyId } = await loadFixture(
          deployFullEcosystemFixture
        );
        // Token was created in the fixture for propertyId 0
        expect(await propertyToken.name()).to.equal("Test Property Token");
        expect(await propertyToken.symbol()).to.equal("TPT");
        expect(await propertyToken.propertyId()).to.equal(propertyId);
        expect(await propertyToken.totalShares()).to.equal(TOTAL_SHARES);
        // Factory is the PropertyToken's owner
        expect(await propertyToken.owner()).to.equal(
          await factory.getAddress()
        );
      });

      it("should store the token address in propertyTokens mapping", async function () {
        const { factory, propertyId, propertyTokenAddress } =
          await loadFixture(deployFullEcosystemFixture);
        expect(await factory.propertyTokens(propertyId)).to.equal(
          propertyTokenAddress
        );
      });

      it("should emit PropertyTokenCreated event", async function () {
        const { owner, factory, propertyNFT, seller } = await loadFixture(
          deployFullEcosystemFixture
        );

        // Mint a second property (tokenId = 1) and create its token
        await propertyNFT.mintProperty(
          seller.address,
          "ipfs://test-2",
          "Second Property",
          "Location 2",
          PROPERTY_TOTAL_VALUE,
          FUNDING_TARGET,
          MIN_INVESTMENT
        );
        const secondPropertyId = 1n;
        await propertyNFT.updateStatus(secondPropertyId, 1);

        await expect(
          factory.createPropertyToken(secondPropertyId, "Token 2", "TK2")
        )
          .to.emit(factory, "PropertyTokenCreated")
          .withArgs(secondPropertyId, (addr: string) => {
            // The address is auto-generated; just check it is non-zero
            return addr !== ethers.ZeroAddress;
          });
      });

      it("should revert if a token already exists for the propertyId", async function () {
        const { factory, propertyId } = await loadFixture(
          deployFullEcosystemFixture
        );
        // Token for propertyId 0 was already created in the fixture
        await expect(
          factory.createPropertyToken(propertyId, "Duplicate", "DUP")
        )
          .to.be.revertedWithCustomError(factory, "PropertyTokenAlreadyExists")
          .withArgs(propertyId);
      });

      it("should revert if non-owner tries to create a token", async function () {
        const { factory, stranger } = await loadFixture(
          deployFullEcosystemFixture
        );
        await expect(
          factory
            .connect(stranger)
            .createPropertyToken(99n, "Rogue", "RGE")
        ).to.be.revertedWithCustomError(factory, "OwnableUnauthorizedAccount");
      });
    });

    // =========================================================================
    // 3. Investment flow
    // =========================================================================

    describe("invest", function () {
      /**
       * Helper: fund an investor with SAT tokens and approve the factory.
       */
      async function fundAndApprove(
        syntiantToken: any,
        owner: any,
        investor: any,
        factory: any,
        amount: bigint
      ) {
        await syntiantToken.transfer(investor.address, amount);
        await syntiantToken
          .connect(investor)
          .approve(await factory.getAddress(), amount);
      }

      it("should transfer SAT from investor to factory", async function () {
        const { factory, syntiantToken, owner, investor1, propertyId } =
          await loadFixture(deployFullEcosystemFixture);

        const investAmount = 100n * 10n ** 18n; // 100 SAT
        await fundAndApprove(
          syntiantToken,
          owner,
          investor1,
          factory,
          investAmount
        );

        const factoryAddress = await factory.getAddress();
        const factoryBalBefore = await syntiantToken.balanceOf(factoryAddress);
        const investorBalBefore = await syntiantToken.balanceOf(
          investor1.address
        );

        await factory.connect(investor1).invest(propertyId, investAmount);

        expect(await syntiantToken.balanceOf(factoryAddress)).to.equal(
          factoryBalBefore + investAmount
        );
        expect(await syntiantToken.balanceOf(investor1.address)).to.equal(
          investorBalBefore - investAmount
        );
      });

      it("should calculate shares correctly: (amount * 1000) / fundingTarget", async function () {
        const {
          factory,
          syntiantToken,
          owner,
          investor1,
          propertyId,
          propertyToken,
        } = await loadFixture(deployFullEcosystemFixture);

        const investAmount = 100n * 10n ** 18n; // 100 SAT
        // Expected: (100e18 * 1000) / 1000e18 = 100 shares
        const expectedShares = 100n;

        await fundAndApprove(
          syntiantToken,
          owner,
          investor1,
          factory,
          investAmount
        );

        await factory.connect(investor1).invest(propertyId, investAmount);

        expect(await propertyToken.balanceOf(investor1.address)).to.equal(
          expectedShares
        );
        expect(
          await factory.getInvestorShares(propertyId, investor1.address)
        ).to.equal(expectedShares);
      });

      it("should emit InvestmentMade event with correct args", async function () {
        const { factory, syntiantToken, owner, investor1, propertyId } =
          await loadFixture(deployFullEcosystemFixture);

        const investAmount = 50n * 10n ** 18n; // 50 SAT => 50 shares
        await fundAndApprove(
          syntiantToken,
          owner,
          investor1,
          factory,
          investAmount
        );

        await expect(
          factory.connect(investor1).invest(propertyId, investAmount)
        )
          .to.emit(factory, "InvestmentMade")
          .withArgs(propertyId, investor1.address, investAmount, 50n);
      });

      it("should record investment in propertyInvestments", async function () {
        const { factory, syntiantToken, owner, investor1, propertyId } =
          await loadFixture(deployFullEcosystemFixture);

        const investAmount = 200n * 10n ** 18n;
        await fundAndApprove(
          syntiantToken,
          owner,
          investor1,
          factory,
          investAmount
        );

        await factory.connect(investor1).invest(propertyId, investAmount);

        expect(await factory.propertyInvestments(propertyId)).to.equal(
          investAmount
        );
      });

      it("should accumulate shares across multiple investments by the same investor", async function () {
        const {
          factory,
          syntiantToken,
          owner,
          investor1,
          propertyId,
          propertyToken,
        } = await loadFixture(deployFullEcosystemFixture);

        const firstInvest = 100n * 10n ** 18n; // 100 shares
        const secondInvest = 200n * 10n ** 18n; // 200 shares
        const totalAmount = firstInvest + secondInvest;

        await fundAndApprove(
          syntiantToken,
          owner,
          investor1,
          factory,
          totalAmount
        );

        await factory.connect(investor1).invest(propertyId, firstInvest);
        await factory.connect(investor1).invest(propertyId, secondInvest);

        expect(await propertyToken.balanceOf(investor1.address)).to.equal(
          300n
        );
        expect(
          await factory.getInvestorShares(propertyId, investor1.address)
        ).to.equal(300n);
        expect(await factory.propertyInvestments(propertyId)).to.equal(
          totalAmount
        );
      });
    });

    // =========================================================================
    // 4. Investment validation
    // =========================================================================

    describe("invest -- validation", function () {
      async function fundAndApprove(
        syntiantToken: any,
        owner: any,
        investor: any,
        factory: any,
        amount: bigint
      ) {
        await syntiantToken.transfer(investor.address, amount);
        await syntiantToken
          .connect(investor)
          .approve(await factory.getAddress(), amount);
      }

      it("should revert with PropertyTokenNotFound when no token exists", async function () {
        const { factory, investor1 } = await loadFixture(
          deployFullEcosystemFixture
        );
        const nonExistentId = 999n;
        await expect(
          factory.connect(investor1).invest(nonExistentId, 100n * 10n ** 18n)
        )
          .to.be.revertedWithCustomError(factory, "PropertyTokenNotFound")
          .withArgs(nonExistentId);
      });

      it("should revert with PropertyNotActive when property is not Active", async function () {
        const { factory, syntiantToken, owner, propertyNFT, seller, investor1 } =
          await loadFixture(deployFullEcosystemFixture);

        // Create a second property that stays Pending (status 0)
        await propertyNFT.mintProperty(
          seller.address,
          "ipfs://pending",
          "Pending Property",
          "Nowhere",
          PROPERTY_TOTAL_VALUE,
          FUNDING_TARGET,
          MIN_INVESTMENT
        );
        const pendingPropertyId = 1n;
        // Create its token but do NOT set status to Active
        await factory.createPropertyToken(
          pendingPropertyId,
          "Pending Token",
          "PEND"
        );

        const investAmount = 100n * 10n ** 18n;
        await fundAndApprove(
          syntiantToken,
          owner,
          investor1,
          factory,
          investAmount
        );

        await expect(
          factory.connect(investor1).invest(pendingPropertyId, investAmount)
        )
          .to.be.revertedWithCustomError(factory, "PropertyNotActive")
          .withArgs(pendingPropertyId, 0); // status 0 = Pending
      });

      it("should revert with BelowMinInvestment when amount is too small", async function () {
        const { factory, syntiantToken, owner, investor1, propertyId } =
          await loadFixture(deployFullEcosystemFixture);

        const tooSmall = 5n * 10n ** 18n; // 5 SAT < MIN_INVESTMENT of 10 SAT
        await fundAndApprove(
          syntiantToken,
          owner,
          investor1,
          factory,
          tooSmall
        );

        await expect(
          factory.connect(investor1).invest(propertyId, tooSmall)
        )
          .to.be.revertedWithCustomError(factory, "BelowMinInvestment")
          .withArgs(tooSmall, MIN_INVESTMENT);
      });

      it("should revert with ExceedsFundingTarget when amount exceeds remaining", async function () {
        const { factory, syntiantToken, owner, investor1, investor2, propertyId } =
          await loadFixture(deployFullEcosystemFixture);

        // First investor takes 900 SAT of the 1000 SAT target
        const firstAmount = 900n * 10n ** 18n;
        await fundAndApprove(
          syntiantToken,
          owner,
          investor1,
          factory,
          firstAmount
        );
        await factory.connect(investor1).invest(propertyId, firstAmount);

        // Second investor tries 200 SAT, but only 100 SAT remains
        const tooMuch = 200n * 10n ** 18n;
        const remaining = 100n * 10n ** 18n;
        await fundAndApprove(
          syntiantToken,
          owner,
          investor2,
          factory,
          tooMuch
        );

        await expect(
          factory.connect(investor2).invest(propertyId, tooMuch)
        )
          .to.be.revertedWithCustomError(factory, "ExceedsFundingTarget")
          .withArgs(tooMuch, remaining);
      });
    });

    // =========================================================================
    // 5. Full funding flow
    // =========================================================================

    describe("Full funding", function () {
      async function fundAndApprove(
        syntiantToken: any,
        owner: any,
        investor: any,
        factory: any,
        amount: bigint
      ) {
        await syntiantToken.transfer(investor.address, amount);
        await syntiantToken
          .connect(investor)
          .approve(await factory.getAddress(), amount);
      }

      it("should update property status to Funded when fully funded in one investment", async function () {
        const { factory, syntiantToken, owner, investor1, propertyId, propertyNFT } =
          await loadFixture(deployFullEcosystemFixture);

        const fullAmount = FUNDING_TARGET; // 1000 SAT
        await fundAndApprove(
          syntiantToken,
          owner,
          investor1,
          factory,
          fullAmount
        );

        await factory.connect(investor1).invest(propertyId, fullAmount);

        // Property status should now be 2 (Funded)
        expect(await propertyNFT.getPropertyStatus(propertyId)).to.equal(2);
      });

      it("should update property status to Funded when fully funded across multiple investments", async function () {
        const {
          factory,
          syntiantToken,
          owner,
          investor1,
          investor2,
          propertyId,
          propertyNFT,
        } = await loadFixture(deployFullEcosystemFixture);

        const firstAmount = 600n * 10n ** 18n;
        const secondAmount = 400n * 10n ** 18n;

        await fundAndApprove(
          syntiantToken,
          owner,
          investor1,
          factory,
          firstAmount
        );
        await fundAndApprove(
          syntiantToken,
          owner,
          investor2,
          factory,
          secondAmount
        );

        await factory.connect(investor1).invest(propertyId, firstAmount);

        // After first investment, property should still be Active
        expect(await propertyNFT.getPropertyStatus(propertyId)).to.equal(1);

        await factory.connect(investor2).invest(propertyId, secondAmount);

        // After second investment, property should be Funded
        expect(await propertyNFT.getPropertyStatus(propertyId)).to.equal(2);
      });

      it("should mint exactly 1000 total shares when fully funded", async function () {
        const {
          factory,
          syntiantToken,
          owner,
          investor1,
          propertyId,
          propertyToken,
        } = await loadFixture(deployFullEcosystemFixture);

        await fundAndApprove(
          syntiantToken,
          owner,
          investor1,
          factory,
          FUNDING_TARGET
        );

        await factory.connect(investor1).invest(propertyId, FUNDING_TARGET);

        expect(await propertyToken.totalSupply()).to.equal(TOTAL_SHARES);
      });

      it("should reject further investment after fully funded (status becomes Funded)", async function () {
        const {
          factory,
          syntiantToken,
          owner,
          investor1,
          investor2,
          propertyId,
        } = await loadFixture(deployFullEcosystemFixture);

        // Fully fund the property
        await fundAndApprove(
          syntiantToken,
          owner,
          investor1,
          factory,
          FUNDING_TARGET
        );
        await factory.connect(investor1).invest(propertyId, FUNDING_TARGET);

        // Try investing after it's funded
        const postFundAmount = MIN_INVESTMENT;
        await fundAndApprove(
          syntiantToken,
          owner,
          investor2,
          factory,
          postFundAmount
        );

        await expect(
          factory.connect(investor2).invest(propertyId, postFundAmount)
        )
          .to.be.revertedWithCustomError(factory, "PropertyNotActive")
          .withArgs(propertyId, 2); // status 2 = Funded
      });
    });

    // =========================================================================
    // 6. Multiple investors
    // =========================================================================

    describe("Multiple investors", function () {
      async function fundAndApprove(
        syntiantToken: any,
        owner: any,
        investor: any,
        factory: any,
        amount: bigint
      ) {
        await syntiantToken.transfer(investor.address, amount);
        await syntiantToken
          .connect(investor)
          .approve(await factory.getAddress(), amount);
      }

      it("should correctly allocate shares to multiple investors", async function () {
        const {
          factory,
          syntiantToken,
          owner,
          investor1,
          investor2,
          investor3,
          propertyId,
          propertyToken,
        } = await loadFixture(deployFullEcosystemFixture);

        // investor1: 300 SAT => 300 shares
        // investor2: 500 SAT => 500 shares
        // investor3: 200 SAT => 200 shares
        const amount1 = 300n * 10n ** 18n;
        const amount2 = 500n * 10n ** 18n;
        const amount3 = 200n * 10n ** 18n;

        await fundAndApprove(syntiantToken, owner, investor1, factory, amount1);
        await fundAndApprove(syntiantToken, owner, investor2, factory, amount2);
        await fundAndApprove(syntiantToken, owner, investor3, factory, amount3);

        await factory.connect(investor1).invest(propertyId, amount1);
        await factory.connect(investor2).invest(propertyId, amount2);
        await factory.connect(investor3).invest(propertyId, amount3);

        // Verify PropertyToken balances
        expect(await propertyToken.balanceOf(investor1.address)).to.equal(
          300n
        );
        expect(await propertyToken.balanceOf(investor2.address)).to.equal(
          500n
        );
        expect(await propertyToken.balanceOf(investor3.address)).to.equal(
          200n
        );

        // Verify investorShares mapping
        expect(
          await factory.getInvestorShares(propertyId, investor1.address)
        ).to.equal(300n);
        expect(
          await factory.getInvestorShares(propertyId, investor2.address)
        ).to.equal(500n);
        expect(
          await factory.getInvestorShares(propertyId, investor3.address)
        ).to.equal(200n);

        // Total invested should equal the full funding target
        expect(await factory.propertyInvestments(propertyId)).to.equal(
          FUNDING_TARGET
        );

        // Total supply should equal 1000
        expect(await propertyToken.totalSupply()).to.equal(TOTAL_SHARES);
      });

      it("should record separate investment records per investor", async function () {
        const {
          factory,
          syntiantToken,
          owner,
          investor1,
          investor2,
          propertyId,
        } = await loadFixture(deployFullEcosystemFixture);

        const amount1 = 100n * 10n ** 18n;
        const amount2 = 200n * 10n ** 18n;

        await fundAndApprove(syntiantToken, owner, investor1, factory, amount1);
        await fundAndApprove(syntiantToken, owner, investor2, factory, amount2);

        await factory.connect(investor1).invest(propertyId, amount1);
        await factory.connect(investor2).invest(propertyId, amount2);

        const records = await factory.getPropertyInvestments(propertyId);
        expect(records.length).to.equal(2);

        // First record
        expect(records[0].investor).to.equal(investor1.address);
        expect(records[0].amount).to.equal(amount1);
        expect(records[0].shares).to.equal(100n);

        // Second record
        expect(records[1].investor).to.equal(investor2.address);
        expect(records[1].amount).to.equal(amount2);
        expect(records[1].shares).to.equal(200n);
      });
    });

    // =========================================================================
    // 7. View functions
    // =========================================================================

    describe("View functions", function () {
      async function fundAndApprove(
        syntiantToken: any,
        owner: any,
        investor: any,
        factory: any,
        amount: bigint
      ) {
        await syntiantToken.transfer(investor.address, amount);
        await syntiantToken
          .connect(investor)
          .approve(await factory.getAddress(), amount);
      }

      describe("getPropertyToken", function () {
        it("should return the correct PropertyToken address for a valid propertyId", async function () {
          const { factory, propertyId, propertyTokenAddress } =
            await loadFixture(deployFullEcosystemFixture);
          expect(await factory.getPropertyToken(propertyId)).to.equal(
            propertyTokenAddress
          );
        });

        it("should return address(0) for a non-existent propertyId", async function () {
          const { factory } = await loadFixture(deployFullEcosystemFixture);
          expect(await factory.getPropertyToken(999n)).to.equal(
            ethers.ZeroAddress
          );
        });
      });

      describe("getInvestorShares", function () {
        it("should return 0 for an investor who has not invested", async function () {
          const { factory, stranger, propertyId } = await loadFixture(
            deployFullEcosystemFixture
          );
          expect(
            await factory.getInvestorShares(propertyId, stranger.address)
          ).to.equal(0n);
        });

        it("should return the correct share count after investment", async function () {
          const { factory, syntiantToken, owner, investor1, propertyId } =
            await loadFixture(deployFullEcosystemFixture);

          const amount = 250n * 10n ** 18n; // 250 SAT => 250 shares
          await fundAndApprove(
            syntiantToken,
            owner,
            investor1,
            factory,
            amount
          );
          await factory.connect(investor1).invest(propertyId, amount);

          expect(
            await factory.getInvestorShares(propertyId, investor1.address)
          ).to.equal(250n);
        });
      });

      describe("getPropertyInvestments", function () {
        it("should return an empty array when no investments have been made", async function () {
          const { factory, propertyId } = await loadFixture(
            deployFullEcosystemFixture
          );
          const records = await factory.getPropertyInvestments(propertyId);
          expect(records.length).to.equal(0);
        });

        it("should return all investment records in chronological order", async function () {
          const {
            factory,
            syntiantToken,
            owner,
            investor1,
            investor2,
            propertyId,
          } = await loadFixture(deployFullEcosystemFixture);

          const amount1 = 100n * 10n ** 18n;
          const amount2 = 150n * 10n ** 18n;

          await fundAndApprove(
            syntiantToken,
            owner,
            investor1,
            factory,
            amount1
          );
          await fundAndApprove(
            syntiantToken,
            owner,
            investor2,
            factory,
            amount2
          );

          await factory.connect(investor1).invest(propertyId, amount1);
          await factory.connect(investor2).invest(propertyId, amount2);

          const records = await factory.getPropertyInvestments(propertyId);
          expect(records.length).to.equal(2);

          // Record 0
          expect(records[0].investor).to.equal(investor1.address);
          expect(records[0].amount).to.equal(amount1);
          expect(records[0].shares).to.equal(100n);
          expect(records[0].timestamp).to.be.greaterThan(0n);

          // Record 1
          expect(records[1].investor).to.equal(investor2.address);
          expect(records[1].amount).to.equal(amount2);
          expect(records[1].shares).to.equal(150n);
          expect(records[1].timestamp).to.be.greaterThanOrEqual(
            records[0].timestamp
          );
        });
      });
    });
  });
});
