import "@nomiclabs/hardhat-ethers";
import { task } from "hardhat/config";


task("stake", "Stakes `amount` of LP tokens")
  .addParam("amount", "Amount of tokens to stake")
  .setAction(async (taskArgs, { ethers }) => {
    const staking = await ethers.getContractAt("Staking", "0x81682a8140Ae5D28d9a88DfAc6aECC930DE3973d");

    const transaction = (await staking.stake(taskArgs.amount)).wait();
    console.log(transaction);
  });
