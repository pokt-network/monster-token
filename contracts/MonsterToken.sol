pragma solidity ^ 0.4 .15;

/**
 * @title SafeMath. Credit to ZeppelinOS: https://zeppelinos.org
 * @dev Math operations with safety checks that throw on error
 */
library SafeMath {

  /**
   * @dev Multiplies two numbers, throws on overflow.
   */
  function mul(uint a, uint b) internal returns(uint c) {
    if (a == 0) {
      return 0;
    }
    c = a * b;
    assert(c / a == b);
    return c;
  }

  /**
   * @dev Integer division of two numbers, truncating the quotient.
   */
  function div(uint a, uint b) internal returns(uint) {
    // assert(b > 0); // Solidity automatically throws when dividing by 0
    // uint c = a / b;
    // assert(a == b * c + a % b); // There is no case in which this doesn't hold
    return a / b;
  }

  /**
   * @dev Subtracts two numbers, throws on overflow (i.e. if subtrahend is greater than minuend).
   */
  function sub(uint a, uint b) internal returns(uint) {
    assert(b <= a);
    return a - b;
  }

  /**
   * @dev Adds two numbers, throws on overflow.
   */
  function add(uint a, uint b) internal returns(uint c) {
    c = a + b;
    assert(c >= a);
    return c;
  }
}

/**
 * @title Ownable. Credit to ZeppelinOS: https://zeppelinos.org
 * @dev The Ownable contract has an owner address, and provides basic authorization control
 * functions, this simplifies the implementation of "user permissions".
 */
contract Ownable {
  address public owner;

  function Ownable(address _sender) {
    owner = _sender;
  }

  /**
   * @dev Throws if called by any account other than the owner.
   */
  modifier onlyOwner() {
    require(msg.sender == owner);
    _;
  }

  /**
   * @dev Allows the current owner to transfer control of the contract to a newOwner.
   * @param newOwner The address to transfer ownership to.
   */
  function transferOwnership(address newOwner) public onlyOwner {
    require(newOwner != address(0));
    owner = newOwner;
  }

}

/**
 * @title ERC721 Non-Fungible Token Standard basic implementation. Credit to ZeppelinOS: https://zeppelinos.org
 * @dev see https://github.com/ethereum/EIPs/blob/master/EIPS/eip-721.md
 */
