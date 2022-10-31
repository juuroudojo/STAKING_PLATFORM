import { ethers } from "hardhat";

async function main() {
  const lpadress = "0xC69067F9267ce183DC57CA7e1Ef318cDd137569D";
  const rewardAdress = "0x57416132eC5E29E78dF198d4bc42D12769D409AB";
  
  const Stake = await ethers.getContractFactory("Staking");
  const stake = await Stake.deploy(lpadress, rewardAdress, 5, 60, 2);

  await stake.deployed();

  console.log("Token deployed to:", stake.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
