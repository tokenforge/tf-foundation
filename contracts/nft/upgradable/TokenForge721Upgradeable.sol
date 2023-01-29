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

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlEnumerableUpgradeable.sol";

import "@openzeppelin/contracts-upgradeable/utils/cryptography/ECDSAUpgradeable.sol";

import "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721EnumerableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721BurnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721URIStorageUpgradeable.sol";
import "../../lib/Counters.sol";

contract TokenForge721Upgradeable is
    ERC721Upgradeable,
    ERC721EnumerableUpgradeable,
    ERC721BurnableUpgradeable,
    ERC721PausableUpgradeable,
    ERC721URIStorageUpgradeable,
    OwnableUpgradeable,
    AccessControlEnumerableUpgradeable
{
    using ECDSAUpgradeable for bytes32;

    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;

    // ***** Roles ********
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

    modifier onlyMinter() {
        require(hasRole(MINTER_ROLE, _msgSender()), "TokenForge721: caller has no minter role");
        _;
    }

    address private _signer;
    string private _baseUri;

    event SignerChanged(address indexed oldSigner, address indexed _signer);

    function initialize(
        string memory name_,
        string memory symbol_,
        address signer_,
        string memory baseUri_
    ) public initializer {
        __Ownable_init_unchained();
        __ERC721_init_unchained(name_, symbol_);
        __ERC721Burnable_init_unchained();
        __ERC721Enumerable_init_unchained();
        __ERC721Pausable_init_unchained();
        __ERC721URIStorage_init_unchained();

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
        string memory tokenUri
    ) public onlyMinter {
        _mint(to, tokenId);
        if (bytes(tokenUri).length > 0) {
            _setTokenURI(tokenId, tokenUri);
        }
    }

    function mintToWithSignature(
        address to,
        uint256 tokenId,
        string memory tokenUri,
        bytes memory signature
    ) public {
        validateSignature(to, tokenId, tokenUri, signature);

        _mint(to, tokenId);
        if (bytes(tokenUri).length > 0) {
            _setTokenURI(tokenId, tokenUri);
        }
    }

    function mint(uint256 tokenId, string memory tokenUri) external onlyMinter {
        mintTo(msg.sender, tokenId, tokenUri);

        if (tokenId > _tokenIds.current()) {
            _tokenIds.set(tokenId);
        }
    }

    function mintWithSignature(
        uint256 tokenId,
        string memory tokenUri,
        bytes memory signature
    ) external {
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
    ) public payable {
        bytes32 message = createMessage(to, tokenUri).toEthSignedMessageHash();

        // verifies that the sha3(account, nonce, address(this)) has been signed by _allowancesSigner
        if (message.recover(signature) != signer()) {
            revert("Either signature is wrong or parameters have been corrupted");
        }

        _mintToAuto(to, tokenUri);
    }

    function _mintToAuto(address to, string memory tokenUri) internal {
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
    ) internal override(ERC721Upgradeable, ERC721EnumerableUpgradeable, ERC721PausableUpgradeable) {
        super._beforeTokenTransfer(from, to, amount);
    }

    function _beforeConsecutiveTokenTransfer(
        address from,
        address to,
        uint256 first,
        uint96 size
    ) internal virtual override(ERC721Upgradeable, ERC721EnumerableUpgradeable, ERC721PausableUpgradeable) {
        super._beforeConsecutiveTokenTransfer(from, to, first, size);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        virtual
        override(ERC721Upgradeable, ERC721EnumerableUpgradeable, AccessControlEnumerableUpgradeable)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

    function _burn(uint256 tokenId) internal override(ERC721Upgradeable, ERC721URIStorageUpgradeable) {
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

    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721Upgradeable, ERC721URIStorageUpgradeable)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }

    function withdraw() external onlyOwner {
        uint256 balance = address(this).balance;
        payable(msg.sender).transfer(balance);
    }
}