contract ERC721BasicToken {
  using SafeMath for uint;

  // Events
  event Transfer(address indexed _from, address indexed _to, uint _tokenId);
  event Approval(address indexed _owner, address indexed _approved, uint _tokenId);
  event ApprovalForAll(address indexed _owner, address indexed _operator, bool _approved);

  // Mapping from token ID to owner
  mapping (uint => address) internal tokenOwner;

  // Mapping from token ID to approved address
  mapping (uint => address) internal tokenApprovals;

  // Mapping from owner to number of owned token
  mapping (address => uint) internal ownedTokensCount;

  // Mapping from owner to operator approvals
  mapping (address => mapping (address => bool)) internal operatorApprovals;

  /**
   * @dev Guarantees msg.sender is owner of the given token
   * @param _tokenId uint ID of the token to validate its ownership belongs to msg.sender
   */
  modifier onlyOwnerOf(uint _tokenId) {
    require(ownerOf(_tokenId) == msg.sender);
    _;
  }

  /**
   * @dev Checks msg.sender can transfer a token, by being owner, approved, or operator
   * @param _tokenId uint ID of the token to validate
   */
  modifier canTransfer(uint _tokenId) {
    require(isApprovedOrOwner(msg.sender, _tokenId));
    _;
  }

  /**
   * @dev Gets the balance of the specified address
   * @param _owner address to query the balance of
   * @return uint representing the amount owned by the passed address
   */
  function balanceOf(address _owner) public constant returns (uint) {
    require(_owner != address(0));
    return ownedTokensCount[_owner];
  }

  /**
   * @dev Gets the owner of the specified token ID
   * @param _tokenId uint ID of the token to query the owner of
   * @return owner address currently marked as the owner of the given token ID
   */
  function ownerOf(uint _tokenId) public constant returns (address) {
    address owner = tokenOwner[_tokenId];
    require(owner != address(0));
    return owner;
  }

  /**
   * @dev Returns whether the specified token exists
   * @param _tokenId uint ID of the token to query the existance of
   * @return whether the token exists
   */
  function exists(uint _tokenId) public constant returns (bool) {
    address owner = tokenOwner[_tokenId];
    return owner != address(0);
  }

  /**
   * @dev Approves another address to transfer the given token ID
   * @dev The zero address indicates there is no approved address.
   * @dev There can only be one approved address per token at a given time.
   * @dev Can only be called by the token owner or an approved operator.
   * @param _to address to be approved for the given token ID
   * @param _tokenId uint ID of the token to be approved
   */
  function approve(address _to, uint _tokenId) public {
    address owner = ownerOf(_tokenId);
    require(_to != owner);
    require(msg.sender == owner || isApprovedForAll(owner, msg.sender));

    if (getApproved(_tokenId) != address(0) || _to != address(0)) {
      tokenApprovals[_tokenId] = _to;
      Approval(owner, _to, _tokenId);
    }
  }

  /**
   * @dev Gets the approved address for a token ID, or zero if no address set
   * @param _tokenId uint ID of the token to query the approval of
   * @return address currently approved for a the given token ID
   */
  function getApproved(uint _tokenId) public constant returns (address) {
    return tokenApprovals[_tokenId];
  }

  /**
   * @dev Sets or unsets the approval of a given operator
   * @dev An operator is allowed to transfer all tokens of the sender on their behalf
   * @param _to operator address to set the approval
   * @param _approved representing the status of the approval to be set
   */
  function setApprovalForAll(address _to, bool _approved) public {
    require(_to != msg.sender);
    operatorApprovals[msg.sender][_to] = _approved;
    ApprovalForAll(msg.sender, _to, _approved);
  }

  /**
   * @dev Tells whether an operator is approved by a given owner
   * @param _owner owner address which you want to query the approval of
   * @param _operator operator address which you want to query the approval of
   * @return bool whether the given operator is approved by the given owner
   */
  function isApprovedForAll(address _owner, address _operator) public constant returns (bool) {
    return operatorApprovals[_owner][_operator];
  }

  /**
   * @dev Transfers the ownership of a given token ID to another address
   * @dev Usage of this method is discouraged, use `safeTransferFrom` whenever possible
   * @dev Requires the msg sender to be the owner, approved, or operator
   * @param _from current owner of the token
   * @param _to address to receive the ownership of the given token ID
   * @param _tokenId uint ID of the token to be transferred
  */
  function transferFrom(address _from, address _to, uint _tokenId) public canTransfer(_tokenId) {
    require(_from != address(0));
    require(_to != address(0));

    clearApproval(_from, _tokenId);
    removeTokenFrom(_from, _tokenId);
    addTokenTo(_to, _tokenId);

    Transfer(_from, _to, _tokenId);
  }

  /**
   * @dev Safely transfers the ownership of a given token ID to another address
   * @dev If the target address is a contract, it must implement `onERC721Received`,
   *  which is called upon a safe transfer, and return the magic value
   *  `bytes4(keccak256("onERC721Received(address,uint,bytes)"))`; otherwise,
   *  the transfer is reverted.
   * @dev Requires the msg sender to be the owner, approved, or operator
   * @param _from current owner of the token
   * @param _to address to receive the ownership of the given token ID
   * @param _tokenId uint ID of the token to be transferred
  */
  function safeTransferFrom(
    address _from,
    address _to,
    uint _tokenId
  )
    public
    canTransfer(_tokenId)
  {
    // solium-disable-next-line arg-overflow
    safeTransferFrom(_from, _to, _tokenId, "");
  }

  /**
   * @dev Safely transfers the ownership of a given token ID to another address
   * @dev If the target address is a contract, it must implement `onERC721Received`,
   *  which is called upon a safe transfer, and return the magic value
   *  `bytes4(keccak256("onERC721Received(address,uint,bytes)"))`; otherwise,
   *  the transfer is reverted.
   * @dev Requires the msg sender to be the owner, approved, or operator
   * @param _from current owner of the token
   * @param _to address to receive the ownership of the given token ID
   * @param _tokenId uint ID of the token to be transferred
   * @param _data bytes data to send along with a safe transfer check
   */
  function safeTransferFrom(
    address _from,
    address _to,
    uint _tokenId,
    bytes _data
  )
    public
    canTransfer(_tokenId)
  {
    transferFrom(_from, _to, _tokenId);
    // solium-disable-next-line arg-overflow
    require(checkAndCallSafeTransfer(_from, _to, _tokenId, _data));
  }

  /**
   * @dev Returns whether the given spender can transfer a given token ID
   * @param _spender address of the spender to query
   * @param _tokenId uint ID of the token to be transferred
   * @return bool whether the msg.sender is approved for the given token ID,
   *  is an operator of the owner, or is the owner of the token
   */
  function isApprovedOrOwner(address _spender, uint _tokenId) internal constant returns (bool) {
    address owner = ownerOf(_tokenId);
    return _spender == owner || getApproved(_tokenId) == _spender || isApprovedForAll(owner, _spender);
  }

  /**
   * @dev Internal function to mint a new token
   * @dev Reverts if the given token ID already exists
   * @param _to The address that will own the minted token
   * @param _tokenId uint ID of the token to be minted by the msg.sender
   */
  function _mint(address _to, uint _tokenId) internal {
    require(_to != address(0));
    addTokenTo(_to, _tokenId);
    Transfer(address(0), _to, _tokenId);
  }

  /**
   * @dev Internal function to burn a specific token
   * @dev Reverts if the token does not exist
   * @param _tokenId uint ID of the token being burned by the msg.sender
   */
  function _burn(address _owner, uint _tokenId) internal {
    clearApproval(_owner, _tokenId);
    removeTokenFrom(_owner, _tokenId);
    Transfer(_owner, address(0), _tokenId);
  }

  /**
   * @dev Internal function to clear current approval of a given token ID
   * @dev Reverts if the given address is not indeed the owner of the token
   * @param _owner owner of the token
   * @param _tokenId uint ID of the token to be transferred
   */
  function clearApproval(address _owner, uint _tokenId) internal {
    require(ownerOf(_tokenId) == _owner);
    if (tokenApprovals[_tokenId] != address(0)) {
      tokenApprovals[_tokenId] = address(0);
      Approval(_owner, address(0), _tokenId);
    }
  }

  /**
   * @dev Internal function to add a token ID to the list of a given address
   * @param _to address representing the new owner of the given token ID
   * @param _tokenId uint ID of the token to be added to the tokens list of the given address
   */
  function addTokenTo(address _to, uint _tokenId) internal {
    require(tokenOwner[_tokenId] == address(0));
    tokenOwner[_tokenId] = _to;
    ownedTokensCount[_to] = ownedTokensCount[_to].add(1);
  }

  /**
   * @dev Internal function to remove a token ID from the list of a given address
   * @param _from address representing the previous owner of the given token ID
   * @param _tokenId uint ID of the token to be removed from the tokens list of the given address
   */
  function removeTokenFrom(address _from, uint _tokenId) internal {
    require(ownerOf(_tokenId) == _from);
    ownedTokensCount[_from] = ownedTokensCount[_from].sub(1);
    tokenOwner[_tokenId] = address(0);
  }

  /**
   * @dev Internal function to invoke `onERC721Received` on a target address
   * @dev The call is not executed if the target address is not a contract
   * @dev _to must always be an account, not a contract!
   * @param _from address representing the previous owner of the given token ID
   * @param _to target address that will receive the tokens
   * @param _tokenId uint ID of the token to be transferred
   * @param _data bytes optional data to send along with the call
   * @return whether the call correctly returned the expected magic value
   */
  function checkAndCallSafeTransfer(
    address _from,
    address _to,
    uint _tokenId,
    bytes _data
  )
    internal
    returns (bool)
  {
    return true;
  }
}

