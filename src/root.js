import React from "react";
import { render } from "react-dom";
import { createStore, compose, applyMiddleware  } from "redux";
import thunk from "redux-thunk";
import reducers from "./reducers";
import { Provider } from "react-redux";
import { createLogger } from "redux-logger";
import App from "./app"

//TODO: look into logging

// noinspection JSUnusedLocalSymbols
const loggerMiddleware = createLogger(); // eslint-disable-line

// stolen from https://github.com/jhen0409/react-native-debugger/issues/280
// noinspection JSUnresolvedVariable
const composeEnhancer = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose;

const store = createStore(
  reducers,
  composeEnhancer(applyMiddleware(thunk))
);

render(
  <Provider store={store}>
    <App />
  </Provider>,
  document.getElementById("content")
);
