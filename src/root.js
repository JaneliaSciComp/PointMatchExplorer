import React from 'react'
import { render } from 'react-dom'
import { createStore, applyMiddleware  } from 'redux'
import { Provider } from 'react-redux'
import thunkMiddleware from 'redux-thunk'
import createLogger from 'redux-logger'
import pmeApp from './reducers'
import App from './app'

const loggerMiddleware = createLogger()
const store = createStore(
	pmeApp,
	{},
	applyMiddleware(thunkMiddleware),
	window.devToolsExtension ? window.devToolsExtension() : f => f
)

render(
	<Provider store={store}>
		<App />
	</Provider>,
	document.getElementById('content')
);
