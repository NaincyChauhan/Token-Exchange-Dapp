// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

// import "hardhat/console.sol";

contract Token {
    string public name;
    string public symbol;
    uint256 public decimals = 18;
    uint256 public totalSupply;
    bool private sellToken = true;
    address public manager;

    // Transfer Event
    event Transfer(address indexed from, address indexed to, uint256 value);
    // Approval Event
    event Approval(address indexed from, address indexed spender, uint256 value);

    // Track Balances
    mapping (address => uint256) public balanceOf;
    mapping ( address => mapping( address => uint256)) public allowance;

    constructor(string memory _name, string memory _symbol, uint256 _totalSupply){
        name = _name;
        symbol = _symbol;
        totalSupply = _totalSupply * (10**decimals);
        balanceOf[msg.sender] = totalSupply;
        manager = msg.sender;
    }

    function transfer(address _to , uint256 _value) public returns(bool){
        return _transfer(msg.sender, _to, _value);
    }

    function _transfer(address _from, address _to, uint256 _value) internal returns(bool) {
        require(balanceOf[_from] >= _value, "You Don't have enough Balace");
        require(_to != address(0),"Please Enter Correct Address");
        balanceOf[_to] += _value;
        balanceOf[_from] -= _value;
        emit Transfer(_from, _to, _value);
        return true;
    }

    function approve(address _spender,  uint256 _value) public returns(bool success) {
        require(_spender != address(0),"Please Enter Correct Address");
        allowance[msg.sender][_spender] = _value;
        emit Approval(msg.sender , _spender,_value);
        return true;
    }

    function transferFrom(address _from, address _to, uint256 _value) public returns(bool) {
        // Approval
        require(allowance[_from][msg.sender] >= _value, "You Don't have Permission for Transfer the Token");

        // Reset Allownance
        allowance[_from][msg.sender] = allowance[_from][msg.sender] - _value;

        // Spend
        _transfer(_from, _to, _value);
        return true;
    }

    function setSellToken(bool _per) public {
        require(msg.sender == manager, "Permission Denied");
        sellToken = _per;
    }

    // Buy Tokens
    function buyToken() public payable {
        
    }
}
