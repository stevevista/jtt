import React from 'react'
import { render } from 'react-dom'
import store from './store'
import { connect, Provider } from 'react-redux'
import { IntlProvider } from 'react-intl'
import {locales} from './locales'
import moment from 'moment'
import axios from 'axios'

import Layout from './components/layout'

// import './bootstrap/npm.js'
import './styles/bootstrap/bootstrap.less'
import 'animate.css'

moment.locale(store.getState().app.locale)

class Root extends React.Component {
  render () {
    const { locale } = this.props
    return (
      <IntlProvider locale={locale} messages={locales[locale].messages}>
        <Layout/>
      </IntlProvider>
    )
  }

  componentDidMount() {
    axios.get('/user/auth/all')
      .then(({data}) => {
        store.dispatch({type: 'app/setUser', user: data})
      })
  }
}

function mapStates (state) {
  return {
    locale: state.app.locale,
    user: state.app.user
  }
}

const RootElement = connect(mapStates)(Root)

render(
  <Provider store={store}>
    <RootElement/>
  </Provider>, document.getElementById('app'))
