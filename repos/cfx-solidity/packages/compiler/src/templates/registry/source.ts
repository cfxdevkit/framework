/**
 * `NameRegistry` — on-chain name → address mapping with ownership transfer.
 */
export const NAME_REGISTRY_PATH = 'cfxdevkit/NameRegistry.sol';

export const NAME_REGISTRY_SOURCE = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title NameRegistry
 * @notice On-chain name → address mapping.
 *
 * - Anyone can register a name (first come, first served).
 * - Owners can update their address or transfer ownership of a name.
 * - Owner can release a name back to the public.
 * - Names are case-sensitive; max 64 bytes to prevent griefing.
 */
contract NameRegistry {
    struct Entry {
        address owner;
        address target;
        uint256 registeredAt;
    }

    mapping(string => Entry) private _entries;

    event Registered(string indexed name, address indexed owner, address target);
    event Updated(string indexed name, address indexed owner, address newTarget);
    event Transferred(string indexed name, address indexed from, address indexed to);
    event Released(string indexed name, address indexed owner);

    error NameTaken();
    error NotOwner();
    error NameNotFound();
    error NameTooLong();
    error EmptyName();

    modifier validName(string calldata name) {
        bytes memory b = bytes(name);
        if (b.length == 0) revert EmptyName();
        if (b.length > 64)  revert NameTooLong();
        _;
    }

    /// @notice Register a new name. Reverts if already taken.
    function register(string calldata name, address target)
        external validName(name)
    {
        if (_entries[name].owner != address(0)) revert NameTaken();
        _entries[name] = Entry({ owner: msg.sender, target: target, registeredAt: block.timestamp });
        emit Registered(name, msg.sender, target);
    }

    /// @notice Update the target address of a name you own.
    function update(string calldata name, address newTarget) external {
        Entry storage e = _entries[name];
        if (e.owner == address(0)) revert NameNotFound();
        if (e.owner != msg.sender)  revert NotOwner();
        e.target = newTarget;
        emit Updated(name, msg.sender, newTarget);
    }

    /// @notice Transfer ownership of a name to a new address.
    function transfer(string calldata name, address newOwner) external {
        Entry storage e = _entries[name];
        if (e.owner == address(0)) revert NameNotFound();
        if (e.owner != msg.sender)  revert NotOwner();
        address prev = e.owner;
        e.owner = newOwner;
        emit Transferred(name, prev, newOwner);
    }

    /// @notice Release a name back to the public (deletes the entry).
    function release(string calldata name) external {
        Entry storage e = _entries[name];
        if (e.owner == address(0)) revert NameNotFound();
        if (e.owner != msg.sender)  revert NotOwner();
        address prev = e.owner;
        delete _entries[name];
        emit Released(name, prev);
    }

    /// @notice Look up a name. Returns zero address if not registered.
    function resolve(string calldata name) external view returns (address target, address owner, uint256 registeredAt) {
        Entry storage e = _entries[name];
        return (e.target, e.owner, e.registeredAt);
    }

    /// @notice Returns true if a name is currently registered.
    function isRegistered(string calldata name) external view returns (bool) {
        return _entries[name].owner != address(0);
    }
}
`;
