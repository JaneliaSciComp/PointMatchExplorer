import React from "react";
import { render } from "react-dom";
import { createStore, compose, applyMiddleware  } from "redux";
import thunk from "redux-thunk";
import reducers from "./reducers";
import { Provider } from "react-redux";
import { createLogger } from "redux-logger";
import App from "./app"
import {UPDATE_PME_VARIABLES} from "./actions";

const loggerMiddleware = createLogger(
  {
    // https://www.npmjs.com/package/redux-logger#log-everything-except-actions-with-certain-type
    predicate: (getState, action) => action.type !== UPDATE_PME_VARIABLES
  });

// stolen from https://github.com/jhen0409/react-native-debugger/issues/280
// noinspection JSUnresolvedVariable
const composeEnhancer = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose;

const store = createStore(
  reducers,
  composeEnhancer(applyMiddleware(thunk, loggerMiddleware))
);

render(
  <Provider store={store}>
    <App />
  </Provider>,
  document.getElementById("content")
);
