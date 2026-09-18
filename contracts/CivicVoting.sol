// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract CivicVoting {
    struct Candidate {
        uint256 id;
        string name;
        uint256 voteCount;
    }

    mapping(uint256 => Candidate) private candidates;
    uint256 public candidatesCount;
    mapping(address => bool) public hasVoted;

    event Voted(address indexed voter, uint256 indexed candidateId);

    constructor() {
        addCandidate("Better Roads & Infrastructure");
        addCandidate("Clean Water & Sanitation");
        addCandidate("Public Safety & Lighting");
        addCandidate("Green Spaces & Parks");
        addCandidate("Better Schools & Education");
    }

    function addCandidate(string memory name) private {
        candidatesCount++;
        candidates[candidatesCount] = Candidate(candidatesCount, name, 0);
    }

    function getCandidates() external view returns (Candidate[] memory) {
        Candidate[] memory all = new Candidate[](candidatesCount);
        for (uint256 i = 1; i <= candidatesCount; i++) {
            all[i - 1] = candidates[i];
        }
        return all;
    }

    function vote(uint256 candidateId) external {
        require(!hasVoted[msg.sender], "Already voted");
        require(candidateId > 0 && candidateId <= candidatesCount, "Invalid candidate");

        hasVoted[msg.sender] = true;
        candidates[candidateId].voteCount++;
        emit Voted(msg.sender, candidateId);
    }
}
