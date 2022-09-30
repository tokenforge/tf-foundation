// SPDX-License-Identifier: UNLICENSED
// (C) by TokenForge GmbH, Berlin
// Author: Hagen Hübel, hagen@token-forge.io

pragma solidity >=0.8.3;

import "./TokenForge1155v3.sol";

contract TokenForge1155v3_Demo is TokenForge1155v3 {
    constructor(address signer_, string memory baseUri_) TokenForge1155v3(signer_, baseUri_) {
    }


    function supportsInterface(bytes4 interfaceId)
        public
        view
        virtual
        override(TokenForge1155v3)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
