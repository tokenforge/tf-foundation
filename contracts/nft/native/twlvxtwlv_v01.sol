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

pragma solidity >=0.8.3;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/access/AccessControlEnumerable.sol";

import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Burnable.sol";
import "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Supply.sol";

contract twlvxtwlv_v01 is ERC1155Burnable, ERC1155Supply, Ownable, AccessControlEnumerable {
    using ECDSA for bytes32;

    // ***** Roles ********
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

    // Signer
    address private _signer;

    event SignerChanged(address indexed oldSigner, address indexed _signer);

    /**
     * @dev Throws if called by any account other than the owner.
     */
    modifier onlyOwnerOrAdmin() {
        require(
            owner() == _msgSender() || hasRole(DEFAULT_ADMIN_ROLE, _msgSender()),
            "twlvxtwlv_v01: caller is not the owner nor admin"
        );
        _;
    }

    modifier onlyMinter() {
        require(hasRole(MINTER_ROLE, _msgSender()), "twlvxtwlv_v01: caller has no minter role");
        _;
    }

    modifier tokenIsDefined(uint256 tokenId) {
        require(isTokenDefined(tokenId), "twlvxtwlv_v01: token is not defined yet");
        _;
    }

    modifier tokenIsNotDefined(uint256 tokenId) {
        require(!isTokenDefined(tokenId), "twlvxtwlv_v01: token is already defined");
        _;
    }

    // MetaData, TokenUris
    mapping(uint256 => string) private _tokenUris;

    constructor(address signer_, string memory baseUri_) ERC1155(baseUri_) {
        _signer = signer_;

        _setupRole(DEFAULT_ADMIN_ROLE, _msgSender());
        _setupRole(MINTER_ROLE, _msgSender());
    }

    /// @notice Helper to know signers address
    /// @return the signer address
    function signer() public view virtual returns (address) {
        return _signer;
    }

    function setSigner(address signer_) external onlyOwnerOrAdmin {
        address oldSigner = _signer;

        _signer = signer_;
        emit SignerChanged(oldSigner, _signer);
    }

    function isTokenDefined(uint256 tokenId) public view returns (bool) {
        return bytes(_tokenUris[tokenId]).length > 0;
    }

    /// @notice Helper that creates the message that signer needs to sign to allow a mint
    ///         this is usually also used when creating the allowances, to ensure "message"
    ///         is the same
    /// @param to the beneficiary
    /// @param tokenUri The tokenUri
    /// @return the message to sign
    function createMessage(
        address to,
        uint256 tokenId,
        uint256 amount,
        string memory tokenUri
    ) public view returns (bytes32) {
        return keccak256(abi.encode(to, tokenId, amount, tokenUri, address(this)));
    }

    /// @notice This function verifies that the current request is valid
    /// @dev it verifies that parameters coming from the UI were not corrupted by a middlemen
    /// @param tokenId the tokenID in question
    /// @param hash The IPFS hash
    /// @param signature the signature by the allowance signer wallet
    /// @return the message to mark as used
    function validateSignature(
        address to,
        uint256 tokenId,
        uint256 amount,
        string memory hash,
        bytes memory signature
    ) public view returns (bytes32) {
        bytes32 message = createMessage(to, tokenId, amount, hash).toEthSignedMessageHash();

        // verifies that the sha3(account, nonce, address(this)) has been signed by _allowancesSigner
        if (message.recover(signature) != signer()) {
            revert("twlvxtwlv_v01: Either signature is wrong or parameters have been corrupted");
        }

        return message;
    }

    function create(
        address to,
        uint256 tokenId,
        uint256 amount,
        string memory tokenUri
    ) public onlyMinter tokenIsNotDefined(tokenId) {
        bytes memory data;
        _mint(to, tokenId, amount, data);

        if (bytes(tokenUri).length > 0) {
            _setTokenUri(tokenId, tokenUri);
        }
    }

    function createWithSignature(
        address to,
        uint256 tokenId,
        uint256 amount,
        string memory tokenUri,
        bytes memory signature
    ) public tokenIsNotDefined(tokenId) {
        validateSignature(to, tokenId, amount, tokenUri, signature);

        bytes memory data;
        _mint(to, tokenId, amount, data);

        if (bytes(tokenUri).length > 0) {
            _setTokenUri(tokenId, tokenUri);
        }
    }

    function mintTo(
        address to,
        uint256 tokenId,
        uint256 amount
    ) public onlyMinter tokenIsDefined(tokenId) {
        bytes memory data;
        _mint(to, tokenId, amount, data);
    }

    function mintToWithSignature(
        address to,
        uint256 tokenId,
        uint256 amount,
        bytes memory signature
    ) public tokenIsDefined(tokenId) {
        validateSignature(to, tokenId, amount, "", signature);

        bytes memory data;
        _mint(to, tokenId, amount, data);
    }

    function mint(uint256 tokenId, uint256 amount) external {
        mintTo(msg.sender, tokenId, amount);
    }

    function mintWithSignature(
        uint256 tokenId,
        uint256 amount,
        bytes memory signature
    ) external {
        mintToWithSignature(msg.sender, tokenId, amount, signature);
    }

    /**
     * @dev Hook that is called before any token transfer. This includes minting
     * and burning, as well as batched variants.
     *
     * The same hook is called on both single and batched variants. For single
     * transfers, the length of the `id` and `amount` arrays will be 1.
     *
     * Calling conditions (for each `id` and `amount` pair):
     *
     * - When `from` and `to` are both non-zero, `amount` of ``from``'s tokens
     * of token type `id` will be  transferred to `to`.
     * - When `from` is zero, `amount` tokens of token type `id` will be minted
     * for `to`.
     * - when `to` is zero, `amount` of ``from``'s tokens of token type `id`
     * will be burned.
     * - `from` and `to` are never both zero.
     * - `ids` and `amounts` have the same, non-zero length.
     *
     * To learn more about hooks, head to xref:ROOT:extending-contracts.adoc#using-hooks[Using Hooks].
     */
    function _beforeTokenTransfer(
        address operator,
        address from,
        address to,
        uint256[] memory ids,
        uint256[] memory amounts,
        bytes memory data
    ) internal virtual override(ERC1155, ERC1155Supply) {
        super._beforeTokenTransfer(operator, from, to, ids, amounts, data);
    }

    function uri(uint256 id) public view virtual override returns (string memory) {
        return _tokenUris[id];
    }

    function setTokenUri(uint256 id, string memory tokenUri) external onlyOwner {
        _setTokenUri(id, tokenUri);
    }

    function _setTokenUri(uint256 id, string memory tokenUri) internal {
        _tokenUris[id] = tokenUri;
    }

    function withdraw() external onlyOwnerOrAdmin {
        uint256 balance = address(this).balance;
        payable(msg.sender).transfer(balance);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        virtual
        override(AccessControlEnumerable, ERC1155)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
