// SPDX-License-Identifier: MIT
// (C) by TokenForge GmbH, Berlin
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

    modifier onlyBurner() {
        require(hasRole(BURNER_ROLE, _msgSender()), "TokenForge721gov: caller has no burner role");
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

    function burnAs(uint256 tokenId) public onlyBurner {
        super._burn(tokenId);
    }
}
