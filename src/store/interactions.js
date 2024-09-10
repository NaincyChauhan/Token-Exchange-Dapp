import { ethers } from 'ethers';
import Token from '../contract/artifacts/contracts/Token.sol/Token.json';
import Exchange from '../contract/artifacts/contracts/Exchange.sol/Exchange.json';

export const loadProvider = (dispatch) => {
    const connection = new ethers.providers.Web3Provider(window.ethereum);
    dispatch({type:"PROVIDER_LOADED",connection});
    return connection;
}

export const loadNetwork = async (provider, dispatch) => {
    const { chainId } = await provider.getNetwork();
    dispatch({type:"NETWORK_LOADED",chainId});
    return chainId;
}

export const loadAccount = async (provider,dispatch) => {
    const accounts =  await window.ethereum.request({method: 'eth_requestAccounts'});
    const account = ethers.utils.getAddress(accounts[0]);
    dispatch({type:"ACCOUNT_LOADED",account});

    let balance = await provider.getBalance(account);
    balance = ethers.utils.formatEther(balance);
    dispatch({type:'ETHER_BALANCE_LOADED',balance});
    return account;
}

export const loadTokens = async (addresses,provider,dispatch) => {
    let token,symbol;
    token = new ethers.Contract(addresses[0],Token.abi,provider);
    symbol = await token.symbol();
    dispatch({type:"TOKEN_LOADED_1",token,symbol});

    // Load Token 2
    token = new ethers.Contract(addresses[1],Token.abi,provider);
    symbol = await token.symbol();
    dispatch({type:"TOKEN_LOADED_2",token,symbol});
    return token;
}

export const subscribeToEvents = (exchange,dispatch) => {
    exchange.on('Deposit',(token,user,amount,balance,event)=>{
        dispatch({type:'TRANSFER_SUCCESS',event});
    });

    exchange.on('Withdraw',(token,user,amount,balance,event)=>{
        dispatch({type:'TRANSFER_SUCCESS',event});
    });
    
    exchange.on('Order',(id,user,tokenGet,amountGet,tokenGive,amountGive,timestamp,event) => {
        const order = event.args;
        dispatch({type:'NEW_ORDER_SUCCESS',order,event});
    });
    exchange.on('cancleOrder',(id,user,tokenGet,amountGet,tokenGive,amountGive,timestamp,event) => {
        const order = event.args;
        dispatch({type:'ORDER_CANCEL_SUCCESS',order,event});
    });
    exchange.on('Trade',(id,user,tokenGet,amountGet,tokenGive,amountGive,creator,timestamp,event) => {
        const order = event.args;
        dispatch({type:'ORDER_FILL_SUCCESS',order,event});
    });
}

export const loadExchange = async (provider, address,dispatch) => {
    const exchange = new ethers.Contract(address,Exchange.abi,provider);
    dispatch({type: 'EXCHANGE_LOADED', exchange: exchange});
    return exchange;
}

// Load User Balances (Wallet and Exchange Balances)
export const loadBalances = async (account, exchange,tokens,dispatch) => {    
    let balance =  ethers.utils.formatUnits(await tokens[0].balanceOf(account),18);
    dispatch({type: 'TOKEN_1_BALANCE_LOADED', balance});
    
    balance =  ethers.utils.formatUnits(await exchange.balanceOf(tokens[0].address,account),18);
    dispatch({type: 'EXCHANGE_TOKEN_1_BALANCE_LOADED', balance});

    balance =  ethers.utils.formatUnits(await tokens[1].balanceOf(account),18);
    dispatch({type: 'TOKEN_2_BALANCE_LOADED', balance});

    balance =  ethers.utils.formatUnits(await exchange.balanceOf(tokens[1].address,account),18);
    dispatch({type: 'EXCHANGE_TOKEN_2_BALANCE_LOADED', balance});
}


// Transfer Tokens (Deposit and Withdraw)

export const transferToken = async (provider,exchange,transferType,token,amount,dispatch) => {
    let transcation;
    dispatch({type:'TRANSFER_REQUEST'});

    try {        
        const signer = await provider.getSigner();
        const amountToTransfer = ethers.utils.parseUnits(amount.toString(),18);

        if(transferType === "Deposit"){
            transcation = await token.connect(signer).approve(exchange.address,amountToTransfer);
            await transcation.wait();
        
            transcation = await exchange.connect(signer).depositToken(token.address,amountToTransfer);
            await transcation.wait();
        }else{
            transcation = await exchange.connect(signer).withdrawToken(token.address, amountToTransfer);
            await transcation.wait();
        }
    } catch (error) {
        console.error(error);
        dispatch({type:'TRANSFER_FAIL'});
    }

}

export const makeBuyOrder = async (provider, exchange,tokens,order, dispatch) => {
    const tokenGet = tokens[0].address;
    const amountGet = ethers.utils.parseUnits(order.amount,18);
    const tokenGive = tokens[1].address;
    const amountGive = ethers.utils.parseUnits((order.amount * order.price).toString(),18);

    dispatch({type:"NEW_ORDER_REQUEST"});
    try {        
        const signer = await provider.getSigner();
        const transcation = await exchange.connect(signer).makeOrder(tokenGet,amountGet,tokenGive,amountGive);
        await transcation.wait();
    } catch (error) {
        dispatch({type:"NEW_ORDER_FAIL"});        
    }
}

export const makeSellOrder = async (provider, exchange,tokens,order, dispatch) => {
    const tokenGet = tokens[1].address;
    const amountGet = ethers.utils.parseUnits((order.amount * order.price).toString(),18);
    const tokenGive = tokens[0].address;
    const amountGive= ethers.utils.parseUnits(order.amount,18);

    dispatch({type:"NEW_ORDER_REQUEST"});
    try {        
        const signer = await provider.getSigner();
        const transcation = await exchange.connect(signer).makeOrder(tokenGet,amountGet,tokenGive,amountGive);
        await transcation.wait();
    } catch (error) {
        dispatch({type:"NEW_ORDER_FAIL"});        
    }
}

export const loadAllOrders = async (provider, exchange, dispatch) => {
    const block =  await provider.getBlockNumber();
    // Fetch All Cancel Orders
    const cancelStream = await exchange.queryFilter('cancleOrder',0,block);
    const cancelledOrders = cancelStream.map(event => event.args);
    dispatch({type:'CANCELLED_ORDERS_LOADED',cancelledOrders});

    // Fetch All Fill Orders
    const tradeStream = await exchange.queryFilter('Trade',0,block);
    const filledOrders = tradeStream.map(event => event.args);
    dispatch({type:'FILLED_ORDERES_LOADED',filledOrders});
 
    // Fetch All Orders
    const orderStream = await exchange.queryFilter('Order',0,block);
    const allOrders = orderStream.map(event => event.args);
    dispatch({type:'ALL_ORDERS_LOADED',allOrders});
}

export const cancelOrder = async (provider,exchange,order,dispatch) => {
    dispatch({type:"ORDER_CANCEL_REQUEST"});
    try {        
        const signer = await provider.getSigner();
        const transcation = await exchange.connect(signer).cancelOrder(order.id);
        await transcation.wait();
    } catch (error) {
        dispatch({type:"ORDER_CANCEL_FAIL"});        
    }
}

export const  fillOrder = async (provider,exchange,order,dispatch) => {
    dispatch({type:"ORDER_FILL_REQUEST"});
    try {
        const signer = await provider.getSigner();
        const transaction = await exchange.connect(signer).fillOrder(order.id);
        await transaction.wait();
    } catch (error) {
        dispatch({type:"ORDER_FILL_FAIL"});
    }
}