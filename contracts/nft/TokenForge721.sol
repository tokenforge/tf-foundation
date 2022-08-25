// SPDX-License-Identifier: UNLICENSED
// (C) by TokenForge GmbH, Berlin
// Author: Hagen Hübel, hagen@token-forge.io

pragma solidity >=0.8.3;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Burnable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Pausable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "../lib/Counters.sol";

contract TokenForge721 is ERC721, ERC721Enumerable, ERC721Burnable, ERC721Pausable, ERC721URIStorage, Ownable {
    using ECDSA for bytes32;

    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;

    address private _signer;
    string private _baseUri;

    event SignerChanged(address indexed oldSigner, address indexed _signer);

    constructor(address signer_, string memory baseUri_) ERC721("TokenForge721p", "TF7") {
        _signer = signer_;
        _baseUri = baseUri_;
    }

    /// @notice Helper to know signers address
    /// @return the signer address
    function signer() public view virtual returns (address) {
        return _signer;
    }

    function setSigner(address signer_) external onlyOwner {
        address oldSigner = _signer;

        _signer = signer_;
        emit SignerChanged(oldSigner, _signer);
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

    /// @notice Helper that creates the message that signer needs to sign to allow a mint
    ///         this is usually also used when creating the allowances, to ensure "message"
    ///         is the same
    /// @param to the beneficiary
    /// @param tokenUri The tokenUri
    /// @return the message to sign
    function createMessage(address to, string memory tokenUri) public view returns (bytes32) {
        return keccak256(abi.encode(to, tokenUri, address(this)));
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
            revert("Either signature is wrong or parameters have been corrupted");
        }

        return message;
    }

    function mintTo(
        address to,
        uint256 tokenId,
        string memory tokenUri,
        bytes memory signature
    ) public payable {
        validateSignature(to, tokenId, tokenUri, signature);

        _mint(to, tokenId);
        if (bytes(tokenUri).length > 0) {
            _setTokenURI(tokenId, tokenUri);
        }
    }

    function mint(
        uint256 tokenId,
        string memory tokenUri,
        bytes memory signature
    ) external {
        mintTo(msg.sender, tokenId, tokenUri, signature);

        if (tokenId > _tokenIds.current()) {
            _tokenIds.set(tokenId);
        }
    }

    function mintAuto(string memory tokenUri, bytes memory signature) external {
        mintToAuto(msg.sender, tokenUri, signature);
    }

    function mintToAuto(
        address to,
        string memory tokenUri,
        bytes memory signature
    ) public payable {
        bytes32 message = createMessage(to, tokenUri).toEthSignedMessageHash();

        // verifies that the sha3(account, nonce, address(this)) has been signed by _allowancesSigner
        if (message.recover(signature) != signer()) {
            revert("Either signature is wrong or parameters have been corrupted");
        }

        _tokenIds.increment();
        uint256 tokenId = _tokenIds.current();

        _mint(to, tokenId);
        if (bytes(tokenUri).length > 0) {
            _setTokenURI(tokenId, tokenUri);
        }
    }

    function currentTokenId() public view returns (uint256) {
        return _tokenIds.current();
    }

    function setTokenId(uint256 tokenId) external {
        _tokenIds.set(tokenId);
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
        override(ERC721, ERC721Enumerable)
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

    function setBaseUri(string memory baseUri) external onlyOwner {
        _baseUri = baseUri;
    }

    function tokenURI(uint256 tokenId) public view override(ERC721, ERC721URIStorage) returns (string memory) {
        return super.tokenURI(tokenId);
    }

    function withdraw() external onlyOwner {
        uint256 balance = address(this).balance;
        payable(msg.sender).transfer(balance);
    }
}
