import { ethers } from "hardhat";

async function main() {
  const Weth = await ethers.getContractFactory("WETH");
  const weth = await Weth.deploy();

  await weth.deployed();

  console.log("Token deployed to:", weth.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
