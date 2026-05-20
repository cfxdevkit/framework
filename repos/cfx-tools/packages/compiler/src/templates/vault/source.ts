/**
 * `PayableVault` — a minimal ether vault that accepts deposits and allows the
 * depositor to withdraw their own balance.  Exercises payable calls,
 * `msg.value`, `receive()`, and restricted withdrawals.
 */
export const PAYABLE_VAULT_PATH = 'cfxdevkit/PayableVault.sol';

export const PAYABLE_VAULT_SOURCE = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract PayableVault {
    mapping(address => uint256) public balances;

    event Deposited(address indexed from, uint256 amount);
    event Withdrawn(address indexed to, uint256 amount);

    receive() external payable {
        _deposit();
    }

    function deposit() external payable {
        _deposit();
    }

    function withdraw(uint256 amount) external {
        require(balances[msg.sender] >= amount, "Vault: insufficient balance");
        balances[msg.sender] -= amount;
        (bool ok, ) = payable(msg.sender).call{value: amount}("");
        require(ok, "Vault: transfer failed");
        emit Withdrawn(msg.sender, amount);
    }

    function getBalance(address account) external view returns (uint256) {
        return balances[account];
    }

    function _deposit() internal {
        require(msg.value > 0, "Vault: no ether sent");
        balances[msg.sender] += msg.value;
        emit Deposited(msg.sender, msg.value);
    }
}
`;
