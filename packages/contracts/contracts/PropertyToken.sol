// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {ERC20Burnable} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title PropertyToken
 * @author SYNTIANT Technologies
 * @notice ERC-20 token representing fractional shares of a single real estate property.
 * @dev Deployed by PropertyTokenFactory for each property. The factory becomes the
 *      owner and sole minting authority. Total supply is capped at `totalShares`.
 */
contract PropertyToken is ERC20, ERC20Burnable, Ownable {
    /// @notice The unique identifier of the property this token represents.
    uint256 public immutable propertyId;

    /// @notice The maximum number of fractional shares (tokens) that can ever exist.
    uint256 public immutable totalShares;

    /// @dev Thrown when a mint would exceed the maximum supply.
    error ExceedsMaxSupply(uint256 requested, uint256 available);

    /**
     * @param _name        ERC-20 token name  (e.g. "Syntiant Property #42")
     * @param _symbol      ERC-20 token symbol (e.g. "SP42")
     * @param _propertyId  Unique property identifier matching the platform database
     * @param _totalShares Maximum supply cap (fractional shares for this property)
     * @param _owner       Address that will own this token (the factory contract)
     */
    constructor(
        string memory _name,
        string memory _symbol,
        uint256 _propertyId,
        uint256 _totalShares,
        address _owner
    ) ERC20(_name, _symbol) Ownable(_owner) {
        propertyId = _propertyId;
        totalShares = _totalShares;
    }

    /**
     * @notice Fractional shares use 0 decimals — each token is one whole share.
     */
    function decimals() public pure override returns (uint8) {
        return 0;
    }

    /**
     * @notice Mint new fractional shares to a given address.
     * @dev Only the owner (factory) can call this. Reverts if minting would
     *      push totalSupply beyond `totalShares`.
     * @param to     Recipient of the newly minted tokens.
     * @param amount Number of tokens to mint.
     */
    function mint(address to, uint256 amount) external onlyOwner {
        uint256 available = totalShares - totalSupply();
        if (amount > available) {
            revert ExceedsMaxSupply(amount, available);
        }
        _mint(to, amount);
    }
}
