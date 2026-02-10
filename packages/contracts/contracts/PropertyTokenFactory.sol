// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

import {PropertyToken} from "./PropertyToken.sol";

// ---------------------------------------------------------------------------
// Minimal interfaces for platform contracts that the factory interacts with.
// These allow the factory to validate property state and transfer payments
// without importing full implementations.
// ---------------------------------------------------------------------------

/**
 * @dev Minimal interface for the PropertyNFT contract.
 *      PropertyStatus enum values:
 *        0 = Pending, 1 = Active, 2 = Funded, 3 = Closed
 */
interface IPropertyNFT {
    /// @notice Returns the on-chain status of the given property.
    function getPropertyStatus(uint256 propertyId) external view returns (uint8);

    /// @notice Returns the funding target (in SAT wei) for the given property.
    function getFundingTarget(uint256 propertyId) external view returns (uint256);

    /// @notice Returns the minimum investment amount (in SAT wei) for the given property.
    function getMinInvestment(uint256 propertyId) external view returns (uint256);

    /// @notice Updates property status. Only callable by authorised contracts.
    function updatePropertyStatus(uint256 propertyId, uint8 newStatus) external;
}

/**
 * @title PropertyTokenFactory
 * @author SYNTIANT Technologies
 * @notice Factory contract that creates and manages fractional ERC-20 tokens for
 *         each property listed on the Syntiant Atlas platform, and processes
 *         investor contributions.
 */
