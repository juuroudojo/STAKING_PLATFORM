import { expect } from "chai";
import { ethers, network } from "hardhat";
import { Contract, ContractFactory, providers, BigNumber } from "ethers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import "@nomiclabs/hardhat-etherscan";
import { readFile } from "fs/promises";


describe("Staking test", function () {
  let Staking: ContractFactory;
  let staking: Contract;
  let rewardToken: Contract;
  let MrWhite: SignerWithAddress;
  let Jesse: SignerWithAddress;
  let Hamota: SignerWithAddress;
  let lpHolder: providers.JsonRpcSigner;
  let lpToken: Contract;
  let ADMIN: providers.JsonRpcSigner;
  const minutes = 60;
  const days = 86400;

  // const MINTER_ROLE = "0x9f2df0fed2c77648de5860a4cc508cd0818c85b8b8a1ab4ceeef8d981c8956a6";

  const lpHolderAddress = "0x7A34b2f0DA5ea35b5117CaC735e99Ba0e2aCEECD";

  const rewardAddress = "0x57416132eC5E29E78dF198d4bc42D12769D409AB";
  const lpTokenAddress = "0xC69067F9267ce183DC57CA7e1Ef318cDd137569D";


  const sendLp = async (to: string, amount: BigNumber) => {
    await network.provider.request({ method: "hardhat_impersonateAccount", params: [lpHolderAddress] });
    await network.provider.send("hardhat_setBalance", [lpHolderAddress, "0xffffffffffffffffff"]);

    lpHolder = ethers.provider.getSigner(lpHolderAddress);

    await lpToken.connect(lpHolder).transfer(to, amount);
    await network.provider.request({ method: "hardhat_stopImpersonatingAccount", params: [lpHolderAddress] })
  };

  const initialize = async function (to: string) {
    await network.provider.request(
      {
        method: "hardhat_impersonateAccount",
        params: [lpHolderAddress]
      }
    );
    await network.provider.send(
      "hardhat_setBalance",
      [lpHolderAddress, "0xffffffffffffffffff"]
    );

    ADMIN = ethers.provider.getSigner(lpHolderAddress);
    rewardToken = await ethers.getContractAt("BepaBenTen", rewardAddress);

    await rewardToken.connect(ADMIN).initializeStaking(to);
    await network.provider.request(
      {
        method: "hardhat_stopImpersonatingAccount",
        params: [lpHolderAddress]
      }
    );
  };

  before(async function () {
    [MrWhite, Jesse, Hamota] = await ethers.getSigners();

    const rewardToken = await ethers.getContractAt("BepaBenTen", rewardAddress);

    const ABI = await readFile("../staking_ba/abi/abi.json");
    const VAR = JSON.parse(ABI.toString());
    lpToken = await ethers.getContractAt(VAR, lpTokenAddress);
  });

  beforeEach(async function () {
    Staking = await ethers.getContractFactory("Staking");
    staking = await Staking.deploy(lpTokenAddress, rewardAddress, 10, 60, 1);
    await staking.deployed();
  });

  it("Should configure staking correctly", async function () {
    const tx = await staking.modifyStakeSettings(10, 30, 50);
    await tx.wait(1);
    console.log(await staking.getStakeSettings());

    const StakeSettings = await staking.getStakeSettings();

    expect(StakeSettings[0]).to.equal(10);
    expect(StakeSettings[1]).to.equal(30 * 60);
    expect(StakeSettings[2]).to.equal(50 * 60);

    expect(staking.connect(Hamota).modifyStakeSettings(10, 20, 40)).to.be.revertedWith("Not an owner!");
  });

  it("Staking: Should stake and calculate rewards", async function () {
    await sendLp(MrWhite.address, ethers.utils.parseEther("0.0001"));
    await lpToken.approve(staking.address, ethers.utils.parseEther("0.0001"));
    await staking.stake(ethers.utils.parseEther("0.0001"));

    expect(await lpToken.balanceOf(staking.address)).to.equal(ethers.utils.parseEther("0.0001"));

    // Skipping time
    await ethers.provider.send('evm_increaseTime', [60 * minutes]);
    await ethers.provider.send('evm_mine', []);

    const reward = await staking._calculateRewards(MrWhite.address);

    expect(Number(reward)).to.be.greaterThan(9999999999999);
  });

  it("Staking: Should stake the second time correctly", async function () {
    await sendLp(MrWhite.address, ethers.utils.parseEther("0.000001"));
    await lpToken.approve(staking.address, ethers.utils.parseEther("0.000001"));
    await staking.stake(ethers.utils.parseEther("0.0000005"));

    await ethers.provider.send('evm_increaseTime', [60 * minutes]);
    await ethers.provider.send('evm_mine', []);

    expect(staking.stake(ethers.utils.parseEther("0.0000005"))).to.be.revertedWith("Can't unstake yet!");
  })

  it("Staking: Should claim", async function () {
    await sendLp(MrWhite.address, ethers.utils.parseEther("0.001"));
    await lpToken.approve(staking.address, ethers.utils.parseEther("0.001"));
    await staking.stake(ethers.utils.parseEther("0.001"));


    const initialBalance = BigNumber.from(await lpToken.balanceOf(MrWhite.address));

    // Skipping time
    await ethers.provider.send('evm_increaseTime', [40 * minutes]);
    await ethers.provider.send('evm_mine', []);

    expect(staking.claim()).to.be.revertedWith("Less than minRewardsTimestamp!");

    await ethers.provider.send('evm_increaseTime', [20 * minutes]);
    await ethers.provider.send('evm_mine', []);

    expect(staking.claim()).to.be.revertedWith('revertMessage');

    await initialize(staking.address);
    await staking.claim();

    const afterBalance = BigNumber.from(await lpToken.balanceOf(MrWhite.address));
    const finalBalance = afterBalance.sub(initialBalance).toString();

    expect(finalBalance).to.equal(ethers.utils.parseEther("0"));
  });

  it("Staking: Should fail to unstake, _calculateRewards and claim", async function () {
    await sendLp(MrWhite.address, ethers.utils.parseEther("0.0001"));
    await lpToken.approve(staking.address, ethers.utils.parseEther("0.0001"));
    await staking.stake(ethers.utils.parseEther("0.0001"));

    expect(staking._calculateRewards(Jesse.address)).to.be.revertedWith("Zero timestamp");
    expect(staking.unstake(ethers.utils.parseEther("0.0001"))).to.be.revertedWith("Can't unstake yet!");
    expect(staking.claim()).to.be.revertedWith("Less than minRewardsTimestamp!");
  });

  it("Staking: Should fail to unstake(Not enough funds!)", async function () {
    await sendLp(MrWhite.address, ethers.utils.parseEther("0.0001"));
    await lpToken.approve(staking.address, ethers.utils.parseEther("0.0001"));
    await staking.stake(ethers.utils.parseEther("0.0001"));
    await initialize(staking.address);

    await ethers.provider.send('evm_increaseTime', [3 * days]);
    await ethers.provider.send('evm_mine', []);

    expect(staking.unstake(ethers.utils.parseEther("0.5"))).to.be.revertedWith("Not enough funds!");
  })

  it("Staking: Should unstake a custom amount", async function () {
    await sendLp(MrWhite.address, ethers.utils.parseEther("0.0001"));
    await lpToken.approve(staking.address, ethers.utils.parseEther("0.0001"));
    await staking.stake(ethers.utils.parseEther("0.0001"));

    const initialBalance = BigNumber.from(await lpToken.balanceOf(MrWhite.address));

    await initialize(staking.address);

    // // Skipping time

    await ethers.provider.send('evm_increaseTime', [3 * days]);
    await ethers.provider.send('evm_mine', []);

    await staking.unstake(ethers.utils.parseEther("0.00005"));

    const afterBalance = BigNumber.from(await lpToken.balanceOf(MrWhite.address));
    const finalBalance = afterBalance.sub(initialBalance).toString();

    expect(finalBalance).to.equal(ethers.utils.parseEther("0.00005"));
  });

  it("Staking: Should unstake full amount", async function () {
    await sendLp(MrWhite.address, ethers.utils.parseEther("0.0001"));
    await lpToken.approve(staking.address, ethers.utils.parseEther("0.0001"));
    await staking.stake(ethers.utils.parseEther("0.0001"));

    const initialBalance = BigNumber.from(await lpToken.balanceOf(MrWhite.address));

    await initialize(staking.address);

    // // Skipping time

    await ethers.provider.send('evm_increaseTime', [3 * days]);
    await ethers.provider.send('evm_mine', []);

    await staking.unstake(ethers.utils.parseEther("0.0001"));

    const afterBalance = BigNumber.from(await lpToken.balanceOf(MrWhite.address));
    const finalBalance = afterBalance.sub(initialBalance).toString();

    expect(finalBalance).to.equal(ethers.utils.parseEther("0.0001"));
  });

  it("Staking: Should getStakeInfo", async function () {
    await sendLp(MrWhite.address, ethers.utils.parseEther("0.001"));
    await lpToken.approve(staking.address, ethers.utils.parseEther("0.001"));
    await staking.stake(ethers.utils.parseEther("0.001"));

    const stakeInfo = await staking.getStakeInfo(MrWhite.address);

    expect(stakeInfo[0]).to.equal(ethers.utils.parseEther("0.001"));
    expect(stakeInfo[2]).to.equal("0");
  });

});
