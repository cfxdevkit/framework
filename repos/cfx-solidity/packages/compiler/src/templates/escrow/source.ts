/**
 * `SimpleEscrow` — three-party escrow: buyer, seller, arbiter.
 * Buyer deposits ETH/CFX at deploy time. Arbiter can release (to seller) or
 * refund (to buyer). Once resolved, the contract is sealed.
 */
export const SIMPLE_ESCROW_PATH = 'cfxdevkit/SimpleEscrow.sol';

export const SIMPLE_ESCROW_SOURCE = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title SimpleEscrow
 * @notice Three-party escrow: buyer deposits, arbiter resolves.
 *
 * Lifecycle:
 *   1. Buyer deploys, sending CFX as value → state = AWAITING_DELIVERY
 *   2. Arbiter calls release() → funds sent to seller  → state = COMPLETE
 *      OR arbiter calls refund() → funds returned to buyer → state = REFUNDED
 *
 * Only the arbiter can resolve. The contract self-destructs is NOT used
 * (safer on chain-reorgs); remaining balance is zeroed by the transfer.
 */
contract SimpleEscrow {
    enum State { AWAITING_DELIVERY, COMPLETE, REFUNDED }

    address public immutable buyer;
    address public immutable seller;
    address public immutable arbiter;
    uint256 public immutable amount;
    State   public state;

    event Released(address indexed to, uint256 amount);
    event Refunded(address indexed to, uint256 amount);

    error NotArbiter();
    error AlreadyResolved();
    error ZeroDeposit();
    error TransferFailed();

    constructor(address seller_, address arbiter_) payable {
        if (msg.value == 0) revert ZeroDeposit();
        buyer   = msg.sender;
        seller  = seller_;
        arbiter = arbiter_;
        amount  = msg.value;
        state   = State.AWAITING_DELIVERY;
    }

    modifier onlyArbiter() {
        if (msg.sender != arbiter) revert NotArbiter();
        _;
    }

    modifier notResolved() {
        if (state != State.AWAITING_DELIVERY) revert AlreadyResolved();
        _;
    }

    /// @notice Release funds to the seller — called by arbiter on delivery confirmation.
    function release() external onlyArbiter notResolved {
        state = State.COMPLETE;
        (bool ok,) = seller.call{value: amount}("");
        if (!ok) revert TransferFailed();
        emit Released(seller, amount);
    }

    /// @notice Refund the buyer — called by arbiter on dispute resolution.
    function refund() external onlyArbiter notResolved {
        state = State.REFUNDED;
        (bool ok,) = buyer.call{value: amount}("");
        if (!ok) revert TransferFailed();
        emit Refunded(buyer, amount);
    }

    /// @notice Returns the current escrow balance (0 once resolved).
    function balance() external view returns (uint256) {
        return address(this).balance;
    }
}
`;
