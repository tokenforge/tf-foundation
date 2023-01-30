// SPDX-License-Identifier: MIT
// (C) by TokenForge GmbH, Berlin. All rights reserved.
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

pragma solidity >=0.8.3;

// https://eips.ethereum.org/EIPS/eip-5560

import "@openzeppelin/contracts/utils/introspection/ERC165.sol";

/**
 * @dev Implementation of Redeemable for ERC-721s
 *
 */

/* is ERC165 */
interface IRedeemable {
    /*
     * ERC165 bytes to add to interface array - set in parent contract implementing this standard
     *
     * bytes4 private constant _INTERFACE_ID_ERC721REDEEM = 0x2f8ca953;
     */

    /// @dev This event emits when a token is redeemed.
    event Redeem(address indexed from, uint256 indexed tokenId);

    /// @notice Returns the redeem status of a token
    /// @param tokenId Identifier of the token.
    function isRedeemable(uint256 tokenId) external view returns (bool);

    /// @notice Redeeem a token
    /// @param tokenId Identifier of the token to redeeem
    function redeem(uint256 tokenId) external;
}
