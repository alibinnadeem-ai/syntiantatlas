// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title IPropertyTokenFactory
 * @notice Minimal interface for the PropertyTokenFactory contract used to
 *         resolve the PropertyToken address for a given property id.
 */
interface IPropertyTokenFactory {
    function propertyTokens(uint256 propertyId) external view returns (address);
}

/**
 * @title GovernanceDAO
 * @author SYNTIANT Technologies
 * @notice DAO voting contract for the Syntiant Atlas platform.
 *         Property token holders can create and vote on proposals that affect
 *         their property (rent changes, repairs, selling decisions, etc.).
 * @dev    Voting weight is determined by the voter's PropertyToken balance at
 *         the time they cast their vote (snapshot-less, balance-based).
 */
contract GovernanceDAO is Ownable, ReentrancyGuard {
    // ───────────────────────────── Types ─────────────────────────────

    enum VoteType {
        For,
        Against
    }

    struct Proposal {
        uint256 id;
        uint256 propertyId;
        address proposer;
        string title;
        string description;
        uint256 forVotes;
        uint256 againstVotes;
        uint256 startTime;
        uint256 endTime;
        bool executed;
        bool cancelled;
    }

    // ───────────────────────────── State ─────────────────────────────

    /// @notice Reference to the PropertyTokenFactory for resolving token addresses.
    IPropertyTokenFactory public immutable propertyTokenFactory;

    /// @notice Auto-incrementing proposal counter (next id).
    uint256 public nextProposalId;

    /// @notice Minimum number of tokens a proposer must hold to create a proposal.
    /// @dev    Default: 10 tokens (1% of 1000 total shares). PropertyToken uses 0 decimals.
    uint256 public proposalThreshold = 10;

    /// @notice Duration of the voting window in seconds.
    /// @dev    Default: 7 days.
    uint256 public votingPeriod = 7 days;

    /// @notice Minimum total votes (for + against) required for a proposal to be valid.
    /// @dev    Default: 200 tokens (20% of 1000 total shares). PropertyToken uses 0 decimals.
    uint256 public quorum = 200;

    /// @notice Minimum allowed voting period.
    uint256 public constant MIN_VOTING_PERIOD = 1 days;

    /// @notice Maximum allowed voting period.
    uint256 public constant MAX_VOTING_PERIOD = 30 days;

    /// @notice Proposal id => Proposal data.
    mapping(uint256 => Proposal) public proposals;

    /// @notice Property id => array of proposal ids for that property.
    mapping(uint256 => uint256[]) public propertyProposals;

    /// @notice Proposal id => voter address => whether they have voted.
    mapping(uint256 => mapping(address => bool)) public hasVoted;

    /// @notice Proposal id => voter address => vote weight used.
    mapping(uint256 => mapping(address => uint256)) public voterWeight;

    // ───────────────────────────── Events ────────────────────────────

    event ProposalCreated(
        uint256 indexed proposalId,
        uint256 indexed propertyId,
        address indexed proposer,
        string title,
        uint256 startTime,
        uint256 endTime
    );

    event Voted(
        uint256 indexed proposalId,
        address indexed voter,
        VoteType voteType,
        uint256 weight
    );

    event ProposalExecuted(uint256 indexed proposalId);

    event ProposalCancelled(uint256 indexed proposalId);

    event VotingPeriodUpdated(uint256 oldPeriod, uint256 newPeriod);

    event QuorumUpdated(uint256 oldQuorum, uint256 newQuorum);

    event ProposalThresholdUpdated(uint256 oldThreshold, uint256 newThreshold);

    // ───────────────────────────── Errors ────────────────────────────

    error InvalidAddress();
    error PropertyTokenNotFound();
    error InsufficientTokensToPropose();
    error ProposalNotFound();
    error VotingNotActive();
    error AlreadyVoted();
    error NoVotingPower();
    error VotingNotEnded();
    error ProposalAlreadyExecuted();
    error ProposalCancelledError();
    error QuorumNotReached();
    error ProposalNotPassed();
    error NotProposerOrOwner();
    error VotingPeriodOutOfRange();
    error InvalidQuorum();
    error EmptyTitle();

    // ─────────────────────────── Constructor ─────────────────────────

    /**
     * @param _propertyTokenFactory Address of the PropertyTokenFactory contract.
     * @param _owner                Initial owner / admin of the DAO.
     */
    constructor(
        address _propertyTokenFactory,
        address _owner
    ) Ownable(_owner) {
        if (_propertyTokenFactory == address(0)) revert InvalidAddress();
        if (_owner == address(0)) revert InvalidAddress();

        propertyTokenFactory = IPropertyTokenFactory(_propertyTokenFactory);
    }

    // ──────────────────────── External Functions ─────────────────────

    /**
     * @notice Create a new governance proposal for a specific property.
     * @dev    The proposer must hold at least `proposalThreshold` tokens of the
     *         property's PropertyToken.
     * @param propertyId  The id of the property this proposal relates to.
     * @param title       Short title for the proposal.
     * @param description Detailed description / rationale.
     */
    function createProposal(
        uint256 propertyId,
        string calldata title,
        string calldata description
    ) external nonReentrant {
        if (bytes(title).length == 0) revert EmptyTitle();

        // Resolve the PropertyToken for this property
        address tokenAddress = propertyTokenFactory.propertyTokens(propertyId);
        if (tokenAddress == address(0)) revert PropertyTokenNotFound();

        // Verify proposer holds enough tokens
        uint256 balance = IERC20(tokenAddress).balanceOf(msg.sender);
        if (balance < proposalThreshold) revert InsufficientTokensToPropose();

        uint256 proposalId = nextProposalId++;
        uint256 startTime = block.timestamp;
        uint256 endTime = startTime + votingPeriod;

        proposals[proposalId] = Proposal({
            id: proposalId,
            propertyId: propertyId,
            proposer: msg.sender,
            title: title,
            description: description,
            forVotes: 0,
            againstVotes: 0,
            startTime: startTime,
            endTime: endTime,
            executed: false,
            cancelled: false
        });

        propertyProposals[propertyId].push(proposalId);

        emit ProposalCreated(proposalId, propertyId, msg.sender, title, startTime, endTime);
    }

    /**
     * @notice Cast a vote on an active proposal.
     * @dev    Voting weight equals the voter's PropertyToken balance at the time
     *         of voting. Each address may only vote once per proposal.
     * @param proposalId ID of the proposal.
     * @param voteType   For (0) or Against (1).
     */
    function vote(uint256 proposalId, VoteType voteType) external nonReentrant {
        Proposal storage proposal = proposals[proposalId];

        // Validate proposal exists and voting is active
        if (proposal.startTime == 0) revert ProposalNotFound();
        if (proposal.cancelled) revert ProposalCancelledError();
        if (block.timestamp < proposal.startTime || block.timestamp > proposal.endTime) {
            revert VotingNotActive();
        }
        if (hasVoted[proposalId][msg.sender]) revert AlreadyVoted();

        // Determine voting weight from current token balance
        address tokenAddress = propertyTokenFactory.propertyTokens(proposal.propertyId);
        uint256 weight = IERC20(tokenAddress).balanceOf(msg.sender);
        if (weight == 0) revert NoVotingPower();

        // Record the vote
        hasVoted[proposalId][msg.sender] = true;
        voterWeight[proposalId][msg.sender] = weight;

        if (voteType == VoteType.For) {
            proposal.forVotes += weight;
        } else {
            proposal.againstVotes += weight;
        }

        emit Voted(proposalId, msg.sender, voteType, weight);
    }

    /**
     * @notice Execute a proposal after the voting period has ended.
     * @dev    Requires quorum to be met and forVotes > againstVotes.
     *         This marks the proposal as executed; off-chain systems or
     *         additional on-chain logic can react to the ProposalExecuted event.
     * @param proposalId ID of the proposal.
     */
    function executeProposal(uint256 proposalId) external nonReentrant {
        Proposal storage proposal = proposals[proposalId];

        if (proposal.startTime == 0) revert ProposalNotFound();
        if (proposal.executed) revert ProposalAlreadyExecuted();
        if (proposal.cancelled) revert ProposalCancelledError();
        if (block.timestamp <= proposal.endTime) revert VotingNotEnded();

        // Check quorum
        uint256 totalVotes = proposal.forVotes + proposal.againstVotes;
        if (totalVotes < quorum) revert QuorumNotReached();

        // Check majority
        if (proposal.forVotes <= proposal.againstVotes) revert ProposalNotPassed();

        proposal.executed = true;

        emit ProposalExecuted(proposalId);
    }

    /**
     * @notice Cancel a proposal. Only the original proposer or the contract owner
     *         may cancel.
     * @param proposalId ID of the proposal to cancel.
     */
    function cancelProposal(uint256 proposalId) external {
        Proposal storage proposal = proposals[proposalId];

        if (proposal.startTime == 0) revert ProposalNotFound();
        if (proposal.executed) revert ProposalAlreadyExecuted();
        if (proposal.cancelled) revert ProposalCancelledError();
        if (msg.sender != proposal.proposer && msg.sender != owner()) {
            revert NotProposerOrOwner();
        }

        proposal.cancelled = true;

        emit ProposalCancelled(proposalId);
    }

    // ───────────────────────── Admin Functions ───────────────────────

    /**
     * @notice Update the voting period duration.
     * @param newPeriod New voting period in seconds (min 1 day, max 30 days).
     */
    function setVotingPeriod(uint256 newPeriod) external onlyOwner {
        if (newPeriod < MIN_VOTING_PERIOD || newPeriod > MAX_VOTING_PERIOD) {
            revert VotingPeriodOutOfRange();
        }

        uint256 oldPeriod = votingPeriod;
        votingPeriod = newPeriod;

        emit VotingPeriodUpdated(oldPeriod, newPeriod);
    }

    /**
     * @notice Update the quorum requirement.
     * @param newQuorum New minimum total votes required.
     */
    function setQuorum(uint256 newQuorum) external onlyOwner {
        if (newQuorum == 0) revert InvalidQuorum();

        uint256 oldQuorum = quorum;
        quorum = newQuorum;

        emit QuorumUpdated(oldQuorum, newQuorum);
    }

    /**
     * @notice Update the minimum tokens required to create a proposal.
     * @param newThreshold New threshold (whole token units).
     */
    function setProposalThreshold(uint256 newThreshold) external onlyOwner {
        uint256 oldThreshold = proposalThreshold;
        proposalThreshold = newThreshold;

        emit ProposalThresholdUpdated(oldThreshold, newThreshold);
    }

    // ────────────────────────── View Functions ───────────────────────

    /**
     * @notice Retrieve full proposal data by id.
     * @param proposalId ID of the proposal.
     * @return The Proposal struct.
     */
    function getProposal(uint256 proposalId) external view returns (Proposal memory) {
        return proposals[proposalId];
    }

    /**
     * @notice Retrieve all proposal ids for a given property.
     * @param propertyId The property id.
     * @return Array of proposal ids.
     */
    function getPropertyProposals(uint256 propertyId) external view returns (uint256[] memory) {
        return propertyProposals[propertyId];
    }

    /**
     * @notice Retrieve the vote weight a voter used on a specific proposal.
     * @param proposalId ID of the proposal.
     * @param voter      Address of the voter.
     * @return The weight (0 if they have not voted).
     */
    function getVoteWeight(uint256 proposalId, address voter) external view returns (uint256) {
        return voterWeight[proposalId][voter];
    }
}
