// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;
import "./Token.sol";
// import "hardhat/console.sol";

contract Exchange {
    address public feeAccount;
    uint256 public feePercent;
    uint256 public orderCount;
    // Mapping
    mapping (address => mapping(address => uint256)) public tokens;
    mapping (uint256 => _Order) public orders;
    mapping(uint256 => bool ) public cancleOrders;
    mapping(uint256 => bool ) public OrderFilled;
    // Events
    event Deposit(address token, address user, uint256 amount, uint256 balance);
    event Withdraw(address token, address user, uint256 amount, uint256 balance);
    event Order(uint256 id, address user, address tokenGet, uint256 amountGet, address tokenGive, uint256 amountGive, uint256 timestamp);
    event cancleOrder(uint256 id, address user, address tokenGet, uint256 amountGet, address tokenGive, uint256 amountGive, uint256 timestamp);
    event Trade(uint256 id, address user, address tokenGet, uint256 amountGet, address tokenGive, uint256 amountGive, address creater, uint256 timestamp);

    constructor(address _feeAccount, uint256 _feePercent){
        feeAccount = _feeAccount;
        feePercent = _feePercent;
    }

    struct _Order {
        uint256 id;
        address user;
        address tokenGet;
        uint256 amountGet;
        address tokenGive;
        uint256 amountGive;
        uint256 timestamp;
    }

    // Deposit Tokens
    function depositToken(address _token,uint256 _amount) public {
        // Transfer Token
        require(Token(_token).transferFrom(msg.sender, address(this), _amount));
        // Update user Balance
        tokens[_token][msg.sender] = tokens[_token][msg.sender]+_amount;
        // Emit Then Event
        emit Deposit(_token, msg.sender, _amount, tokens[_token][msg.sender]);
    }

    // withdraw Tokens
    function withdrawToken(address _token,uint256 _amount) public {
        require(tokens[_token][msg.sender] >= _amount, "You have not enough Balance.");
        // Transfer Token
        Token(_token).transfer(msg.sender, _amount);
        // Update user Balance
        tokens[_token][msg.sender] = tokens[_token][msg.sender]-_amount;
        // Emit Then Event
        emit Withdraw(_token, msg.sender, _amount, tokens[_token][msg.sender]);
    }

    // Check Balances
    function balanceOf(address _token, address _user) public view returns(uint256) {
        return tokens[_token][_user];
    }

    // Make Order
    function makeOrder(address _tokenGet, uint256 _amountGet, address _tokenGive, uint256 _amountGive)  public {
        require(balanceOf(_tokenGive,msg.sender) >= _amountGive,"Not Have Enough balance.");
        orderCount++;
        orders[orderCount] = _Order(
            orderCount,
            msg.sender,
            _tokenGet,
            _amountGet,
            _tokenGive,
            _amountGive,
            block.timestamp        
        );
        // Emit the order Event
        emit Order(orderCount, msg.sender, _tokenGet, _amountGet, _tokenGive, _amountGive, block.timestamp);
    }

    // Cancel Order
    function cancelOrder(uint256 id) public {
        _Order storage _order = orders[id];
        require(id == _order.id, "Order Doest not Exits");
        require(_order.user == msg.sender,"Permission Error");
        cancleOrders[_order.id] = true;
        emit cancleOrder(_order.id, msg.sender, _order.tokenGet, _order.amountGet, _order.tokenGive, _order.amountGive, block.timestamp);
    }

    // Fill The Order
    function fillOrder(uint256 _id) public {
        _Order storage _order = orders[_id];
        require(_id == _order.id, "Order Doest not Exits");
        require(OrderFilled[_id] != true, "Order Doest not Exits");
        require(cancleOrders[_id] != true, "Order Doest not Exits");
        _fillOrder(_order.id,_order.user,_order.tokenGet,_order.amountGet,_order.tokenGive,_order.amountGive);
    }

    function _fillOrder(uint256 _id,address _user, address _tokenGet, uint256 _amountGet, address _tokenGive, uint256 _amountGive) internal {
        require(tokens[_tokenGet][msg.sender] >= _amountGet, "Not Enough Tokens");
        uint256 _fee = (_amountGive / 100) * feePercent; 
        // Update User Balances
        tokens[_tokenGet][_user] += _amountGet;
        tokens[_tokenGive][_user] -= _amountGive;

        _amountGive = _amountGive - _fee;
        tokens[_tokenGive][msg.sender] += _amountGive;
        tokens[_tokenGet][msg.sender] -= _amountGet;

        tokens[_tokenGive][feeAccount] += _fee;
        // Order Fill
        OrderFilled[_id] = true;
        // Emit Event
        emit Trade(_id, msg.sender, _tokenGet, _amountGet, _tokenGive, _amountGive, _user, block.timestamp);
    }
}
