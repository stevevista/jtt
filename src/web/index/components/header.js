import React from 'react'

class AccountTools extends React.Component {
  render() {
    return (
      <div>
        <a href="#" className="dropdown-toggle" data-toggle="dropdown" style={{textTransform: 'uppercase', fontSize: '1.1rem', fontWeight: 600, letterSpacing: 1}}>
        </a>
      </div>
    )
  }
}

class HeaderPanel extends React.Component {
  render() {
    return (
      <header id="header-panel">
        <div className="toggle-menulayer" href="#" ><i></i></div>
        <ul className="nav navbar-nav topmenu"></ul>
        <div className="quickmenu-manager">
          <i className="fa fa-plus"></i>
        </div>
        <div className="quick-search">
          <input type="search" className="search-menu form-control search-input"/>
        </div>
        <ul className="nav navbar-nav ">
          <li className="notification"></li>
          <li className="dropdown account">
            <AccountTools/>
          </li>
        </ul>
      </header>
    )
  }
}

export default HeaderPanel
