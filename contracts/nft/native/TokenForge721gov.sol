// SPDX-License-Identifier: MIT
// (C) by TokenForge GmbH, Berlin. All rights reserved.. All rights reserved.
// Author: Hagen Hübel, hagen@token-forge.io
/**
 * @dev Learn more about this on https://token-forge.io
 

 _______    _              ______                   
|__   __|  | |            |  ____|                  
   | | ___ | | _____ _ __ | |__ ___  _ __ __ _  ___ 
   | |/ _ \| |/ / _ \ '_ \|  __/ _ \| '__/ _` |/ _ \
   | | (_) |   <  __/ | | | | | (_) | | | (_| |  __/
   |_|\___/|_|\_\___|_| |_|_|  \___/|_|  \__, |\___|
                                          __/ |     
                                         |___/      

 */

import "./TokenForge721.sol";

pragma solidity >=0.8.3;

contract TokenForge721gov is TokenForge721 {
    // ***** Roles ********
    bytes32 public constant BURNER_ROLE = keccak256("BURNER_ROLE");
    bytes32 public constant TRANSFEROR_ROLE = keccak256("TRANSFEROR_ROLE");

    modifier onlyBurner() {
        require(hasRole(BURNER_ROLE, _msgSender()), "TokenForge721gov: caller has no burner role");
        _;
    }

    modifier onlyTransferor() {
        require(hasRole(TRANSFEROR_ROLE, _msgSender()), "TokenForge721gov: caller has no transferor role");
        _;
    }

    constructor(
        string memory name_,
        string memory symbol_,
        address signer_,
        string memory baseUri_
    ) TokenForge721(name_, symbol_, signer_, baseUri_) {
        _setupRole(BURNER_ROLE, _msgSender());
    }

    function burnAs(uint256 tokenId) public virtual onlyBurner {
        super._burn(tokenId);
    }

    /**
     * @dev Allows someone with TRANSFEROR_ROLE to transfer `tokenId` token from `from` to `to` .
     *
     * WARNING: Note that the caller is responsible to confirm that the recipient is capable of receiving ERC721
     * or else they may be permanently lost. Usage of {safeTransferFrom} prevents loss, though the caller must
     * understand this adds an external call which potentially creates a reentrancy vulnerability.
     *
     * Requirements:
     *
     * - `from` cannot be the zero address.
     * - `to` cannot be the zero address.
     * - `tokenId` token must exist and be owned by `from`.
     * - Then Caller must have the TRANSFEROR-role.
     * - If `to` refers to a smart contract, it must implement {IERC721Receiver-onERC721Received}, which is called upon a safe transfer.
     *
     * Emits a {Transfer} event.
     */
    function transferFromAs(
        address from,
        address to,
        uint256 tokenId
    ) public virtual onlyTransferor {
        _transfer(from, to, tokenId);
    }

    /**
     * @dev Allows someone with TRANSFEROR_ROLE to transfer `tokenId` token from `from` to `to` .
     *
     * Requirements:
     *
     * - `from` cannot be the zero address.
     * - `to` cannot be the zero address.
     * - `tokenId` token must exist and be owned by `from`.
     * - Then Caller must have the TRANSFEROR-role.
     *
     * Emits a {Transfer} event.
     */
    function safeTransferFromAs(
        address from,
        address to,
        uint256 tokenId,
        bytes memory data
    ) public virtual onlyTransferor {
        _safeTransfer(from, to, tokenId, data);
    }
    
}
