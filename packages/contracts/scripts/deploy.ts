import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);
  console.log("Account balance:", (await ethers.provider.getBalance(deployer.address)).toString());

  // ── 1. SyntiantToken (SAT) ──────────────────────────────────────────
  console.log("\n1. Deploying SyntiantToken...");
  const SyntiantToken = await ethers.getContractFactory("SyntiantToken");
  const syntiantToken = await SyntiantToken.deploy(deployer.address);
  await syntiantToken.waitForDeployment();
  const satAddress = await syntiantToken.getAddress();
  console.log("   SyntiantToken deployed at:", satAddress);

  // ── 2. PropertyNFT ──────────────────────────────────────────────────
  console.log("\n2. Deploying PropertyNFT...");
  const PropertyNFT = await ethers.getContractFactory("PropertyNFT");
  const propertyNFT = await PropertyNFT.deploy(deployer.address);
  await propertyNFT.waitForDeployment();
  const nftAddress = await propertyNFT.getAddress();
  console.log("   PropertyNFT deployed at:", nftAddress);

  // ── 3. PropertyTokenFactory ─────────────────────────────────────────
  console.log("\n3. Deploying PropertyTokenFactory...");
  const PropertyTokenFactory = await ethers.getContractFactory("PropertyTokenFactory");
  const factory = await PropertyTokenFactory.deploy(satAddress, nftAddress, deployer.address);
  await factory.waitForDeployment();
  const factoryAddress = await factory.getAddress();
  console.log("   PropertyTokenFactory deployed at:", factoryAddress);

  // ── 4. Marketplace ──────────────────────────────────────────────────
  console.log("\n4. Deploying Marketplace...");
  const Marketplace = await ethers.getContractFactory("Marketplace");
  const marketplace = await Marketplace.deploy(satAddress, deployer.address);
  await marketplace.waitForDeployment();
  const marketplaceAddress = await marketplace.getAddress();
  console.log("   Marketplace deployed at:", marketplaceAddress);

  // ── 5. GovernanceDAO ────────────────────────────────────────────────
  console.log("\n5. Deploying GovernanceDAO...");
  const GovernanceDAO = await ethers.getContractFactory("GovernanceDAO");
  const dao = await GovernanceDAO.deploy(factoryAddress, deployer.address);
  await dao.waitForDeployment();
  const daoAddress = await dao.getAddress();
  console.log("   GovernanceDAO deployed at:", daoAddress);

  // ── 6. Post-deployment configuration ────────────────────────────────
  console.log("\n6. Configuring cross-contract permissions...");

  // Authorise the factory to update property statuses on the NFT contract
  const authTx = await propertyNFT.addAuthorizedContract(factoryAddress);
  await authTx.wait();
  console.log("   PropertyTokenFactory authorised on PropertyNFT");

  // ── Summary ─────────────────────────────────────────────────────────
  console.log("\n══════════════════════════════════════════════════════════");
  console.log("  Deployment Summary");
  console.log("══════════════════════════════════════════════════════════");
  console.log(`  SyntiantToken:        ${satAddress}`);
  console.log(`  PropertyNFT:          ${nftAddress}`);
  console.log(`  PropertyTokenFactory: ${factoryAddress}`);
  console.log(`  Marketplace:          ${marketplaceAddress}`);
  console.log(`  GovernanceDAO:        ${daoAddress}`);
  console.log("══════════════════════════════════════════════════════════\n");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
