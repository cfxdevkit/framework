/**
 * `MultiSigWallet` — M-of-N multi-signature wallet.
 * Owners submit transactions, enough owners confirm, anyone executes.
 */
export const MULTI_SIG_WALLET_PATH = 'cfxdevkit/MultiSigWallet.sol';

export const MULTI_SIG_WALLET_SOURCE = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title MultiSigWallet
 * @notice M-of-N multi-signature wallet.
 *
 * Any owner can:
 *   - submit(to, value, data)  → creates a pending tx
 *   - confirm(txId)            → adds confirmation
 *   - revoke(txId)             → removes own confirmation
 *   - execute(txId)            → executes once confirmations >= required
 *
 * The wallet accepts CFX via receive().
 */
contract MultiSigWallet {
    struct Transaction {
        address to;
        uint256 value;
        bytes   data;
        bool    executed;
        uint256 numConfirmations;
    }

    address[] public owners;
    mapping(address => bool) public isOwner;
    uint256 public immutable required;

    Transaction[] public transactions;
    /// txId → owner → confirmed
    mapping(uint256 => mapping(address => bool)) public confirmed;

    event Deposit(address indexed sender, uint256 value);
    event Submit(uint256 indexed txId);
    event Confirm(address indexed owner, uint256 indexed txId);
    event Revoke(address indexed owner, uint256 indexed txId);
    event Execute(uint256 indexed txId);

    error NotOwner();
    error TxNotFound();
    error AlreadyConfirmed();
    error NotConfirmed();
    error AlreadyExecuted();
    error NotEnoughConfirmations();
    error ExecutionFailed();
    error InvalidOwners();

    modifier onlyOwner() {
        if (!isOwner[msg.sender]) revert NotOwner();
        _;
    }

    modifier txExists(uint256 txId) {
        if (txId >= transactions.length) revert TxNotFound();
        _;
    }

    modifier notConfirmed(uint256 txId) {
        if (confirmed[txId][msg.sender]) revert AlreadyConfirmed();
        _;
    }

    modifier notExecuted(uint256 txId) {
        if (transactions[txId].executed) revert AlreadyExecuted();
        _;
    }

    constructor(address[] memory owners_, uint256 required_) {
        if (owners_.length == 0 || required_ == 0 || required_ > owners_.length)
            revert InvalidOwners();
        for (uint256 i = 0; i < owners_.length; i++) {
            address o = owners_[i];
            require(o != address(0) && !isOwner[o], "bad owner");
            isOwner[o] = true;
            owners.push(o);
        }
        required = required_;
    }

    receive() external payable {
        emit Deposit(msg.sender, msg.value);
    }

    function submit(address to, uint256 value, bytes calldata data)
        external onlyOwner returns (uint256 txId)
    {
        txId = transactions.length;
        transactions.push(Transaction({ to: to, value: value, data: data, executed: false, numConfirmations: 0 }));
        emit Submit(txId);
    }

    function confirm(uint256 txId)
        external onlyOwner txExists(txId) notConfirmed(txId) notExecuted(txId)
    {
        confirmed[txId][msg.sender] = true;
        transactions[txId].numConfirmations++;
        emit Confirm(msg.sender, txId);
    }

    function revoke(uint256 txId)
        external onlyOwner txExists(txId) notExecuted(txId)
    {
        if (!confirmed[txId][msg.sender]) revert NotConfirmed();
        confirmed[txId][msg.sender] = false;
        transactions[txId].numConfirmations--;
        emit Revoke(msg.sender, txId);
    }

    function execute(uint256 txId)
        external onlyOwner txExists(txId) notExecuted(txId)
    {
        Transaction storage t = transactions[txId];
        if (t.numConfirmations < required) revert NotEnoughConfirmations();
        t.executed = true;
        (bool ok,) = t.to.call{value: t.value}(t.data);
        if (!ok) revert ExecutionFailed();
        emit Execute(txId);
    }

    function getOwners() external view returns (address[] memory) { return owners; }
    function getTransactionCount() external view returns (uint256) { return transactions.length; }
    function getTransaction(uint256 txId) external view returns (
        address to, uint256 value, bytes memory data, bool executed, uint256 numConfirmations
    ) {
        Transaction storage t = transactions[txId];
        return (t.to, t.value, t.data, t.executed, t.numConfirmations);
    }
}
`;
