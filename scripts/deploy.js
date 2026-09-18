const { ethers } = require("hardhat");

async function main() {
  const CivicVoting = await ethers.getContractFactory("CivicVoting");
  console.log("Deploying CivicVoting to Polygon Amoy...");
  const contract = await CivicVoting.deploy();
  await contract.waitForDeployment();
  const address = await contract.getAddress();
  console.log("CivicVoting deployed to:", address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
