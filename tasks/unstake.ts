import "@nomiclabs/hardhat-ethers";
import { task } from "hardhat/config";


task("unstake", "Stakes `amount` of LP tokens")
  .addParam("amount", "Amount of tokens to stake")
  .setAction(async (taskArgs, { ethers }) => {
    const addr = "0x81682a8140Ae5D28d9a88DfAc6aECC930DE3973d"
    const staking = await ethers.getContractAt("Staking", addr);
    
    const transaction = await (await staking.unstake(taskArgs.amount)).wait();
    console.log(transaction);
  });