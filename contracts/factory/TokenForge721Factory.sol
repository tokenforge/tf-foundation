// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/access/AccessControlEnumerable.sol";
import "@openzeppelin/contracts/utils/Context.sol";
import "@openzeppelin/contracts/proxy/Clones.sol";
import "../nft/native/TokenForge721.sol";

contract TokenForge721Factory is Context, AccessControlEnumerable {
    event ContractDeployed(address contractAddress);

    mapping(address => address[]) private _deployedContracts;

    constructor() {
        _setupRole(DEFAULT_ADMIN_ROLE, _msgSender());
    }

    function createTokenForge721(
        string memory name,
        string memory symbol,
        address signer,
        string memory baseUri,
        bool transferOwnership
    ) public returns (TokenForge721) {
        TokenForge721 inst = new TokenForge721(name, symbol, signer, baseUri);

        inst.setSigner(signer);

        if (transferOwnership) {
            inst.transferOwnership(_msgSender());
        }

        // enable caller as minter role
        inst.grantRole(inst.MINTER_ROLE(), _msgSender());
        // renounce minting role from factory
        inst.renounceRole(inst.MINTER_ROLE(), address(this));

        inst.grantRole(inst.DEFAULT_ADMIN_ROLE(), _msgSender());

        inst.grantRole(inst.DEFAULT_ADMIN_ROLE(), _msgSender());
        inst.renounceRole(inst.DEFAULT_ADMIN_ROLE(), address(this));

        _deployedContracts[_msgSender()].push(address(inst));

        emit ContractDeployed(address(inst));

        return inst;
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
