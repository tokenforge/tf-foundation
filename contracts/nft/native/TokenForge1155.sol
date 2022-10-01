// SPDX-License-Identifier: UNLICENSED
// (C) by TokenForge GmbH, Berlin
// Author: Hagen Hübel, hagen@token-forge.io

pragma solidity >=0.8.3;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Burnable.sol";
import "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Supply.sol";

contract TokenForge1155 is ERC1155Burnable, ERC1155Supply, Ownable {
    using ECDSA for bytes32;

    address private _signer;

    mapping(uint256 => string) private _tokenUris;

    event SignerChanged(address indexed oldSigner, address indexed _signer);

    constructor(address signer_, string memory baseUri_) ERC1155(baseUri_) {
        _signer = signer_;
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
            revert("Either signature is wrong or parameters have been corrupted");
        }

        return message;
    }

    function mintTo(
        address to,
        uint256 tokenId,
        uint256 amount,
        string memory tokenUri,
        bytes memory signature
    ) public {
        validateSignature(to, tokenId, amount, tokenUri, signature);

        bytes memory data;
        _mint(to, tokenId, amount, data);

        if (bytes(tokenUri).length > 0) {
            _setTokenUri(tokenId, tokenUri);
        }
    }

    function mint(
        uint256 tokenId,
        uint256 amount,
        string memory tokenUri,
        bytes memory signature
    ) external {
        mintTo(msg.sender, tokenId, amount, tokenUri, signature);
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

    function withdraw() external onlyOwner {
        uint256 balance = address(this).balance;
        payable(msg.sender).transfer(balance);
    }
}