/**
 * @title Full ERC721 Token
 * This implementation includes all the required and some optional functionality of the ERC721 standard
 * Moreover, it includes approve all functionality using operator terminology
 * @dev see https://github.com/ethereum/EIPs/blob/master/EIPS/eip-721.md
 * @dev Credit to ZeppelinOS: https://zeppelinos.org
 */
contract ERC721Token is ERC721BasicToken {
  // Token name
  string internal name_;

  // Token symbol
  string internal symbol_;

  // Mapping from owner to list of owned token IDs
  mapping (address => uint[]) internal ownedTokens;

  // Mapping from token ID to index of the owner tokens list
  mapping(uint => uint) internal ownedTokensIndex;

  // Array with all token ids, used for enumeration
  uint[] internal allTokens;

  // Mapping from token id to position in the allTokens array
  mapping(uint => uint) internal allTokensIndex;

  // Optional mapping for token URIs
  mapping(uint => string) internal tokenURIs;

  /**
   * @dev Constructor function
   */
  function ERC721Token(string _name, string _symbol) public {
    name_ = _name;
    symbol_ = _symbol;
  }

  /**
   * @dev Gets the token name
   * @return string representing the token name
   */
  function name() public constant returns (string) {
    return name_;
  }

  /**
   * @dev Gets the token symbol
   * @return string representing the token symbol
   */
  function symbol() public constant returns (string) {
    return symbol_;
  }

  /**
   * @dev Returns an URI for a given token ID
   * @dev Throws if the token ID does not exist. May return an empty string.
   * @param _tokenId uint ID of the token to query
   */
  function tokenURI(uint _tokenId) public constant returns (string) {
    require(exists(_tokenId));
    return tokenURIs[_tokenId];
  }

  /**
   * @dev Gets the token ID at a given index of the tokens list of the requested owner
   * @param _owner address owning the tokens list to be accessed
   * @param _index uint representing the index to be accessed of the requested tokens list
   * @return uint token ID at the given index of the tokens list owned by the requested address
   */
  function tokenOfOwnerByIndex(address _owner, uint _index) public constant returns (uint) {
    require(_index < balanceOf(_owner));
    return ownedTokens[_owner][_index];
  }

  /**
   * @dev Gets the total amount of tokens stored by the contract
   * @return uint representing the total amount of tokens
   */
  function totalSupply() public constant returns (uint) {
    return allTokens.length;
  }

  /**
   * @dev Gets the token ID at a given index of all the tokens in this contract
   * @dev Reverts if the index is greater or equal to the total number of tokens
   * @param _index uint representing the index to be accessed of the tokens list
   * @return uint token ID at the given index of the tokens list
   */
  function tokenByIndex(uint _index) public constant returns (uint) {
    require(_index < totalSupply());
    return allTokens[_index];
  }

  /**
   * @dev Internal function to set the token URI for a given token
   * @dev Reverts if the token ID does not exist
   * @param _tokenId uint ID of the token to set its URI
   * @param _uri string URI to assign
   */
  function _setTokenURI(uint _tokenId, string _uri) internal {
    require(exists(_tokenId));
    tokenURIs[_tokenId] = _uri;
  }

  /**
   * @dev Internal function to add a token ID to the list of a given address
   * @param _to address representing the new owner of the given token ID
   * @param _tokenId uint ID of the token to be added to the tokens list of the given address
   */
  function addTokenTo(address _to, uint _tokenId) internal {
    super.addTokenTo(_to, _tokenId);
    uint length = ownedTokens[_to].length;
    ownedTokens[_to].push(_tokenId);
    ownedTokensIndex[_tokenId] = length;
  }

  /**
   * @dev Internal function to remove a token ID from the list of a given address
   * @param _from address representing the previous owner of the given token ID
   * @param _tokenId uint ID of the token to be removed from the tokens list of the given address
   */
  function removeTokenFrom(address _from, uint _tokenId) internal {
    super.removeTokenFrom(_from, _tokenId);

    uint tokenIndex = ownedTokensIndex[_tokenId];
    uint lastTokenIndex = ownedTokens[_from].length.sub(1);
    uint lastToken = ownedTokens[_from][lastTokenIndex];

    ownedTokens[_from][tokenIndex] = lastToken;
    ownedTokens[_from][lastTokenIndex] = 0;
    // Note that this will handle single-element arrays. In that case, both tokenIndex and lastTokenIndex are going to
    // be zero. Then we can make sure that we will remove _tokenId from the ownedTokens list since we are first swapping
    // the lastToken to the first position, and then dropping the element placed in the last position of the list

    ownedTokens[_from].length--;
    ownedTokensIndex[_tokenId] = 0;
    ownedTokensIndex[lastToken] = tokenIndex;
  }

  /**
   * @dev Internal function to mint a new token
   * @dev Reverts if the given token ID already exists
   * @param _to address the beneficiary that will own the minted token
   * @param _tokenId uint ID of the token to be minted by the msg.sender
   */
  function _mint(address _to, uint _tokenId) internal {
    super._mint(_to, _tokenId);

    allTokensIndex[_tokenId] = allTokens.length;
    allTokens.push(_tokenId);
  }

  /**
   * @dev Internal function to burn a specific token
   * @dev Reverts if the token does not exist
   * @param _owner owner of the token to burn
   * @param _tokenId uint ID of the token being burned by the msg.sender
   */
  function _burn(address _owner, uint _tokenId) internal {
    super._burn(_owner, _tokenId);

    // Clear metadata (if any)
    if (bytes(tokenURIs[_tokenId]).length != 0) {
      delete tokenURIs[_tokenId];
    }

    // Reorg all tokens array
    uint tokenIndex = allTokensIndex[_tokenId];
    uint lastTokenIndex = allTokens.length.sub(1);
    uint lastToken = allTokens[lastTokenIndex];

    allTokens[tokenIndex] = lastToken;
    allTokens[lastTokenIndex] = 0;

    allTokens.length--;
    allTokensIndex[_tokenId] = 0;
    allTokensIndex[lastToken] = tokenIndex;
  }

}

