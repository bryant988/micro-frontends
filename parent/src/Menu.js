import React from 'react';
import './App.scss';
import { withRouter } from "react-router-dom";

const Menu = ({ routes, history }) => {
  return (
    <div className="parent-menu">
      {routes.map(route => {
        return (
          <div key={route.id} className="parent-menu-item" onClick={() => history.push(route.path)}>
            {route.id}
          </div>
        );
      })}
    </div>
  );
}

export default withRouter(Menu);