contract PropertyTokenFactory is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    // -----------------------------------------------------------------------
    // Constants
    // -----------------------------------------------------------------------

    /// @notice Each property is divided into exactly 1 000 fractional shares.
    uint256 public constant TOTAL_SHARES_PER_PROPERTY = 1000;

    /// @dev PropertyNFT status codes used throughout this contract.
    uint8 private constant STATUS_ACTIVE  = 1;
    uint8 private constant STATUS_FUNDED  = 2;

    // -----------------------------------------------------------------------
    // State
    // -----------------------------------------------------------------------

    /// @notice The SAT (SyntiantToken) ERC-20 used for investment payments.
    IERC20 public immutable syntiantToken;

    /// @notice The PropertyNFT contract used for on-chain property validation.
    IPropertyNFT public immutable propertyNFT;

    /// @notice Mapping from propertyId to its deployed PropertyToken address.
    mapping(uint256 => address) public propertyTokens;

    /// @notice Mapping from propertyId to the total SAT amount invested so far.
    mapping(uint256 => uint256) public propertyInvestments;

    /// @notice Investment record for a single contribution.
    struct InvestmentRecord {
        address investor;
        uint256 amount;
        uint256 shares;
        uint256 timestamp;
    }

    /// @notice All investment records for a given property, in chronological order.
    mapping(uint256 => InvestmentRecord[]) private _investments;

    /// @notice Shares held by each investor in a given property.
    mapping(uint256 => mapping(address => uint256)) public investorShares;

    // -----------------------------------------------------------------------
    // Events
    // -----------------------------------------------------------------------

    /// @notice Emitted when a new PropertyToken is deployed for a property.
    event PropertyTokenCreated(
        uint256 indexed propertyId,
        address indexed tokenAddress
    );

    /// @notice Emitted when an investor contributes SAT tokens to a property.
    event InvestmentMade(
        uint256 indexed propertyId,
        address indexed investor,
        uint256 amount,
        uint256 shares
    );

    // -----------------------------------------------------------------------
    // Errors
    // -----------------------------------------------------------------------

    /// @dev The property already has a token deployed.
    error PropertyTokenAlreadyExists(uint256 propertyId);

    /// @dev No PropertyToken has been created for this property yet.
    error PropertyTokenNotFound(uint256 propertyId);

    /// @dev The property is not in the Active status required for investment.
    error PropertyNotActive(uint256 propertyId, uint8 currentStatus);

    /// @dev The investment amount is below the property's minimum.
    error BelowMinInvestment(uint256 amount, uint256 minInvestment);

    /// @dev The investment would exceed the property's funding target.
    error ExceedsFundingTarget(uint256 amount, uint256 remaining);

    // -----------------------------------------------------------------------
    // Constructor
    // -----------------------------------------------------------------------

    /**
     * @param _syntiantToken Address of the SAT ERC-20 token contract.
     * @param _propertyNFT   Address of the PropertyNFT contract.
     * @param _owner         Admin address that will own this factory.
     */
    constructor(
        address _syntiantToken,
        address _propertyNFT,
        address _owner
    ) Ownable(_owner) {
        syntiantToken = IERC20(_syntiantToken);
        propertyNFT   = IPropertyNFT(_propertyNFT);
    }

    // -----------------------------------------------------------------------
    // Admin functions
    // -----------------------------------------------------------------------

    /**
     * @notice Deploy a new PropertyToken contract for the given property.
     * @dev Only the factory owner (platform admin) can create property tokens.
     *      Reverts if a token already exists for this propertyId.
     * @param propertyId Unique identifier of the property.
     * @param name       ERC-20 token name.
     * @param symbol     ERC-20 token symbol.
     */
    function createPropertyToken(
        uint256 propertyId,
        string memory name,
        string memory symbol
    ) external onlyOwner {
        if (propertyTokens[propertyId] != address(0)) {
            revert PropertyTokenAlreadyExists(propertyId);
        }

        PropertyToken token = new PropertyToken(
            name,
            symbol,
            propertyId,
            TOTAL_SHARES_PER_PROPERTY,
            address(this) // factory is the owner / minter
        );

        propertyTokens[propertyId] = address(token);

        emit PropertyTokenCreated(propertyId, address(token));
    }

    // -----------------------------------------------------------------------
    // Investment
    // -----------------------------------------------------------------------

    /**
     * @notice Invest SAT tokens into a property in exchange for fractional shares.
     * @dev Transfers `amount` SAT from the caller to this contract, calculates
     *      the proportional number of shares, mints them to the investor, and
     *      records the investment. If the property becomes fully funded the
     *      PropertyNFT status is updated to Funded.
     *
     *      Requirements:
     *        - A PropertyToken must exist for `propertyId`.
     *        - The property must be in Active status on the PropertyNFT contract.
     *        - `amount` must be >= the property's minimum investment.
     *        - `amount` must not push total invested above the funding target.
     *        - Caller must have approved this contract to spend >= `amount` SAT.
     *
     * @param propertyId The property to invest in.
     * @param amount     The SAT token amount to invest (in wei).
     */
    function invest(uint256 propertyId, uint256 amount) external nonReentrant {
        // --- Validate token exists ---
        address tokenAddress = propertyTokens[propertyId];
        if (tokenAddress == address(0)) {
            revert PropertyTokenNotFound(propertyId);
        }

        // --- Validate property status ---
        uint8 status = propertyNFT.getPropertyStatus(propertyId);
        if (status != STATUS_ACTIVE) {
            revert PropertyNotActive(propertyId, status);
        }

        // --- Validate minimum investment ---
        uint256 minInvestment = propertyNFT.getMinInvestment(propertyId);
        if (amount < minInvestment) {
            revert BelowMinInvestment(amount, minInvestment);
        }

        // --- Validate funding cap ---
        uint256 fundingTarget = propertyNFT.getFundingTarget(propertyId);
        uint256 currentInvested = propertyInvestments[propertyId];
        uint256 remaining = fundingTarget - currentInvested;
        if (amount > remaining) {
            revert ExceedsFundingTarget(amount, remaining);
        }

        // --- Transfer SAT from investor to this contract ---
        syntiantToken.safeTransferFrom(msg.sender, address(this), amount);

        // --- Calculate shares ---
        uint256 shares = (amount * TOTAL_SHARES_PER_PROPERTY) / fundingTarget;

        // --- Mint property tokens to investor ---
        PropertyToken(tokenAddress).mint(msg.sender, shares);

        // --- Record investment ---
        propertyInvestments[propertyId] += amount;
        investorShares[propertyId][msg.sender] += shares;

        _investments[propertyId].push(
            InvestmentRecord({
                investor: msg.sender,
                amount: amount,
                shares: shares,
                timestamp: block.timestamp
            })
        );

        emit InvestmentMade(propertyId, msg.sender, amount, shares);

        // --- If fully funded, update property status ---
        if (propertyInvestments[propertyId] >= fundingTarget) {
            propertyNFT.updatePropertyStatus(propertyId, STATUS_FUNDED);
        }
    }

    // -----------------------------------------------------------------------
    // View helpers
    // -----------------------------------------------------------------------

    /**
     * @notice Get the PropertyToken address for a given property.
     * @param propertyId The property identifier.
     * @return The deployed PropertyToken contract address (address(0) if none).
     */
    function getPropertyToken(uint256 propertyId) external view returns (address) {
        return propertyTokens[propertyId];
    }

    /**
     * @notice Get the number of fractional shares an investor holds in a property.
     * @param propertyId The property identifier.
     * @param investor   The investor's address.
     * @return The number of shares held.
     */
    function getInvestorShares(
        uint256 propertyId,
        address investor
    ) external view returns (uint256) {
        return investorShares[propertyId][investor];
    }

    /**
     * @notice Get the full investment history for a property.
     * @param propertyId The property identifier.
     * @return An array of InvestmentRecord structs in chronological order.
     */
    function getPropertyInvestments(
        uint256 propertyId
    ) external view returns (InvestmentRecord[] memory) {
        return _investments[propertyId];
    }
}
