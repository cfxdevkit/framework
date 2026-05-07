/**
 * `ExampleCounter` — a minimal stateful counter with increment, decrement,
 * and reset.  Useful for verifying read and write calls end-to-end.
 */
export const EXAMPLE_COUNTER_PATH = 'cfxdevkit/ExampleCounter.sol';

export const EXAMPLE_COUNTER_SOURCE = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract ExampleCounter {
    uint256 public count;

    event Incremented(address indexed by, uint256 newCount);
    event Decremented(address indexed by, uint256 newCount);
    event Reset(address indexed by);

    function increment() external {
        count += 1;
        emit Incremented(msg.sender, count);
    }

    function decrement() external {
        require(count > 0, "Counter: underflow");
        count -= 1;
        emit Decremented(msg.sender, count);
    }

    function reset() external {
        count = 0;
        emit Reset(msg.sender);
    }

    function getCount() external view returns (uint256) {
        return count;
    }
}
`;
