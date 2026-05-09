/**
 * `Ballot` — weighted-vote ballot with delegation.
 * Chairperson grants voting rights; voters can delegate or cast their vote.
 */
export const BALLOT_PATH = 'cfxdevkit/Ballot.sol';

export const BALLOT_SOURCE = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title Ballot
 * @notice Weighted vote ballot with delegation.
 *
 * Chairperson deploys with a list of proposal names.
 * Chairperson can grant voting rights to any address.
 * Voters can:
 *   - delegate(to)   — transfer their vote weight to another address
 *   - vote(proposal) — cast their accumulated weight to a proposal
 *
 * winningProposal() / winnerName() are view functions that return the current leader.
 * Ties are broken by lowest index.
 */
contract Ballot {
    struct Voter {
        uint256 weight;     // accumulated by delegation
        bool    voted;
        address delegate;
        uint256 vote;       // index of voted proposal
    }

    struct Proposal {
        bytes32 name;       // short name (up to 32 bytes)
        uint256 voteCount;
    }

    address public immutable chairperson;
    mapping(address => Voter) public voters;
    Proposal[] public proposals;

    event RightGranted(address indexed voter);
    event Voted(address indexed voter, uint256 indexed proposalIndex);
    event Delegated(address indexed from, address indexed to);

    error NotChairperson();
    error AlreadyVoted();
    error NoVotingRight();
    error SelfDelegate();
    error DelegateChainLoop();
    error InvalidProposal();

    constructor(bytes32[] memory proposalNames) {
        chairperson = msg.sender;
        voters[chairperson].weight = 1;
        for (uint256 i = 0; i < proposalNames.length; i++) {
            proposals.push(Proposal({ name: proposalNames[i], voteCount: 0 }));
        }
    }

    /// @notice Grant the right to vote to an address (chairperson only).
    function giveRightToVote(address voter) external {
        if (msg.sender != chairperson) revert NotChairperson();
        if (voters[voter].voted)       revert AlreadyVoted();
        voters[voter].weight = 1;
        emit RightGranted(voter);
    }

    /// @notice Delegate your vote to another address.
    function delegate(address to) external {
        Voter storage sender = voters[msg.sender];
        if (sender.weight == 0) revert NoVotingRight();
        if (sender.voted)       revert AlreadyVoted();
        if (to == msg.sender)   revert SelfDelegate();

        // Walk delegation chain — guard against loops (max 256 hops)
        address target = to;
        for (uint256 i = 0; i < 256; i++) {
            address next = voters[target].delegate;
            if (next == address(0)) break;
            if (next == msg.sender) revert DelegateChainLoop();
            target = next;
        }

        sender.voted    = true;
        sender.delegate = target;
        Voter storage del = voters[target];
        if (del.voted) {
            // Delegate already voted — add weight directly to the proposal
            proposals[del.vote].voteCount += sender.weight;
        } else {
            del.weight += sender.weight;
        }
        emit Delegated(msg.sender, target);
    }

    /// @notice Cast your vote to a proposal index.
    function vote(uint256 proposal) external {
        Voter storage sender = voters[msg.sender];
        if (sender.weight == 0) revert NoVotingRight();
        if (sender.voted)       revert AlreadyVoted();
        if (proposal >= proposals.length) revert InvalidProposal();

        sender.voted = true;
        sender.vote  = proposal;
        proposals[proposal].voteCount += sender.weight;
        emit Voted(msg.sender, proposal);
    }

    /// @notice Returns the index of the winning proposal (most votes, ties to lowest index).
    function winningProposal() public view returns (uint256 winnerIndex) {
        uint256 max;
        for (uint256 i = 0; i < proposals.length; i++) {
            if (proposals[i].voteCount > max) {
                max = proposals[i].voteCount;
                winnerIndex = i;
            }
        }
    }

    /// @notice Returns the name of the winning proposal.
    function winnerName() external view returns (bytes32) {
        return proposals[winningProposal()].name;
    }

    /// @notice Returns the total number of proposals.
    function proposalCount() external view returns (uint256) {
        return proposals.length;
    }
}
`;
