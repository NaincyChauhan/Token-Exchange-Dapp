import { createStore , combineReducers, applyMiddleware } from 'redux';
import thunk from 'redux-thunk';
import {composeWithDevTools} from 'redux-devtools-extension';
// Import Reducers
import {provider,tokens,exchange} from './reducers';

const reducers = combineReducers({
    provider,
    tokens,
    exchange
});

const initialState = {};
const middleware = [thunk];
const store = createStore(reducers,initialState,composeWithDevTools(applyMiddleware(...middleware)));

export default store;