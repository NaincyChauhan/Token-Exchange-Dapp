import { createSelector } from "reselect";
import { get , groupBy , reject, maxBy,minBy} from "lodash";
import { ethers } from "ethers";
import moment from "moment/moment";

const tokens = state => get(state, "tokens.contracts");
const account = state => get(state, "provider.account");
const events = state => get(state, "exchange.events");
const allOrders = state => get(state, "exchange.allOrders.data",[]);
const cancelledOrders = state => get(state, "exchange.cancelledOrders.data",[]);
const filledOrders = state => get(state, "exchange.filledOrders.data",[]);

const openOrders = state => {
    const all = allOrders(state);
    const filled = filledOrders(state);
    const cancelled = cancelledOrders(state);
    const openOrders  = reject(all,(order)=>{
        const orderFilled = filled.some((o) => o.id.toString() === order.id.toString());
        const orderCancelled = cancelled.some((o) => o.id.toString() === order.id.toString());
        return (orderFilled || orderCancelled);
    });
    return openOrders;
}

const decorateOrder  = (order,tokens) => {
    let token0Amount, token1Amount;

    if(order.tokenGive === tokens[1].address){
        token0Amount  = order.amountGive;
        token1Amount = order.amountGet;
    }else{
        token0Amount = order.amountGet;
        token1Amount = order.amountGive;
    }
    return({
        ...order,
        token0Amount : ethers.utils.formatUnits(token0Amount,"ether"),
        token1Amount : ethers.utils.formatUnits(token1Amount,"ether"),
        tokenPrice: Math.round((token1Amount/token0Amount) * 100000) /100000,
        formattedTimestamp : moment.unix(order.timestamp).format("h:mm:ssa d MMM D")
    });
}

const decorateOrderBookOrders = (orders,tokens) => {
    return(
        orders.map((order_) => {
            let order = decorateOrder(order_,tokens);
            order = decorateOrderBookOrder(order,tokens);
            return order
        })
    )
}

export const orderBookSelector = createSelector(openOrders,tokens,(orders,tokens) => {
    if( !tokens[0] || ! tokens[1]) { return}

    // Filter Orders by selected tokens
    orders = orders.filter((o) => o.tokenGet === tokens[0].address || o.tokenGet === tokens[1].address);
    orders = orders.filter((o) => o.tokenGive === tokens[0].address || o.tokenGive === tokens[1].address);
    
    // Decorate Orders
    orders = decorateOrderBookOrders(orders,tokens);
    // Group Order Buy OrderType
    orders = groupBy(orders, "orderType");
    // Sort Buy Orders by tokens price
    const buyOrders = get(orders,"buy",[]);
    orders = {
        ...orders,
        buyOrders: buyOrders.sort((a,b) => b.tokenPrice - a.tokenPrice)
    }
    // Sort Sell Orders by tokens price
    const sellOrders = get(orders,"sell",[]);
    orders = {
        ...orders,
        sellOrders: sellOrders.sort((a,b) => b.tokenPrice - a.tokenPrice)
    }
    return orders;
});

const decorateOrderBookOrder = (order, tokens) => {
    const orderType = order.tokenGive === tokens[1].address ? 'buy' : 'sell';
    return({
        ...order,
        orderType,
        orderTypeClass: (orderType === "buy" ? "#25CE8F" : "#F45353"),
        orderFillAction: (orderType === "buy" ? "sell" : "buy")
    });
}


// Price Chart
export const priceChartSelector = createSelector(filledOrders,tokens,(orders,tokens) => {
    if( !tokens[0] || ! tokens[1]) { return}
    // Filter Orders by selected tokens
    orders = orders.filter((o) => o.tokenGet === tokens[0].address || o.tokenGet === tokens[1].address);
    orders = orders.filter((o) => o.tokenGive === tokens[0].address || o.tokenGive === tokens[1].address);

    // Sort orders by date ascending to compare history
    orders = orders.sort((a,b) => a.timestamp - b.timestamp);

    // Decorate orders - add display attributes
    orders =  orders.map((o) => decorateOrder(o,tokens));
    
    // Get last 2 order for final price & price change
    let secondLastOrder, lastOrder;
    [secondLastOrder,lastOrder] = orders.slice(orders.length-2, orders.length);
    const lastPrice = get(lastOrder,'tokenPrice',0);
    const secondLastPrice = get(secondLastOrder,'tokenPrice',0);
    return({
        lastPrice,
        lastPriceChange: (lastPrice >= secondLastPrice ? '+' : '-'),
        series:[{
        data:buildGraphData(orders)
    }]});
    
});

const buildGraphData = (orders) => {    
    // Group the orders by hour for the graph
    orders = groupBy(orders, (o)=> moment.unix(o.timestamp).startOf('hour').format());
    const hours = Object.keys(orders)
    const graphData = hours.map((hour) => {
        // Fetch all orders from current hour
        const group = orders[hour];
        // calculate price values: open high, low, close
        const open = group[0];
        const high = maxBy(group,'tokenPrice');
        const low = minBy(group,'tokenPrice');
        const close = group[group.length-1];
    
        return({
            x:new Date(hour),
            y:[open.tokenPrice,high.tokenPrice,low.tokenPrice,close.tokenPrice]
        });
    });

    return graphData;
}


