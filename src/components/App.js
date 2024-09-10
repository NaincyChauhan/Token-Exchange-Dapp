import '../App.css';
import {useEffect} from 'react';
import { useDispatch } from 'react-redux';
import { loadAccount, loadExchange, loadNetwork, loadAllOrders, loadProvider, loadTokens, subscribeToEvents } from '../store/interactions';
import Navbar from './Navbar';
import Markets from './Markets';
import Balance from './Balance';
import Order from './Order';
import OrderBook from './OrderBook';
import PriceChart from './PriceChart';
import Trades from './Trades';
import Transactions from './Transcations';
import Alert from './Alert';
const config = require("../config.json");

function App() {
    const dispatch = useDispatch();
    const loadBlockchainData = async () =>  {        
        // Connect to blockchain
        const provider = loadProvider(dispatch);
        // Reload page when network changes
        window.ethereum.on("chainChanged", () => {
            window.location.reload();
        });
        // Fetch Current Metamask Account
        window.ethereum.on('accountsChanged',async () => {
            await loadAccount(provider,dispatch);        
        });
        // Fetch Current Network's ChainId
        const chainId = await loadNetwork(provider,dispatch);
        // Load Token Smart Contract
        await loadTokens([config[chainId].WEP.address,config[chainId].mETH.address],provider,dispatch);
        // Load Exchange Smart Contract
        const exchange = await loadExchange(provider,config[chainId].exchange.address,dispatch);
        // Listen To Event
        loadAllOrders(provider, exchange, dispatch)
        subscribeToEvents(exchange,dispatch);
    }

    useEffect(() => {
      loadBlockchainData();
    });
    
    return (
        <div>
            <Navbar />
            <main className='exchange grid'>
                <section className='exchange__section--left grid'>
                    <Markets />
                    <Balance /> 
                    <Order />
                </section>
                <section className='exchange__section--right grid'>
                    <PriceChart />
                    <Transactions />
                    <Trades />
                    <OrderBook />
                </section>
            </main>
            <Alert />
        </div>
    );
}

export default App;
   