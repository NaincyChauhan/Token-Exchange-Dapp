import config from "../config.json";
import { useSelector, useDispatch } from 'react-redux';
import { loadTokens } from "../store/interactions";

const Markets = () => {
    const chainId = useSelector(state => state.provider.chainId);
    const provider = useSelector(state => state.provider.connection);
    const dispatch = useDispatch();
    const marketHandler = async (e) => {
        loadTokens((e.target.value).split(','),provider,dispatch);
    }
    return(
        <div className="components exchange__markets">
            <div className="components__header">
                <h2> Select Market </h2>
            </div>
            { chainId && config[chainId] ? (
                <select name="markets" id="markets" onChange={marketHandler}>
                    <option value={`${config[chainId].WEP.address},${config[chainId].mETH.address}`}>WEP / mETH</option>
                    <option value={`${config[chainId].WEP.address},${config[chainId].mDAI.address}`}>WEP / mDAI</option>
                </select>

            ) : (
                <div>
                    <p>Not Deployed to Network</p>
                </div>
            ) }
            <hr/>
        </div>
    );
}

export default Markets;