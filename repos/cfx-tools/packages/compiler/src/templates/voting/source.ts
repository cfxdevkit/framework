/**
 * `Voting` — a simple proposal voting contract with no delegation.
 * Anyone can vote once; the owner can close voting.
 */
export const VOTING_PATH = 'cfxdevkit/Voting.sol';

export const VOTING_SOURCE = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

/**
 * @title Voting
 * @notice Simple one-vote-per-address proposal voting.
 *         Owner can close voting; winner is the highest-vote proposal.
 */
contract Voting {
    struct Proposal {
        string name;
        uint256 voteCount;
    }

    address public owner;
    bool public votingOpen;
    Proposal[] public proposals;

    mapping(address => bool) public hasVoted;

    event Voted(address indexed voter, uint256 indexed proposalIndex);
    event VotingClosed();

    constructor(string[] memory proposalNames_) {
        owner = msg.sender;
        votingOpen = true;
        for (uint256 i = 0; i < proposalNames_.length; i++) {
            proposals.push(Proposal({ name: proposalNames_[i], voteCount: 0 }));
        }
    }

    function vote(uint256 proposalIndex) external {
        require(votingOpen, "Voting: voting is closed");
        require(!hasVoted[msg.sender], "Voting: already voted");
        require(proposalIndex < proposals.length, "Voting: invalid proposal index");
        hasVoted[msg.sender] = true;
        proposals[proposalIndex].voteCount++;
        emit Voted(msg.sender, proposalIndex);
    }

    function closeVoting() external {
        require(msg.sender == owner, "Voting: not owner");
        votingOpen = false;
        emit VotingClosed();
    }

    function winningProposal()
        external
        view
        returns (uint256 index, string memory name_, uint256 voteCount)
    {
        uint256 winCount = 0;
        uint256 winIndex = 0;
        for (uint256 i = 0; i < proposals.length; i++) {
            if (proposals[i].voteCount > winCount) {
                winCount = proposals[i].voteCount;
                winIndex = i;
            }
        }
        return (winIndex, proposals[winIndex].name, proposals[winIndex].voteCount);
    }

    function proposalCount() external view returns (uint256) {
        return proposals.length;
    }
}
`;
