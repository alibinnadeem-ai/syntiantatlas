// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title Marketplace
 * @author SYNTIANT Technologies
 * @notice Secondary market P2P trading contract for the Syntiant Atlas platform.
 *         Allows investors to trade fractional property tokens (PropertyToken ERC-20s)
 *         with each other, using SyntiantToken (SAT) as the payment token.
 * @dev Tokens are held in escrow by the contract while a listing is active.
 *      A configurable platform fee is deducted from each sale.
 */
contract Marketplace is Ownable, ReentrancyGuard, Pausable {
    using SafeERC20 for IERC20;

    // ───────────────────────────── Types ─────────────────────────────

    struct Listing {
        uint256 id;
        address seller;
        address propertyToken;
        uint256 amount;
        uint256 pricePerToken;
        bool active;
        uint256 createdAt;
    }

    // ───────────────────────────── State ─────────────────────────────

    /// @notice SyntiantToken (SAT) used as the payment currency.
    IERC20 public immutable syntiantToken;

    /// @notice Platform fee in basis points (1 bp = 0.01%).
    uint256 public platformFee;

    /// @notice Maximum allowed platform fee (10%).
    uint256 public constant MAX_FEE = 1000;

    /// @notice Basis-point denominator.
    uint256 public constant FEE_DENOMINATOR = 10_000;

    /// @notice Address that receives collected fees.
    address public feeRecipient;

    /// @notice Auto-incrementing listing counter (next id).
    uint256 public nextListingId;

    /// @notice Listing id => Listing data.
    mapping(uint256 => Listing) public listings;

    /// @notice Seller address => array of listing ids created by that seller.
    mapping(address => uint256[]) public sellerListings;

    // ───────────────────────────── Events ────────────────────────────

    event ListingCreated(
        uint256 indexed listingId,
        address indexed seller,
        address indexed propertyToken,
        uint256 amount,
        uint256 pricePerToken
    );

    event ListingCancelled(uint256 indexed listingId, address indexed seller);

    event ListingSold(
        uint256 indexed listingId,
        address indexed buyer,
        uint256 amount,
        uint256 totalCost,
        uint256 fee
    );

    event PlatformFeeUpdated(uint256 oldFee, uint256 newFee);

    event FeeRecipientUpdated(address oldRecipient, address newRecipient);

    // ───────────────────────────── Errors ────────────────────────────

    error InvalidAddress();
    error InvalidAmount();
    error InvalidPrice();
    error FeeTooHigh();
    error ListingNotActive();
    error NotListingSeller();
    error InsufficientListingAmount();

    // ─────────────────────────── Constructor ─────────────────────────

    /**
     * @param _syntiantToken Address of the SyntiantToken (SAT) ERC-20 contract.
     * @param _owner         Initial owner / admin of the marketplace.
     */
    constructor(
        address _syntiantToken,
        address _owner
    ) Ownable(_owner) {
        if (_syntiantToken == address(0)) revert InvalidAddress();
        if (_owner == address(0)) revert InvalidAddress();

        syntiantToken = IERC20(_syntiantToken);
        platformFee = 250; // 2.5 %
        feeRecipient = _owner;
    }

    // ──────────────────────── External Functions ─────────────────────

    /**
     * @notice Create a new listing to sell PropertyToken for SAT.
     * @dev    Transfers `amount` of `propertyToken` from the caller into escrow.
     * @param propertyToken Address of the PropertyToken ERC-20 contract.
     * @param amount        Number of tokens to sell.
     * @param pricePerToken Price in SAT (wei) per single token.
     */
    function createListing(
        address propertyToken,
        uint256 amount,
        uint256 pricePerToken
    ) external nonReentrant whenNotPaused {
        if (propertyToken == address(0)) revert InvalidAddress();
        if (amount == 0) revert InvalidAmount();
        if (pricePerToken == 0) revert InvalidPrice();

        // Transfer property tokens into escrow
        IERC20(propertyToken).safeTransferFrom(msg.sender, address(this), amount);

        uint256 listingId = nextListingId++;

        listings[listingId] = Listing({
            id: listingId,
            seller: msg.sender,
            propertyToken: propertyToken,
            amount: amount,
            pricePerToken: pricePerToken,
            active: true,
            createdAt: block.timestamp
        });

        sellerListings[msg.sender].push(listingId);

        emit ListingCreated(listingId, msg.sender, propertyToken, amount, pricePerToken);
    }

    /**
     * @notice Cancel an active listing and return escrowed tokens to the seller.
     * @param listingId ID of the listing to cancel.
     */
    function cancelListing(uint256 listingId) external nonReentrant {
        Listing storage listing = listings[listingId];

        if (!listing.active) revert ListingNotActive();
        if (listing.seller != msg.sender) revert NotListingSeller();

        listing.active = false;

        // Return escrowed property tokens to the seller
        IERC20(listing.propertyToken).safeTransfer(msg.sender, listing.amount);

        emit ListingCancelled(listingId, msg.sender);
    }

    /**
     * @notice Buy (partially or fully) from an active listing.
     * @dev    The buyer must have approved this contract for the required SAT amount.
     *         Platform fee is deducted from the total cost and sent to `feeRecipient`.
     * @param listingId ID of the listing to buy from.
     * @param amount    Number of property tokens to purchase.
     */
    function buyListing(
        uint256 listingId,
        uint256 amount
    ) external nonReentrant whenNotPaused {
        Listing storage listing = listings[listingId];

        if (!listing.active) revert ListingNotActive();
        if (amount == 0) revert InvalidAmount();
        if (amount > listing.amount) revert InsufficientListingAmount();

        uint256 totalCost = amount * listing.pricePerToken;
        uint256 fee = (totalCost * platformFee) / FEE_DENOMINATOR;
        uint256 sellerProceeds = totalCost - fee;

        // Update listing state before external calls (CEI pattern)
        listing.amount -= amount;
        if (listing.amount == 0) {
            listing.active = false;
        }

        // Transfer SAT from buyer: proceeds to seller, fee to feeRecipient
        syntiantToken.safeTransferFrom(msg.sender, listing.seller, sellerProceeds);
        if (fee > 0) {
            syntiantToken.safeTransferFrom(msg.sender, feeRecipient, fee);
        }

        // Transfer property tokens from escrow to buyer
        IERC20(listing.propertyToken).safeTransfer(msg.sender, amount);

        emit ListingSold(listingId, msg.sender, amount, totalCost, fee);
    }

    // ───────────────────────── Admin Functions ───────────────────────

    /**
     * @notice Update the platform fee.
     * @param newFee New fee in basis points (max 1000 = 10%).
     */
    function setFee(uint256 newFee) external onlyOwner {
        if (newFee > MAX_FEE) revert FeeTooHigh();

        uint256 oldFee = platformFee;
        platformFee = newFee;

        emit PlatformFeeUpdated(oldFee, newFee);
    }

    /**
     * @notice Update the fee recipient address.
     * @param newRecipient New address to receive platform fees.
     */
    function setFeeRecipient(address newRecipient) external onlyOwner {
        if (newRecipient == address(0)) revert InvalidAddress();

        address oldRecipient = feeRecipient;
        feeRecipient = newRecipient;

        emit FeeRecipientUpdated(oldRecipient, newRecipient);
    }

    /**
     * @notice Pause the marketplace (disables listing creation and purchases).
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @notice Unpause the marketplace.
     */
    function unpause() external onlyOwner {
        _unpause();
    }

    // ────────────────────────── View Functions ───────────────────────

    /**
     * @notice Retrieve a listing by id.
     * @param listingId ID of the listing.
     * @return The Listing struct.
     */
    function getActiveListing(uint256 listingId) external view returns (Listing memory) {
        return listings[listingId];
    }

    /**
     * @notice Retrieve all listing ids created by a given seller.
     * @param seller Address of the seller.
     * @return Array of listing ids.
     */
    function getSellerListings(address seller) external view returns (uint256[] memory) {
        return sellerListings[seller];
    }
}
