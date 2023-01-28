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

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Burnable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Pausable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "../../lib/Counters.sol";

contract TokenForge721 is
    ERC721,
    ERC721Enumerable,
    ERC721Burnable,
    ERC721Pausable,
    ERC721URIStorage,
    Ownable,
    AccessControlEnumerable
{
    using ECDSA for bytes32;

    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;

    // ***** Roles ********
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");

    modifier onlyMinter() {
        require(hasRole(MINTER_ROLE, _msgSender()), "TokenForge721: caller has no minter role");
        _;
    }

    // Signer
    address private _signer;
    event SignerChanged(address indexed oldSigner, address indexed newSigner);

    // BaseUri
    string private _baseUri;
    event BaseUriChanged(string oldUri, string newUri);

    constructor(
        string memory name_,
        string memory symbol_,
        address signer_,
        string memory baseUri_
    ) ERC721(name_, symbol_) {
        _baseUri = baseUri_;

        _setupRole(DEFAULT_ADMIN_ROLE, _msgSender());

        _setupRole(PAUSER_ROLE, _msgSender());
        _setupRole(MINTER_ROLE, _msgSender());

        _setSigner(signer_);
    }

    /// @notice Helper to know signers address
    /// @return the signer address
    function signer() public view virtual returns (address) {
        return _signer;
    }

    function _setSigner(address signer_) internal {
        if (_signer != signer_) {
            address oldSigner = _signer;

            _signer = signer_;
            emit SignerChanged(oldSigner, _signer);
        }
    }

    function setSigner(address signer_) external onlyOwner {
        _setSigner(signer_);
    }

    /**
     * @dev Pauses all token transfers.
     *
     * See {ERC721Pausable} and {Pausable-_pause}.
     *
     * Requirements:
     *
     * - the caller must have the `PAUSER_ROLE`.
     */
    function pause() public virtual {
        require(hasRole(PAUSER_ROLE, _msgSender()), "ERC721PresetMinterPauserAutoId: must have pauser role to pause");
        _pause();
    }

    /**
     * @dev Unpauses all token transfers.
     *
     * See {ERC721Pausable} and {Pausable-_unpause}.
     *
     * Requirements:
     *
     * - the caller must have the `PAUSER_ROLE`.
     */
    function unpause() public virtual {
        require(hasRole(PAUSER_ROLE, _msgSender()), "ERC721PresetMinterPauserAutoId: must have pauser role to unpause");
        _unpause();
    }

    /// @notice Helper that creates the message that signer needs to sign to allow a mint
    ///         this is usually also used when creating the allowances, to ensure "message"
    ///         is the same
    /// @param to the beneficiary
    /// @param tokenId the tokenID in question
    /// @param tokenUri The tokenUri
    /// @return the message to sign
    function createMessage(
        address to,
        uint256 tokenId,
        string memory tokenUri
    ) public view returns (bytes32) {
        return keccak256(abi.encode(to, tokenId, tokenUri, address(this)));
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
        string memory hash,
        bytes memory signature
    ) public view returns (bytes32) {
        bytes32 message = createMessage(to, tokenId, hash).toEthSignedMessageHash();

        // verifies that the sha3(account, nonce, address(this)) has been signed by _allowancesSigner
        if (message.recover(signature) != signer()) {
            revert("validateSignature: Either signature is wrong or parameters have been corrupted");
        }

        return message;
    }

    function mintTo(
        address to,
        uint256 tokenId,
        string memory tokenUri
    ) public onlyMinter {
        _mint(to, tokenId);
        _setTokenURI(tokenId, tokenUri);
    }

    function mintToWithSignature(
        address to,
        uint256 tokenId,
        string memory tokenUri,
        bytes memory signature
    ) public {
        validateSignature(to, tokenId, tokenUri, signature);

        _mint(to, tokenId);
        _setTokenURI(tokenId, tokenUri);
    }

    function mint(uint256 tokenId, string memory tokenUri) public onlyMinter {
        mintTo(msg.sender, tokenId, tokenUri);

        _tokenIds.set(tokenId);
    }

    function mintWithSignature(
        uint256 tokenId,
        string memory tokenUri,
        bytes memory signature
    ) public {
        mintToWithSignature(msg.sender, tokenId, tokenUri, signature);

        if (tokenId > _tokenIds.current()) {
            _tokenIds.set(tokenId);
        }
    }

    function mintAuto(string memory tokenUri) external onlyMinter {
        mintToAuto(msg.sender, tokenUri);
    }

    function mintAutoWithSignature(string memory tokenUri, bytes memory signature) external {
        mintToAutoWithSignature(msg.sender, tokenUri, signature);
    }

    function mintToAuto(address to, string memory tokenUri) public onlyMinter {
        _mintToAuto(to, tokenUri);
    }

    function mintToAutoWithSignature(
        address to,
        string memory tokenUri,
        bytes memory signature
    ) public {
        validateSignature(to, 0, tokenUri, signature);

        _mintToAuto(to, tokenUri);
    }

    function _mintToAuto(address to, string memory tokenUri) internal {
        _tokenIds.increment();
        uint256 tokenId = _tokenIds.current();

        _mint(to, tokenId);
        _setTokenURI(tokenId, tokenUri);
    }

    function currentTokenId() public view returns (uint256) {
        return _tokenIds.current();
    }

    function setTokenId(uint256 tokenId) public onlyOwner {
        _tokenIds.set(tokenId);
    }

    function _setTokenURI(uint256 tokenId, string memory _tokenURI) internal override(ERC721URIStorage) {
        if (bytes(_tokenURI).length > 0) {
            super._setTokenURI(tokenId, _tokenURI);
        }
    }

    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 amount
    ) internal override(ERC721, ERC721Enumerable, ERC721Pausable) {
        super._beforeTokenTransfer(from, to, amount);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        virtual
        override(ERC721, ERC721Enumerable, AccessControlEnumerable)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

    function _burn(uint256 tokenId) internal override(ERC721, ERC721URIStorage) {
        super._burn(tokenId);
    }

    /**
     * @dev Base URI for computing {tokenURI}. If set, the resulting URI for each
     * token will be the concatenation of the `baseURI` and the `tokenId`. Empty
     * by default, can be overridden in child contracts.
     */
    function _baseURI() internal view virtual override returns (string memory) {
        return _baseUri;
    }

    function baseURI() public view returns (string memory) {
        return _baseURI();
    }

    function setBaseUri(string memory baseUri) external onlyOwner {
        string memory oldUri = _baseUri;

        _baseUri = baseUri;

        emit BaseUriChanged(oldUri, _baseUri);
    }

    function tokenURI(uint256 tokenId) public view override(ERC721, ERC721URIStorage) returns (string memory) {
        return super.tokenURI(tokenId);
    }
}
