// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title PropertyNFT
 * @notice Each real estate property listed on the Syntiant Atlas platform is
 *         represented as an ERC-721 NFT. The token carries on-chain metadata
 *         (title, location, valuation, funding parameters) and an off-chain
 *         URI for rich property details.
 * @dev Combines ERC721Enumerable for full token enumeration, ERC721URIStorage
 *      for per-token metadata URIs, and ReentrancyGuard to protect the mint
 *      path against re-entrancy via `_safeMint`.
 */
contract PropertyNFT is
    ERC721,
    ERC721Enumerable,
    ERC721URIStorage,
    Ownable,
    ReentrancyGuard
{
    // -------------------------------------------------------------------
    //  Types
    // -------------------------------------------------------------------

    /// @notice Lifecycle status of a listed property.
    enum PropertyStatus {
        Pending,
        Active,
        Funded,
        Closed
    }

    /// @notice On-chain metadata attached to every property NFT.
    struct PropertyInfo {
        string title;
        string location;
        uint256 totalValue;
        uint256 fundingTarget;
        uint256 minInvestment;
        PropertyStatus status;
        address seller;
        uint256 createdAt;
    }

    // -------------------------------------------------------------------
    //  State
    // -------------------------------------------------------------------

    /// @notice tokenId => property metadata
    mapping(uint256 => PropertyInfo) private _propertyInfo;

    /// @dev Auto-incrementing counter for the next tokenId to mint.
    uint256 private _nextTokenId;

    /// @notice Addresses authorised to call status-update functions (e.g. the factory).
    mapping(address => bool) public authorizedContracts;

    // -------------------------------------------------------------------
    //  Events
    // -------------------------------------------------------------------

    event PropertyMinted(
        uint256 indexed tokenId,
        address indexed seller,
        uint256 totalValue
    );

    event PropertyStatusUpdated(
        uint256 indexed tokenId,
        PropertyStatus oldStatus,
        PropertyStatus newStatus
    );

    event AuthorizedContractAdded(address indexed contractAddress);
    event AuthorizedContractRemoved(address indexed contractAddress);

    // -------------------------------------------------------------------
    //  Modifiers
    // -------------------------------------------------------------------

    /// @dev Allows calls from the owner OR any authorised contract.
    modifier onlyOwnerOrAuthorized() {
        require(
            msg.sender == owner() || authorizedContracts[msg.sender],
            "PropertyNFT: not owner or authorized"
        );
        _;
    }

    // -------------------------------------------------------------------
    //  Constructor
    // -------------------------------------------------------------------

    /**
     * @param initialOwner Address that becomes the contract owner (platform
     *        operator) and is allowed to mint properties and update statuses.
     */
    constructor(
        address initialOwner
    ) ERC721("Syntiant Atlas Property", "SAP") Ownable(initialOwner) {}

    // -------------------------------------------------------------------
    //  External / Public functions
    // -------------------------------------------------------------------

    /**
     * @notice Mint a new property NFT and record its on-chain metadata.
     * @param seller        Address of the property seller (receives the NFT).
     * @param uri           Off-chain metadata URI (IPFS / HTTPS).
     * @param title         Human-readable property title.
     * @param location      Human-readable location string.
     * @param totalValue    Appraised total value of the property (wei).
     * @param fundingTarget Amount of funding required to close the deal (wei).
     * @param minInvestment Minimum investment per participant (wei).
     * @return tokenId      The newly minted token identifier.
     */
    function mintProperty(
        address seller,
        string memory uri,
        string memory title,
        string memory location,
        uint256 totalValue,
        uint256 fundingTarget,
        uint256 minInvestment
    ) external onlyOwner nonReentrant returns (uint256) {
        require(seller != address(0), "PropertyNFT: zero address seller");
        require(totalValue > 0, "PropertyNFT: zero total value");
        require(fundingTarget > 0, "PropertyNFT: zero funding target");
        require(
            minInvestment > 0 && minInvestment <= fundingTarget,
            "PropertyNFT: invalid min investment"
        );

        uint256 tokenId = _nextTokenId++;

        _safeMint(seller, tokenId);
        _setTokenURI(tokenId, uri);

        _propertyInfo[tokenId] = PropertyInfo({
            title: title,
            location: location,
            totalValue: totalValue,
            fundingTarget: fundingTarget,
            minInvestment: minInvestment,
            status: PropertyStatus.Pending,
            seller: seller,
            createdAt: block.timestamp
        });

        emit PropertyMinted(tokenId, seller, totalValue);

        return tokenId;
    }

    /**
     * @notice Transition a property to a new lifecycle status.
     * @param tokenId   The property token to update.
     * @param newStatus The target status.
     */
    function updateStatus(
        uint256 tokenId,
        PropertyStatus newStatus
    ) external onlyOwnerOrAuthorized {
        require(
            _ownerOf(tokenId) != address(0),
            "PropertyNFT: nonexistent token"
        );

        PropertyStatus oldStatus = _propertyInfo[tokenId].status;
        require(oldStatus != newStatus, "PropertyNFT: status unchanged");

        _propertyInfo[tokenId].status = newStatus;

        emit PropertyStatusUpdated(tokenId, oldStatus, newStatus);
    }

    /**
     * @notice Retrieve the full on-chain metadata for a property.
     * @param tokenId The property token to query.
     * @return info   The PropertyInfo struct.
     */
    function getPropertyInfo(
        uint256 tokenId
    ) external view returns (PropertyInfo memory) {
        require(
            _ownerOf(tokenId) != address(0),
            "PropertyNFT: nonexistent token"
        );
        return _propertyInfo[tokenId];
    }

    // -------------------------------------------------------------------
    //  Authorization management
    // -------------------------------------------------------------------

    /**
     * @notice Grant a contract address permission to update property statuses.
     * @param contractAddress Address to authorise (e.g. PropertyTokenFactory).
     */
    function addAuthorizedContract(address contractAddress) external onlyOwner {
        require(contractAddress != address(0), "PropertyNFT: zero address");
        authorizedContracts[contractAddress] = true;
        emit AuthorizedContractAdded(contractAddress);
    }

    /**
     * @notice Revoke a previously authorised contract.
     * @param contractAddress Address to de-authorise.
     */
    function removeAuthorizedContract(address contractAddress) external onlyOwner {
        authorizedContracts[contractAddress] = false;
        emit AuthorizedContractRemoved(contractAddress);
    }

    /**
     * @notice Get the status of a property as uint8 (for cross-contract calls).
     */
    function getPropertyStatus(uint256 tokenId) external view returns (uint8) {
        require(_ownerOf(tokenId) != address(0), "PropertyNFT: nonexistent token");
        return uint8(_propertyInfo[tokenId].status);
    }

    /**
     * @notice Get the funding target of a property.
     */
    function getFundingTarget(uint256 tokenId) external view returns (uint256) {
        require(_ownerOf(tokenId) != address(0), "PropertyNFT: nonexistent token");
        return _propertyInfo[tokenId].fundingTarget;
    }

    /**
     * @notice Get the minimum investment of a property.
     */
    function getMinInvestment(uint256 tokenId) external view returns (uint256) {
        require(_ownerOf(tokenId) != address(0), "PropertyNFT: nonexistent token");
        return _propertyInfo[tokenId].minInvestment;
    }

    /**
     * @notice Update property status via uint8 (for cross-contract calls).
     */
    function updatePropertyStatus(uint256 tokenId, uint8 newStatus) external onlyOwnerOrAuthorized {
        require(_ownerOf(tokenId) != address(0), "PropertyNFT: nonexistent token");
        PropertyStatus status = PropertyStatus(newStatus);
        PropertyStatus oldStatus = _propertyInfo[tokenId].status;
        require(oldStatus != status, "PropertyNFT: status unchanged");
        _propertyInfo[tokenId].status = status;
        emit PropertyStatusUpdated(tokenId, oldStatus, status);
    }

    // -------------------------------------------------------------------
    //  Required overrides
    // -------------------------------------------------------------------

    /// @dev Resolves ERC721 + ERC721Enumerable `_update` conflict.
    function _update(
        address to,
        uint256 tokenId,
        address auth
    ) internal override(ERC721, ERC721Enumerable) returns (address) {
        return super._update(to, tokenId, auth);
    }

    /// @dev Resolves ERC721 + ERC721Enumerable `_increaseBalance` conflict.
    function _increaseBalance(
        address account,
        uint128 value
    ) internal override(ERC721, ERC721Enumerable) {
        super._increaseBalance(account, value);
    }

    /// @dev Resolves ERC721 + ERC721URIStorage `tokenURI` conflict.
    function tokenURI(
        uint256 tokenId
    ) public view override(ERC721, ERC721URIStorage) returns (string memory) {
        return super.tokenURI(tokenId);
    }

    /// @dev Resolves ERC721 + ERC721Enumerable + ERC721URIStorage `supportsInterface` conflict.
    function supportsInterface(
        bytes4 interfaceId
    )
        public
        view
        override(ERC721, ERC721Enumerable, ERC721URIStorage)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
