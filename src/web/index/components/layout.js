import React from 'react'

import HeaderPanel from './header'
import MenuLayerPanel from './menulayer'

import '../styles/layout.less'

class Layout extends React.Component {
  render() {
    return (
      <div className="wrapper st11">
        <div id="content-panel">
          <HeaderPanel/>
          <div id="center-panel">
          </div>
          <MenuLayerPanel/>
        </div>
      </div>
    )
  }
}

export default Layout
