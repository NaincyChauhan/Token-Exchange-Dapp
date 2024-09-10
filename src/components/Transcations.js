import { useSelector, useDispatch } from 'react-redux';
import { myFilledOrdersSelector, myOpenOrders } from '../store/selectors';
import sort from '../assets/sort.svg';
import Banner from './Banner';
import { useRef, useState } from 'react';
import { cancelOrder } from '../store/interactions';

const Transactions = () => {
    const dispatch = useDispatch();
    const [showMyOrders, setShowMyOrders] = useState(true);
    const myOpenOrders_ = useSelector(myOpenOrders);
    const myFilledOrders = useSelector(myFilledOrdersSelector);
    const symbols = useSelector(state => state.tokens.symbols);
    const provider = useSelector(state => state.provider.connection);
    const exchange = useSelector(state => state.exchange.contract);
    const tradesRef= useRef(null);
    const ordersRef = useRef(null)

    const tabHandler = (e) => {
        if(e.target.className !== ordersRef.current.className){
            e.target.className = 'tab tab--active';
            ordersRef.current.className = 'tab';
            setShowMyOrders(false);
        }else{
            e.target.className = 'tab tab--active';
            tradesRef.current.className = 'tab';
            setShowMyOrders(true);
        }
    }

    const cancelHandler = (order) => {
        cancelOrder(provider,exchange,order,dispatch);
    }
    return (
        <div className="component exchange__transactions">
            {showMyOrders ? (
                <div>
                    <div className='component__header flex-between'>
                        <h2>My Orders</h2>

                        <div className='tabs'>
                            <button onClick={tabHandler} ref={ordersRef} className='tab tab--active'>Orders</button>
                            <button onClick={tabHandler} ref={tradesRef} className='tab'>Trades</button>
                        </div>
                    </div>

                    {!myOpenOrders_ || myOpenOrders_.length === 0 ? (
                        <Banner text="No Open Orders" />
                    ) : (
                        <table>
                            <thead>
                                <tr>
                                    <th>{symbols && symbols[0]}</th>
                                    <th>{symbols && symbols[0]}/{symbols && symbols[1]} <img src={sort} alt='Sort' /> </th>
                                    <th> Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {myOpenOrders_ && myOpenOrders_.map((order, index) => {
                                    return (
                                        <tr key={index}>
                                            <td style={{ color: order.orderTypeClass }}>{order.token0Amount}</td>
                                            <td>{order.tokenPrice}</td>
                                            <td><button onClick={() => cancelHandler(order)} className="button--sm">Cancel</button></td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}
                </div>

            ) : ( 
                <div>
                    <div className='component__header flex-between'>
                        <h2>My Transactions</h2>

                        <div className='tabs'>
                            <button onClick={tabHandler}  ref={ordersRef} className='tab tab--active'>Orders</button>
                            <button onClick={tabHandler} ref={tradesRef}  className='tab'>Trades</button>
                        </div>
                    </div>

                    <table>
                        <thead>
                            <tr>
                                <th>Time <img alt='Sort' src={sort} /></th>
                                <th> {symbols && symbols[0]} <img alt='Sort' src={sort} /></th>
                                <th> {symbols && symbols[0]}/ {symbols && symbols[1]} <img alt='Sort' src={sort} /></th>
                            </tr>
                        </thead>
                        <tbody>
                            {myFilledOrders && myFilledOrders.map((order,index) => {
                                return(
                                    <tr key={index}>
                                        <td>{order.formattedTimestamp}</td>
                                        <td style={{ color: order.orderClass }}>{order.orderSign}{order.token0Amount}</td>
                                        <td>{order.tokenPrice}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>

                </div>
            )}
        </div>
    )
}

export default Transactions;