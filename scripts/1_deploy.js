const fs = require('fs');
const path = require('path');


async function main() {
    console.log("Deploying... ");
    const Token = await ethers.getContractFactory("Token");
    const Exchange = await ethers.getContractFactory("Exchange");

    // Read Config File
    const filePath = path.join(__dirname, '../src/config.json');
    const jsonData = fs.readFileSync(filePath, 'utf-8');
    const data = JSON.parse(jsonData);
    const { chainId} = await ethers.provider.getNetwork();

    // Token 1 WEP
    const token1 = await Token.deploy("WeaponTech", "WEP", "1000000");
    await token1.deployed();
    data[chainId].WEP.address = token1.address;
    console.log("Token Address 1 : ", token1.address);
    
    // Token 1 WEP
    const token2 = await Token.deploy("mDAI", "mDAI", "1000000");
    await token2.deployed();
    data[chainId].mDAI.address = token2.address;
    console.log("Token Address 2 : ", token2.address);
    
    // Token 1 WEP
    const token3 = await Token.deploy("mETH", "mETH", "1000000");
    await token3.deployed();
    data[chainId].mETH.address = token3.address;
    console.log("Token Address 3 : ", token3.address);

    // Deploy Exchange
    const accounts = await ethers.getSigners(); 
    const exchange = await Exchange.deploy(accounts[0].address,10);
    await exchange.deployed();
    data[chainId].exchange.address = exchange.address;
    console.log("Exchange Address : ", exchange.address);
    console.log("Deployment Compelte.");

    const updatedData = JSON.stringify(data, null, 2);
    fs.writeFileSync(filePath, updatedData);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
