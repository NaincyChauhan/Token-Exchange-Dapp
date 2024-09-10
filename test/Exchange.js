const { expect } = require("chai");

describe("Exchange", function () {
    const tokens = (n) => {
        return ethers.utils.parseUnits(n.toString(), 'ether');
    }

    let amount = tokens(100);
    let exchange,token1,token2;
    let manager,addr1,addr2,addr3;
    const feePercent = 10;
    this.beforeEach(async () => {
        [manager, addr1, addr2,addr3 ] = await ethers.getSigners(); 
        // Deploy Exchange
        const Exchange = await ethers.getContractFactory("Exchange");
        exchange = await Exchange.deploy(manager.address,feePercent);

        // Deploy Token-1 Contract 
        const Token1 = await ethers.getContractFactory("Token");
        token1 = await Token1.deploy("WeaponTech","WEP","1000000");
        const transcation = await token1.connect(manager).transfer(addr1.address,amount);
        await transcation.wait();

        // Deploy Token-2 Contract 
        const Token2 = await ethers.getContractFactory("Token");
        token2 = await Token2.deploy("MyTech","mTech","1000000");
        const transcation2 = await token2.connect(manager).transfer(addr1.address,amount);
        await transcation2.wait();
    });

    // Exchange Information
    describe("Deployment", () => {
        it("Should Track Right FeeAccount", async function () {
            expect(await exchange.feeAccount()).to.equal(manager.address);
        });
        it("Should Track Right FeePercent", async function () {
            expect(await exchange.feePercent()).to.equal(feePercent);
        });
    });

    // Deposit Amount
    describe('Deposit The Tokens', () => { 
        let exchange_t,exchange_r;
        describe('Success', () => { 
            beforeEach( async () => {
                const approve = await token1.connect(addr1).approve(exchange.address,amount);
                await approve.wait();
                exchange_t = await exchange.connect(addr1).depositToken(token1.address,amount);
                exchange_r = await exchange_t.wait();
            });

            it("Should Token Transfer Successfully", async () => {
                expect( await token1.balanceOf(exchange.address)).to.be.equal(amount);                
                expect( await token1.balanceOf(addr1.address)).to.be.equal(0);                
                expect( await exchange.tokens(token1.address,addr1.address)).to.be.equal(amount);
                expect( await exchange.balanceOf(token1.address,addr1.address)).to.be.equal(amount);
            });

            it("Emit a Deposit Event", async () => {
                const event = exchange_r.events[1];
                expect(event.event).to.equal('Deposit');
                const args = event.args;
                expect(args.token).to.equal(token1.address);
                expect(args.user).to.equal(addr1.address);
                expect(args.amount).to.equal(amount);
                expect(args.balance).to.equal(amount);
            });
        });
        describe('Failuer', () => { 
            it("should fail when no token approve", async () => {
                await expect( exchange.connect(addr1).depositToken(token1.address,amount))
                .to.be.revertedWith("You Don't have Permission for Transfer the Token");
            });
        });
    });

    // Withdraw Amount
    describe('Withdraw The Tokens', () => { 
        let result;
        describe('Success', () => { 
            beforeEach( async () => {
                const approve = await token1.connect(addr1).approve(exchange.address,amount);
                await approve.wait();
                const exchange_t = await exchange.connect(addr1).depositToken(token1.address,amount);
                await exchange_t.wait();
                const withdraw = await exchange.connect(addr1).withdrawToken(token1.address,amount);
                result = await withdraw.wait();                
            });

            it("Should Token Transfer Successfully", async () => {
                expect( await token1.balanceOf(exchange.address)).to.be.equal(0);                
                expect( await token1.balanceOf(addr1.address)).to.be.equal(amount);                
                expect( await exchange.tokens(token1.address,addr1.address)).to.be.equal(0);
                expect( await exchange.balanceOf(token1.address,addr1.address)).to.be.equal(0);
            });

            it("Emit a Withdraw Event", async () => {
                const event = result.events[1];
                expect(event.event).to.equal('Withdraw');
                const args = event.args;
                expect(args.token).to.equal(token1.address);
                expect(args.user).to.equal(addr1.address);
                expect(args.amount).to.equal(amount);
                expect(args.balance).to.equal(0);
            });
        });
        describe('Failuer', () => { 
            it("should fail when no token approve", async () => {
                await expect( exchange.connect(addr1).withdrawToken(token1.address,amount))
                .to.be.revertedWith("You have not enough Balance.");
            });
        });
    });

    // Checking Balances
    describe('Checking Balances', () => { 
        beforeEach( async () => {
            const approve = await token1.connect(addr1).approve(exchange.address,amount);
            await approve.wait();
            const exchange_t = await exchange.connect(addr1).depositToken(token1.address,amount);
            await exchange_t.wait();              
        });

        it("Should Token Transfer Successfully", async () => {
            expect( await exchange.balanceOf(token1.address,addr1.address)).to.be.equal(amount);
        });
    });

    describe('Order Actions', () => { 
        let result;
        beforeEach( async () => {
            const approve = await token1.connect(addr1).approve(exchange.address,amount);
            await approve.wait();
            const exchange_t = await exchange.connect(addr1).depositToken(token1.address,amount);
            await exchange_t.wait();       
            const transcation = await exchange.connect(addr1).makeOrder(token2.address,amount,token1.address,amount);
            result = await transcation.wait();

            // User 2
            const transcation2 = await token2.connect(manager).transfer(addr2.address,amount);
            await transcation2.wait();
            const approve2 = await token2.connect(addr2).approve(exchange.address,amount);
            await approve2.wait();       
        });

        // Make Order
        describe("Make Order", () => {     
            describe('Success', () => { 
                it("Check OrderCount", async () => {
                    expect(await exchange.orderCount()).to.be.equal(1);
                });
    
                it("Should Emit The Order", async () => {
                    const event = result.events[0];
                    expect(event.event).to.equal('Order');
                    const args = event.args;
                    expect(args.id).to.equal(1);
                    expect(args.user).to.equal(addr1.address);
                    expect(args.tokenGet).to.equal(token2.address);
                    expect(args.amountGet).to.equal(amount);
                    expect(args.tokenGive).to.equal(token1.address);
                    expect(args.amountGive).to.equal(amount);
                    expect(args.amountGive).to.equal(amount);
                    expect(args.timestamp).to.at.least(1);
                });
            });
    
            describe('Failuer', () => { 
                it("Should Return For Amount", async()=> {
                    await expect( exchange.connect(addr1).makeOrder(token1.address,amount,token2.address,amount))
                    .to.be.revertedWith("Not Have Enough balance.");
                });
            });
        });

        // Cancle Order
        describe('Cancle Order', () => {  
            describe('Success', () => {  
                beforeEach( async () => {
                    const transcation = await exchange.connect(addr1).cancelOrder(1);
                    result = await transcation.wait();
                });
                
                it("Should Cancel The Order", async () => {
                    expect( await exchange.cancleOrders(1)).to.be.equal(true);
                });

                it("Should Emit the Cancel Order Event", async () => {
                    const event = result.events[0];
                    expect(event.event).to.equal('cancleOrder');
                    const args = event.args;
                    expect(args.id).to.equal(1);
                    expect(args.user).to.equal(addr1.address);
                    expect(args.tokenGet).to.equal(token2.address);
                    expect(args.amountGet).to.equal(amount);
                    expect(args.tokenGive).to.equal(token1.address);
                    expect(args.amountGive).to.equal(amount);
                    expect(args.amountGive).to.equal(amount);
                    expect(args.timestamp).to.at.least(1);
                });
            });

            describe('Failuer', () => {  
                it("Order Id should be Wrong", async () => {
                    await expect(exchange.connect(addr1).cancelOrder(22))
                    .to.be.revertedWith("Order Doest not Exits");
                });

                it("Order owner does not match", async() => {
                    await expect( exchange.connect(addr2).cancelOrder(1))
                    .to.be.revertedWith("Permission Error");
                });
            });
        });

        // Fill The Order
        describe('Fill The Order', () => {  
            describe('Success', () => {  
                let user1_before_token1, user1_before_token2, user2_before_token1, user2_before_token2,
                user1_after_token1, user1_after_token2, user2_after_token1, user2_after_token2,
                fee_account_after_token2,fee_account_before_token2;
                beforeEach( async () => {
                    const exchange_t2 = await exchange.connect(addr2).depositToken(token2.address,amount);
                    await exchange_t2.wait(); 

                    user1_before_token1 = await exchange.balanceOf(token1.address,addr1.address);
                    user1_before_token2 = await exchange.balanceOf(token2.address,addr1.address);
    
                    user2_before_token1 = await exchange.balanceOf(token1.address,addr2.address);
                    user2_before_token2 = await exchange.balanceOf(token2.address,addr2.address);
                    fee_account_before_token2 = await exchange.balanceOf(token1.address,manager.address);
                    const fillOrder = await exchange.connect(addr2).fillOrder(1);
                    result = await fillOrder.wait();
                });
    
                it("Should Fill The Order Correct", async () => {
                    user1_after_token1 = await exchange.balanceOf(token1.address,addr1.address);
                    user1_after_token2 = await exchange.balanceOf(token2.address,addr1.address);
    
                    user2_after_token1 = await exchange.balanceOf(token1.address,addr2.address);
                    user2_after_token2 = await exchange.balanceOf(token2.address,addr2.address);
                    fee_account_after_token2 = await exchange.balanceOf(token1.address,manager.address);
                    
                    // Before Fill Order
                    expect(fee_account_before_token2).to.be.equal(0)
                    expect(user1_before_token1).to.be.equal(amount);
                    expect(user1_before_token2).to.be.equal(0);
                    expect(user2_before_token1).to.be.equal(0);
                    expect(user2_before_token2).to.be.equal(amount);

                    // After Fill Order
                    expect(user1_after_token1).to.be.equal(0);
                    expect(user1_after_token2).to.be.equal(amount);
                    expect(Number(user2_after_token1)).to.be.equal(amount - (amount/100)*feePercent);
                    expect(user2_after_token2).to.be.equal(0);
                    expect(Number(fee_account_after_token2)).to.be.equal((amount/100)*feePercent)
                });

                it("Should Update Fill Order", async () => {
                    expect (await exchange.OrderFilled(1)).to.equal(true);
                });

                it("Should Emit the Trade Event", async () => {
                    const event = result.events[0];
                    expect(event.event).to.equal('Trade');
                    const args = event.args;
                    expect(args.id).to.equal(1);
                    expect(args.user).to.equal(addr2.address);
                    expect(args.tokenGet).to.equal(token2.address);
                    expect(args.amountGet).to.equal(amount);
                    expect(args.tokenGive).to.equal(token1.address);
                    expect(Number(args.amountGive)).to.equal(amount - (amount/100)*feePercent);
                    expect(args.creater).to.equal(addr1.address);
                    expect(args.timestamp).to.at.least(1);
                });
            });

            describe('Failuer', () => {  
                it("Not Enough Tokens in Exchange" ,async () => {
                    await expect( exchange.connect(addr2).fillOrder(1))
                    .to.be.revertedWith("Not Enough Tokens");
                });

                it("It Reject Invalid Order Ids" ,async () => {
                    await expect( exchange.connect(addr2).fillOrder(21))
                    .to.be.revertedWith("Order Doest not Exits");
                });

                it("It Reject already Filled Order" ,async () => {
                    const exchange_t2 = await exchange.connect(addr2).depositToken(token2.address,amount);
                    await exchange_t2.wait(); 
                    const fillOrder = await exchange.connect(addr2).fillOrder(1);
                    result = await fillOrder.wait();

                    await expect( exchange.connect(addr2).fillOrder(1))
                    .to.be.revertedWith("Order Doest not Exits");
                });

                it("It Reject Cancel Order" ,async () => { 
                    const cancelOrder = await exchange.connect(addr1).cancelOrder(1);
                    result = await cancelOrder.wait();
                    
                    await expect( exchange.connect(addr1).fillOrder(1))
                    .to.be.revertedWith("Order Doest not Exits");
                });
            });
        });
    });
});
