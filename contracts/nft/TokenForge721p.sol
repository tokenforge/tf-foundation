// SPDX-License-Identifier: UNLICENSED
// (C) by TokenForge GmbH, Berlin
// Author: Hagen Hübel, hagen@token-forge.io

pragma solidity >=0.8.3;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Burnable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Pausable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";

contract TokenForge721p is ERC721, ERC721Enumerable, ERC721Burnable, ERC721Pausable, ERC721URIStorage, Ownable {
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
    /// @param tokenId the tokenID in question
    /// @param price The corresponding price for this particular token
    /// @param hash The IPFS hash
    /// @return the message to sign
    function createMessage(
        uint256 tokenId,
        uint256 price,
        string memory hash
    ) public view returns (bytes32) {
        return keccak256(abi.encode(tokenId, price, hash, address(this)));
    }

    /// @notice This function verifies that the current request is valid
    /// @dev it verifies that parameters coming from the UI were not corrupted by a middlemen
    /// @param tokenId the tokenID in question
    /// @param price The corresponding price for this particular token
    /// @param hash The IPFS hash
    /// @param signature the signature by the allowance signer wallet
    /// @return the message to mark as used
    function validateSignature(
        uint256 tokenId,
        uint256 price,
        string memory hash,
        bytes memory signature
    ) public view returns (bytes32) {
        bytes32 message = createMessage(tokenId, price, hash).toEthSignedMessageHash();

        // verifies that the sha3(account, nonce, address(this)) has been signed by _allowancesSigner
        if (message.recover(signature) != signer()) {
            revert("Either signature is wrong or parameters have been corrupted");
        }

        return message;
    }

    function mintTo(
        address to,
        uint256 tokenId,
        uint256 price,
        string memory tokenUri,
        bytes memory signature
    ) public payable {
        validateSignature(tokenId, price, tokenUri, signature);

        if (msg.value != price) {
            revert("Price did not match");
        }

        _mint(to, tokenId);
        if (bytes(tokenUri).length > 0) {
            _setTokenURI(tokenId, tokenUri);
        }
    }

    function mint(
        uint256 tokenId,
        uint256 price,
        string memory tokenUri,
        bytes memory signature
    ) external payable {
        mintTo(msg.sender, tokenId, price, tokenUri, signature);
    }

    function mintAuto(
        uint256 price,
        string memory tokenUri,
        bytes memory signature
    ) external payable {
        _tokenIds.increment();
        uint256 tokenId = _tokenIds.current();

        mintTo(msg.sender, tokenId, price, tokenUri, signature);
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
