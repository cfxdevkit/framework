/**
 * `SimpleStorage` — stores and retrieves a single uint256 value.
 * Classic Solidity introductory contract; good for testing basic reads/writes.
 */
export const SIMPLE_STORAGE_PATH = 'cfxdevkit/SimpleStorage.sol';

export const SIMPLE_STORAGE_SOURCE = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract SimpleStorage {
    uint256 private _value;

    event ValueChanged(address indexed by, uint256 newValue);

    function store(uint256 value) external {
        _value = value;
        emit ValueChanged(msg.sender, value);
    }

    function retrieve() external view returns (uint256) {
        return _value;
    }
}
`;
