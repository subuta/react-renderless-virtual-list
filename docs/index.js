import React from 'react'
import ReactDOM from 'react-dom'

import App from './components/App'

// Only for debug.
// if (process.env.NODE_ENV !== 'production') {
//   const {whyDidYouUpdate} = require('why-did-you-update');
//   whyDidYouUpdate(React);
// }

ReactDOM.render(<App />, document.querySelector('#app'))
