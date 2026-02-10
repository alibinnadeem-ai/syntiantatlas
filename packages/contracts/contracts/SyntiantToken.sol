// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Votes.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title SyntiantToken
 * @notice ERC-20 governance and utility token for the Syntiant Atlas platform.
 * @dev Combines ERC20Votes for on-chain governance snapshots, ERC20Permit for
 *      gasless approvals, ERC20Burnable for deflationary mechanics, and
 *      Pausable for emergency circuit-breaking. Total supply is hard-capped
 *      at 1 billion tokens.
 */
contract SyntiantToken is
    ERC20,
    ERC20Burnable,
    ERC20Permit,
    ERC20Votes,
    Ownable,
    Pausable
{
    /// @notice Absolute maximum supply: 1 billion tokens (18 decimals).
    uint256 public constant MAX_SUPPLY = 1_000_000_000 * 10 ** 18;

    /// @notice Tokens minted to the deployer at construction: 100 million.
    uint256 public constant INITIAL_SUPPLY = 100_000_000 * 10 ** 18;

    /**
     * @param initialOwner Address that receives the initial supply and becomes
     *        the contract owner (can mint, pause, and unpause).
     */
    constructor(
        address initialOwner
    )
        ERC20("Syntiant Atlas Token", "SAT")
        ERC20Permit("Syntiant Atlas Token")
        Ownable(initialOwner)
    {
        _mint(initialOwner, INITIAL_SUPPLY);
    }

    // -----------------------------------------------------------------------
    //  Owner-only actions
    // -----------------------------------------------------------------------

    /**
     * @notice Mint new tokens. Reverts if the resulting total supply would
     *         exceed MAX_SUPPLY.
     * @param to  Recipient of the newly minted tokens.
     * @param amount  Number of tokens to mint (in wei / 18-decimal units).
     */
    function mint(address to, uint256 amount) external onlyOwner {
        require(
            totalSupply() + amount <= MAX_SUPPLY,
            "SyntiantToken: cap exceeded"
        );
        _mint(to, amount);
    }

    /// @notice Pause all token transfers. Only callable by the owner.
    function pause() external onlyOwner {
        _pause();
    }

    /// @notice Unpause token transfers. Only callable by the owner.
    function unpause() external onlyOwner {
        _unpause();
    }

    // -----------------------------------------------------------------------
    //  Required overrides
    // -----------------------------------------------------------------------

    /**
     * @dev Unified hook for ERC20Votes checkpoint bookkeeping and Pausable
     *      transfer gating. Every mint, burn, and transfer flows through here.
     */
    function _update(
        address from,
        address to,
        uint256 value
    ) internal override(ERC20, ERC20Votes) whenNotPaused {
        super._update(from, to, value);
    }

    /**
     * @dev Both ERC20Permit and ERC20Votes inherit from Nonces; Solidity
     *      requires an explicit override to resolve the diamond.
     */
    function nonces(
        address owner
    ) public view override(ERC20Permit, Nonces) returns (uint256) {
        return super.nonces(owner);
    }
}
