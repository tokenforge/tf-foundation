// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/access/AccessControlEnumerable.sol";
import "@openzeppelin/contracts/utils/Context.sol";
import "@openzeppelin/contracts/proxy/Clones.sol";
import "../token/TokenForge20Capped.sol";

contract TokenForge20CappedFactory is Context, AccessControlEnumerable {
    event ContractDeployed(address contractAddress);

    mapping(address => address[]) private _deployedContracts;

    constructor() {
        _setupRole(DEFAULT_ADMIN_ROLE, _msgSender());
    }

    function createTokenForge20Capped(
        string memory name,
        string memory symbol,
        uint256 cap,
        bool transferOwnership
    ) public returns (address) {
        TokenForge20Capped inst = new TokenForge20Capped(name, symbol, cap);

        if (transferOwnership) {
            inst.transferOwnership(_msgSender());
        }

        _deployedContracts[_msgSender()].push(address(inst));

        emit ContractDeployed(address(inst));

        return address(inst);
    }

    /**
     * @dev Returns one of the tokens. `index` must be a
     * value between 0 and {getInstanceCount}, non-inclusive.
     *
     * Tokens are not sorted in any particular way, and their ordering may
     * change at any point.
     */
    function getInstance(address creator, uint256 index) public view returns (address) {
        return _deployedContracts[creator][index];
    }

    /**
     * @dev Returns the number of accounts that have `creator`.
     */
    function getInstanceCount(address creator) public view returns (uint256) {
        return _deployedContracts[creator].length;
    }
}
