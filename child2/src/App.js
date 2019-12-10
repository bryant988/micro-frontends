import React, { useState, useEffect } from 'react';
import './App.scss';

const App = ({ history }) => {
  const [message, setMessage] = useState(null);

  useEffect(() => {
    const handleOnMessage = (event) => {
      setMessage(event.detail.message);
    };

    window.addEventListener(`child2:onMessage`, handleOnMessage);

    return () => {
      window.removeEventListener('child2:onMessage', handleOnMessage);
    }
  }, [])

  const onGoHome = () => {
    history.push('/');
  };

  return (
    <div className="child2-wrap">
      <div className="child2-content">
        <div>This is child 2</div>
        <br /><br />
        <button onClick={onGoHome}>Go home</button>
        <br /><br />
        {message}
      </div>
    </div>
  );
};

export default App;
