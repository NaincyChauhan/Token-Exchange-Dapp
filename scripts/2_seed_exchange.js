const config = require("../src/config.json");

const tokens = (n) => {
    return ethers.utils.parseUnits(n.toString(), 'ether');
}

const wait = (seconds) => {
    const milliseconds = seconds * 1000
    return new Promise(resolve => setTimeout(resolve, milliseconds))
}

async function main() {
    const accounts = await ethers.getSigners();
    // GEt Network
    const { chainId} = await ethers.provider.getNetwork();

    // Fetch Deploye Tokens
    const WEP  = await ethers.getContractAt('Token',config[chainId].WEP.address);
    console.log("WEAPON Token,", WEP.address);
    const mDAI  = await ethers.getContractAt('Token',config[chainId].mDAI.address);
    console.log("mDAI Token,", mDAI.address);
    const mETH  = await ethers.getContractAt('Token',config[chainId].mETH.address);
    console.log("mETH Token,", mETH.address);
    const exchange  = await ethers.getContractAt('Exchange',config[chainId].exchange.address);
    console.log("Exchange Address,", exchange.address);

    const sender = accounts[0];
    const reciver = accounts[1];
    const amount = tokens(1000);
    let transcation;
    let result;
    // Distribute Tokens
    const transfer_mEth = await mETH.connect(sender).transfer(reciver.address,amount);
    await transfer_mEth.wait();

    const user1 = accounts[0];
    const user2 = accounts[1];
    // user1 Approve WEP Token To Exchange
    const approve_WEP = await WEP.connect(user1).approve(exchange.address,amount);
    await approve_WEP.wait();

    // user1 Deposit WEP Tokens to Exchange
    const deposit_WEP = await exchange.connect(user1).depositToken(WEP.address,amount);
    await deposit_WEP.wait();

    // user2 Approve mEth To Exchange
    const approve_mEth = await mETH.connect(user2).approve(exchange.address,amount);
    await approve_mEth.wait();

    // user2 Deposit mETH to Exchange
    const deposit_mEth = await exchange.connect(user2).depositToken(mETH.address,amount);
    await deposit_mEth.wait();

    // ******************************************
    // User1 Make Orders
    let orderId;
    transcation = await exchange.connect(user1).makeOrder(mETH.address,tokens(100),WEP.address,tokens(5));
    result = await transcation.wait();
    console.log("Made Order From user1 : ", user1.address);

    // user1 Cancel Order
    orderId =  result.events[0].args.id;
    transcation = await exchange.connect(user1).cancelOrder(orderId);
    result = await transcation.wait();
    console.log("Cancel Order From User1 : ", user1.address);

    // Wait for Seconds
    await wait(1);

    // *********** Fill Order **********
    // user1 Create Order
    transcation = await exchange.connect(user1).makeOrder(mETH.address,tokens(100),WEP.address, tokens(10));
    result = await transcation.wait();
    console.log("Made Order From user1 : ", user1.address);

    // user2 Fill Order
    orderId = result.events[0].args.id;
    transcation = await exchange.connect(user2).fillOrder(orderId);
    result = await transcation.wait();
    console.log("Fill Order From user2 : ", user2.address);

    // Wait for seconds
    await wait(1);

    // user1 made another order
    transcation = await exchange.connect(user1).makeOrder(mETH.address,tokens(50),WEP.address,tokens(15));
    result = await transcation.wait();
    console.log("One more Order made from user1 : ", user1.address);

    // user2 Fill another order
    orderId = result.events[0].args.id;
    transcation = await exchange.connect(user2).fillOrder(orderId);
    result = await transcation.wait();
    console.log("One more Order Fill From user2 : ", user2.address);

    // Wait for second
    await wait(1);

    // user1 make final Order
    transcation = await exchange.connect(user1).makeOrder(mETH.address,tokens(200),WEP.address,tokens(20));
    result = await transcation.wait();
    console.log("user1 made final order : ", user1.address);

    // user2 fill final Order
    orderId = result.events[0].args.id;
    transcation = await exchange.connect(user2).fillOrder(orderId);
    result = await transcation.wait();
    console.log("user2 fill final order : ", user2.address);

    // Wait for second
    await wait(1);

    // ****** Open Orders ******
    // user1 make 10 orders
    for (let i = 1; i <= 10; i++) {
        transcation = await exchange.connect(user1).makeOrder(mETH.address,tokens(10*i),WEP.address,tokens(10));
        result  = await transcation.wait();
        console.log("user1 Create Order : ", i);
        await wait(1);
    }

    // user2 make 10 orders
    for (let i = 1; i <= 10; i++) {
        transcation = await exchange.connect(user2).makeOrder(WEP.address,tokens(10),mETH.address,tokens(10*i));
        result = await transcation.wait();
        console.log("user2 Crate order : ",i);  
        await wait(1);
    }

}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
