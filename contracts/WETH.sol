//SPDX-License-Identifier: MIT
pragma solidity ^0.8.11;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract WETH is ERC20("Wrapped Ether", "WETH") {
    event Deposit(address indexed account, uint amount);
    event Withdrawal(address indexed account, uint amount);

    function deposit() public payable {
        _mint(msg.sender, msg.value);

        emit Deposit(msg.sender, msg.value);
    }

    function withdraw(uint _amount) public {
        _burn(msg.sender, _amount);
        payable(msg.sender).transfer(_amount);

        emit Withdrawal(msg.sender, _amount);
    }

    receive() external payable {
        deposit();
    }
}
