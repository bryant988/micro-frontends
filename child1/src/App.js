import React, { useState, Fragment } from 'react';
import './App.scss';
import MicroFrontend from './MicroFrontend';

const App = ({ history }) => {
  const [showChild, setShowChild] = useState(false);

  const onSendMessage = () => {
    const message = "this is a message from child1! " + new Date().toLocaleTimeString();
    const event = new CustomEvent('child2:onMessage', { detail: { message } });
    window.dispatchEvent(event);
  };

  const onGoHome = () => {
    history.push('/');
  };

  const onShowChild = () => {
    setShowChild(!showChild);
  };

  return (
    <div className="child1-wrap">
      <div className="child1-content">
        <div>This is child 1</div>
        <br />
        <button onClick={onGoHome}>Go home</button>
        <br /><br />
        <br /><br />
        <button onClick={onShowChild}>{showChild ? 'Hide' : 'Show'} child2</button>
        <br /><br />
        {showChild &&
          <Fragment>
            <br /> <br />
            <br /> <br />
            <button onClick={onSendMessage}>Send Message</button>
            <br /> <br />
            <MicroFrontend
              history={history}
              host={process.env.REACT_APP_CHILD2_HOST}
              appId={'child2'} />
          </Fragment>}
      </div>
    </div>
  );
};

export default App;