/**
 * @title TavernQuestReward
 */
interface TavernQuestReward {

  // Validates the parameters for a new quest
  function validateQuest(string _name, string _hint, uint _maxWinners, string _metadata, uint _prize) public returns(bool);

  // Mint reward
  function rewardCompletion(address _tavern, address _winner, uint _questIndex) public returns(bool);
}

/**
 * @title Tavern
 * @dev For full implementation see: https://github.com/pokt-network/tavern-aion
 */
interface Tavern {
  function isWinner(address _tokenAddress, uint _questIndex, address _allegedWinner) public constant returns(bool);
  function isClaimer(address _tokenAddress, uint _questIndex, address _allegedClaimer) public constant returns(bool);
  function getQuestMetadata(address _tokenAddress, uint _questIndex) public constant returns(string);
}

/**
 * @title MonsterToken
 */
contract MonsterToken is Ownable, ERC721Token, TavernQuestReward {
  // State
  mapping(uint => uint) internal tokenQuestIndex;
  address internal tavernAddress;
  address[] internal tokenOwnersIndex;
  // Indicates this contract version
  uint public version = 1;

  // Initializer
  function MonsterToken(address _owner, address _tavernAddress) ERC721Token("MonsterToken", "MCT") Ownable(_owner) public {
    require(isValidAddress(_owner) == true);
    require(isValidAddress(_tavernAddress) == true);
    tavernAddress = _tavernAddress;
  }

  // Validates the parameters for a new quest
  function validateQuest(string _name, string _hint, uint _maxWinners, string _metadata, uint _prize) public returns(bool) {
    return isValidString(_name) && isValidString(_hint) && _prize > 0 ? _maxWinners > 0 : true && isValidString(_metadata);
  }

  // Mint reward
  function rewardCompletion(address _tavern, address _winner, uint _questIndex) public returns(bool) {
    require(isValidAddress(_winner));
    require(isValidTavern(_tavern));
    bool result = false;

    Tavern tavernInterface = Tavern(tavernAddress);
    bool isWinner = tavernInterface.isWinner(this, _questIndex, _winner) == true;
    bool canClaim = tavernInterface.isClaimer(this, _questIndex, _winner) == false;
    if (isWinner && canClaim) {
      _mintQuestReward(_winner, _questIndex);
      result = true;
    }

    return result;
  }

  function _mintQuestReward(address _winner, uint _questIndex) internal {
    // Generate next token id
    uint nextTokenId = allTokens.length;

    // Mint the token
    super._mint(_winner, nextTokenId);

    // Add to owners index if not exists
    // We check for 1 because the _mint function will increase by 1 the count
    if (ownedTokensCount[_winner] == 1) {
      tokenOwnersIndex.push(_winner);
    }

    // Set token quest index
    _setTokenQuestIndex(nextTokenId, _questIndex);
  }

  // Sets token quest
  function _setTokenQuestIndex(uint _tokenId, uint _questIndex) internal {
    require(exists(_tokenId));
    tokenQuestIndex[_tokenId] = _questIndex;
  }

  // Retrieves quest
  function getTokenQuestIndex(uint _tokenId) public constant returns(uint) {
    require(exists(_tokenId));
    return tokenQuestIndex[_tokenId];
  }

  function isValidAddress(address _addressToCheck) internal returns(bool) {
    return _addressToCheck != address(0);
  }

  function isValidString(string _stringToCheck) internal returns(bool) {
    return bytes(_stringToCheck).length > 0;
  }

  function isValidTavern(address _addressToCheck) internal constant returns(bool) {
    return _addressToCheck == tavernAddress;
  }

  function getOwnersCount() public constant returns(uint) {
    return tokenOwnersIndex.length;
  }

  function getOwnerTokenCountByIndex(uint _ownerIndex) public constant returns(address, uint) {
    address owner = tokenOwnersIndex[_ownerIndex];
    return (owner, ownedTokensCount[owner]);
  }
}