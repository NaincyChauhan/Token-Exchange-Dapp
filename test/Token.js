const { expect } = require("chai");
const { hardhat } = require("hardhat");

describe("Token", function () {
    const tokens = (n) => {
        return ethers.utils.parseUnits(n.toString(), 'ether');
    }

    let token;
    let manager,addr1,addr2,addr3;
    this.beforeEach(async () => {
        const Token = await ethers.getContractFactory("Token");
        [manager, addr1, addr2,addr3 ] = await ethers.getSigners(); 
        token = await Token.deploy("WeaponTech","WEP","1000000");
    });

    // Token Information
    describe("Token", () => {
        it("Should Set The Right Name", async function () {
            expect(await token.name()).to.equal("WeaponTech");
        });

        it("Should Set The Right Symbol", async function () {
            expect(await token.symbol()).to.equal("WEP");
        });

        it("Should Set The Right TotalSupply", async function () {
            expect(await token.totalSupply()).to.equal(tokens("1000000"));
        });

        it("Should Set The Right Decimal", async function () {
            expect(await token.decimals()).to.equal(18);
        });
        it("Should Assigns Total Supply To Deployer", async function () {
            expect(await token.balanceOf(manager.address)).to.equal(tokens("1000000"));
        });
    });

    // Transfer Token
    describe('Transfer Token', () => { 
        let amount = tokens('100');
        describe('Success', () => { 
            let transaction, result;
            beforeEach(async () => {
                transaction = await token.connect(manager).transfer(addr1.address,amount);
                result = await transaction.wait();
            });

            it("Should Transfer Corrent Amount", async () => {
                // await expect(token.connect(manager).transfer(addr1.address,amount))
                //     .to.emit(token, "Transfer")
                //     .withArgs(manager.address,addr1.address,amount);
    
                expect(await token.balanceOf(manager.address)).to.equal(tokens(999900))
                expect(await token.balanceOf(addr1.address)).to.equal(amount)
            });
    
            it("Emit a Transfer Event", async () => {
                const event = result.events[0];
                expect(event.event).to.equal('Transfer');
                const args = event.args;
                expect(args.from).to.equal(manager.address);
                expect(args.to).to.equal(addr1.address);
                expect(args.value).to.equal(amount);
            });
        });

        describe('Failuer', () => { 
            it("Should be Fail when Transfer Token", async () => {
                await expect(token.connect(addr1).transfer(manager.address,amount)).to.be.
                revertedWith("You Don't have enough Balace");
            });
            it("Should be Fail when Transfer to worng Address", async () => {
                await expect(token.connect(manager).transfer("0x0000000000000000000000000000000000000000",amount)).to.be.
                revertedWith("Please Enter Correct Address");
            });
        })

    });

    // Approving Tokens
    describe('Approving Tokens', () => {
        let amount, transaction, result;
        beforeEach( async () => {
            amount = tokens(100);
            transaction = await token.connect(manager).approve(addr3.address, amount);
            result = await transaction.wait();
        });

        describe('Success', () => { 
            it('Allocates an allowance for delegated token spending', async () => {
                expect(await token.allowance(manager.address, addr3.address)).to.equal(amount);
            })

            it("Emit the Approval Event", async () => {
                const event = result.events[0];
                expect(event.event).to.equal('Approval');
                const args = event.args;
                expect(args.from).to.equal(manager.address);
                expect(args.spender).to.equal(addr3.address);
                expect(args.value).to.equal(amount);
            });
        });

        describe('Failuer', () => { 
            it('should be fail for incorrect spender', async () => {
                await expect(token.connect(manager).approve("0x0000000000000000000000000000000000000000", amount)).to.be.
                revertedWith("Please Enter Correct Address");
            })
        });
    });

    // Delegated Token Transfer
    describe('Delegated Token Transfer', () => { 
        let transaction,result;
        let amount = tokens(100);

        beforeEach(async () => {
            transaction = await token.connect(manager).approve(addr2.address, amount);
            result  = await transaction.wait();
        });

        describe('Success', () => { 
            beforeEach(async () => {
                transaction = await token.connect(addr2).transferFrom(manager.address,addr3.address,amount);
                result = await transaction.wait();
            });

            it("Amount Should Be Correct", async () => {
                expect( await token.balanceOf(manager.address)).to.equal(ethers.utils.parseUnits("999900","ether"));
                expect( await token.balanceOf(addr3.address)).to.equal(amount);
            });

            it("Check That Allowance should be reset", async () => {
                expect( await token.allowance(manager.address,addr2.address)).to.be.equal(0);
            });
        });

        describe('Failuer', async () => { 

            it("Amount is to high", async () => {
                await expect(token.connect(addr2).transferFrom(manager.address,addr3.address,tokens(10000)))
                .to.be.revertedWith("You Don't have Permission for Transfer the Token");
            });
            it("Permission Failuer", async () => {
                await expect( token.connect(addr3).transferFrom( manager.address, addr2.address, amount))
                .to.be.revertedWith("You Don't have Permission for Transfer the Token");
            });
        });
    });
});
