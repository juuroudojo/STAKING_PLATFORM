//SPDX-License-Identifier: MIT
pragma solidity ^0.8.11;

interface IWETH {
    function deposit() external payable;

    function withdraw(uint _amount) external;

    function totalSupply() external view returns (uint);

    function approve(address _to, uint _amount) external;

    function transfer(address _account, uint _amount) external;

    function transferFrom(
        address _from,
        address _to,
        uint _amount
    ) external;
}
