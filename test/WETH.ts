import { expect } from "chai";
import { ethers } from "hardhat";
import { Contract, ContractFactory, providers,} from "ethers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import "@nomiclabs/hardhat-etherscan";

describe("WETHTest", function () {
  let token: Contract;
  let Token: ContractFactory;
  let Luffy: SignerWithAddress;
  let Zoro: SignerWithAddress;
  let Sanji: SignerWithAddress;
  const zeroAddress = "0x0000000000000000000000000000000000000000";
  

before(async function () {
  [Luffy, Zoro, Sanji] = await ethers.getSigners();
});

beforeEach(async function () {
  Token = await ethers.getContractFactory("WETH");
  token = await Token.deploy();
  await token.deployed();
});

it("Should deposit correctly", async function() {
  await token.connect(Sanji).deposit({value:ethers.utils.parseEther("1")});
  
  expect(await token.balanceOf(Sanji.address)).to.eq(ethers.utils.parseEther("1"));
  expect(await ethers.provider.getBalance(token.address)).to.eq(ethers.utils.parseEther("1"));
})

it("Should withdraw correctly", async function() {
  await token.connect(Sanji).deposit({value:ethers.utils.parseEther("1")});
  await token.connect(Sanji).withdraw(ethers.utils.parseEther("0.7"));
  expect(await token.balanceOf(Sanji.address)).to.eq(ethers.utils.parseEther("0.3"));
  expect(await ethers.provider.getBalance(token.address)).to.eq(ethers.utils.parseEther("0.3"));
})

it("Should execute receive", async function() {
  await Luffy.sendTransaction
  ({to: token.address,
  value: ethers.utils.parseEther("1"),});

  expect(await ethers.provider.getBalance(token.address)).to.eq(ethers.utils.parseEther("1"));
});
});