// All Filled Orders
export const filledOrdersSelector = createSelector(filledOrders,tokens,(orders,tokens) => {
    if( !tokens[0] || ! tokens[1]) { return}

    // Filter Orders by selected tokens
    orders = orders.filter((o) => o.tokenGet === tokens[0].address || o.tokenGet === tokens[1].address);
    orders = orders.filter((o) => o.tokenGive === tokens[0].address || o.tokenGive === tokens[1].address);

    // Sort orders by time ascending
    orders = orders.sort((a,b) => a.timestamp - b.timestamp);
    
    // apply orders colors (decorate orders)
    orders = decorateFilledOrders(orders,tokens)
    
    // sort orders by time descending for UI
    orders = orders.sort((a,b) => b.timestamp - a.timestamp);

    return orders;
});

const decorateFilledOrders = (orders,tokens) => {
    // Track previous order to compare history
    let previousOrder = orders[0] 
    return(
        orders.map((order) => {
            // decorate each individual order
            order = decorateOrder(order,tokens);
            order = decorateFilledOrder(order,previousOrder);
            previousOrder = order // Update the previous order once it's decorated
            return order;
        })
    );
}

const decorateFilledOrder = (order,previousOrder) => {
    return ({
        ...order,
        tokenPriceClass: tokenPriceClass(order.tokenPrice, order.id, previousOrder)
    });
}

const tokenPriceClass = (tokenPrice,orderId,previousOrder) => {
    if(previousOrder.id === orderId){
        return '#25CE8F';
    }

    // Show Green Price if order price higher than previous order
    // Show Red Price if order price lower than previous order
    if(previousOrder.tokenPrice <= tokenPrice){
        return '#25CE8F';
    }else{
        return '#F45353';
    }
}


// User Open Orders
export const myOpenOrders = createSelector(account,tokens,openOrders,(account,tokens,orders) => {
    if( !tokens[0] || ! tokens[1]) { return}

    // Filter Orders Createdby current Account
    orders = orders.filter((o) => o.user === account);

    // Filter Orders by selected tokens
    orders = orders.filter((o) => o.tokenGet === tokens[0].address || o.tokenGet === tokens[1].address);
    orders = orders.filter((o) => o.tokenGive === tokens[0].address || o.tokenGive === tokens[1].address);

    // Decorate My Orders
    orders  = decorateMyOpenOrders(orders,tokens);

    // Sort Orders by date Descending
    orders = orders.sort((a,b) => b.timestamp - a.timestamp);

    return orders;
});

const decorateMyOpenOrders = (orders,tokens) => {
    return(
        orders.map((order) => {
            order = decorateOrder(order,tokens);
            order = decorateMyOpenOrder(order,tokens)
            return(order);
        })
    )
    
}
const decorateMyOpenOrder = (order,tokens) => {
    let orderType = order.tokenGive === tokens[1].address ? 'buy' : 'sell';
    return({
        ...order,
        orderType,
        orderTypeClass: (orderType === 'buy' ? '#25CE8F' : '#F45353')
    })
}

// My Filled Orders
export const myFilledOrdersSelector = createSelector(account,tokens,filledOrders,(account,tokens,orders) => {
    if( !tokens[0] || !tokens[1]) { return}

    // Filter Our Orders
    orders = orders.filter((o) => o.user === account || o.creator === account);

    // Filter Orders by selected tokens
    orders = orders.filter((o) => o.tokenGet === tokens[0].address || o.tokenGet === tokens[1].address);
    orders = orders.filter((o) => o.tokenGive === tokens[0].address || o.tokenGive === tokens[1].address);

    // Sort by date ascending
    orders = orders.sort((a,b) => b.timestamp - a.timestamp);

    // Decorate Orders - add display attributes
    orders = decorateMyFilledOrders(orders,account,tokens);
    return orders;
});

const decorateMyFilledOrders = (orders,account,tokens) => {
    return(
        orders.map((order) => {
            order = decorateOrder(order,tokens);
            order = decorateMyFilledOrder(order,account,tokens)
            return(order);
        })
    )
    
}
const decorateMyFilledOrder = (order,account,tokens) => {
    const myOrder = order.creator === account;
    let orderType;
    if (myOrder) {
        orderType = order.tokenGive === tokens[1].address ? 'buy' : 'sell';
    }else{
        orderType = order.tokenGive === tokens[1].address ? 'sell' : 'buy';
    }
    return({
        ...order,
        orderType,
        orderClass : (orderType === 'buy' ? '#25CE8F' : '#F45353'),
        orderSign : (orderType === 'buy' ? '+' : '-')
    })
}


// Catch Current Event(My Event)

export const myEventsSelector = createSelector(account,events, (account,events) => {
    events = events.filter((e) => e.args.user === account);
    return events;
});