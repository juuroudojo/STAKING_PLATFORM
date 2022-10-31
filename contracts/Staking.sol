//SPDX-License-Identifier: MIT

pragma solidity ^0.8.11;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "hardhat/console.sol";
import {IERC20} from "@openzeppelin/contracts/interfaces/IERC20.sol";
import {IBBT} from "./interfaces/IBBT.sol";

contract Staking is AccessControl, ReentrancyGuard {
    bytes32 public constant MODIFIER_ROLE = keccak256("MODIFIER_ROLE");
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

    IBBT rewardToken;
    IERC20 lpToken;

    uint interest;
    uint rewardsTimeStamp;
    uint minUnstakeFreezeTime;

    struct Stake {
        uint balance;
        uint timestamp;
    }

    mapping(address => Stake) internal stakes;
    mapping(address => uint) withdrawLock;

    event Claimed(address indexed account, uint amount);
    event Unstaked(address indexed account, uint amount);

    constructor(
        address _lpToken,
        address _rewardToken,
        uint _interest,
        uint _rewardsTimestampInMinutes,
        uint _minUnstakeDays
    ) {
        _setupRole(MODIFIER_ROLE, msg.sender);

        interest = _interest;
        rewardsTimeStamp = _rewardsTimestampInMinutes * 60;
        minUnstakeFreezeTime = _minUnstakeDays * 60 * 60 * 24;

        lpToken = IERC20(_lpToken);
        rewardToken = IBBT(_rewardToken);
    }

    function getStakeInfo(address _from)
        public
        view
        returns (
            uint256 _balance,
            uint256 _timestamp,
            uint256 _rewards
        )
    {
        return (
            stakes[_from].balance,
            stakes[_from].timestamp,
            _calculateRewards(_from)
        );
    }

    function getStakeSettings()
        public
        view
        returns (
            uint256 _interest,
            uint256 _minRewardsTimestamp,
            uint256 _minUnstakeFreezeTime
        )
    {
        return (interest, rewardsTimeStamp, minUnstakeFreezeTime);
    }

    function stake(uint _amount) public nonReentrant {
        uint am = stakes[msg.sender].balance;

        if (stakes[msg.sender].balance > 0) {
            unstake(am);
        }

        lpToken.transferFrom(msg.sender, address(this), _amount);

        Stake storage s = stakes[msg.sender];
        s.balance += _amount;
        s.timestamp = block.timestamp;
        withdrawLock[msg.sender] = block.timestamp + minUnstakeFreezeTime;
    }

    function claim() public nonReentrant {
        Stake storage x = stakes[msg.sender];
        require(
            block.timestamp - x.timestamp >= rewardsTimeStamp,
            "Less than minRewardsTimestamp!"
        );

        uint256 rewardBBP = _calculateRewards(msg.sender);

        rewardToken.mint(msg.sender, rewardBBP);
        x.timestamp = block.timestamp;

        emit Claimed(msg.sender, rewardBBP);
    }

    // If user unstakes a custom amount it makes a new stake with the amount left on balance (resetting everything except for the balance)
    function unstake(uint _amount) public {
        uint totalbalance = stakes[msg.sender].balance;
        uint reward = _calculateRewards(msg.sender);

        require(
            block.timestamp > withdrawLock[msg.sender],
            "Can't unstake yet!"
        );

        require(_amount <= totalbalance, "Not enough funds!");

        claim();

        if (_amount != totalbalance) {
            uint restake = stakes[msg.sender].balance -= _amount;

            stakes[msg.sender].balance = 0;

            lpToken.transfer(msg.sender, _amount);
            _restake(restake);
        } else {
            stakes[msg.sender].balance = 0;
            lpToken.transfer(msg.sender, _amount);
        }

        emit Unstaked(msg.sender, _amount);
        emit Claimed(msg.sender, reward);
    }

    function _restake(uint _amount) internal {
        Stake storage s = stakes[msg.sender];
        s.balance = _amount;
        s.timestamp = block.timestamp;
        withdrawLock[msg.sender] = block.timestamp + minUnstakeFreezeTime;
    }

    function modifyStakeSettings(
        uint256 interest_,
        uint256 rewardsInMinutes_,
        uint256 unstakeFreezeInMinutes_
    ) public onlyRole(MODIFIER_ROLE) returns (bool success) {
        interest = interest_;
        rewardsTimeStamp = rewardsInMinutes_ * 1 minutes;
        minUnstakeFreezeTime = unstakeFreezeInMinutes_ * 1 minutes;
        return true;
    }

    function _calculateRewards(address _holder)
        public
        view
        returns (uint256 amount)
    {
        require(stakes[_holder].timestamp != 0, "Zero timestamp");

        uint256 totalBalance = stakes[_holder].balance;
        uint256 totalTime = block.timestamp - stakes[_holder].timestamp;

        return (((totalBalance * (totalTime / rewardsTimeStamp)) * interest) /
            100);
    }
}
