import logo from "../assets/logo.png";
import { useSelector, useDispatch } from 'react-redux';
import Blockies from 'react-blockies';
import { loadAccount } from '../store/interactions';
import eth from '../assets/eth.svg';
const config = require("../config.json");

const Navbar = () => {
    const dispatch = useDispatch();
    const account = useSelector(state => state.provider.account);
    const balance = useSelector(state => state.provider.balance);
    const provider = useSelector(state => state.provider.connection);
    const chainId = useSelector(state => state.provider.chainId);

    // Connect Wallet 
    const connectHandler = async () => {
        // Load Account...
        await loadAccount(provider, dispatch);
    }

    // Network Select Handler
    const networkHandler = async (e) => {
        try {
            await window.ethereum.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: e.target.value }],
            });
        } catch (error) {
            console.error('Failed to switch network', error);
        }
    }
    return (
        <div className='exchange__header grid'>
            <div className='exchange__header--brand flex'>
                <img className="logo" src={logo} alt="WEP LOGO"></img>
                <h1>WEP Token Exchange</h1>
            </div>

            <div className='exchange__header--networks flex'>
                <img src={eth} alt="ETH Logo" className="Eth Logo" />
                {chainId && (
                    <select name="networks" id="networks" value={config[chainId] ? `0x${chainId.toString(16)}` : "0"} onChange={networkHandler} >
                        <option value="0" disabled> Select Network </option>
                        <option value="0x7A69" > Localhost</option>
                        <option value="0xaa36a7"> Sepolia </option>
                    </select>
                )}
            </div>

            <div className='exchange__header--account flex'>
                <p><small>My Balance</small>{balance ? (
                    Number(balance).toFixed(4) + " ETH"
                ) : (
                    "0 ETH"
                )}</p>
                {account ? (
                    <a 
                        href={config[chainId] ? `${config[chainId].explorerURL}/address/${account}` : "#"}
                        target="_blank"
                        rel="noreferrer"
                        >{account.slice(0, 5) + "..." + account.slice(38, 42)}
                            <Blockies
                                seed={account}
                                size={10}
                                scale={3}
                                color="#2187D0"
                                bgColor="#F1F2F9"
                                spotColor="#767F92"
                                className="identicon"
                            />
                    </a>
                ) : (
                    <a href={account}>
                        <button className="button" onClick={connectHandler}>Connect</button>
                    </a>
                )}
            </div>
        </div>
    );
}

export default Navbar;