import React, { Suspense, lazy } from 'react';
import ReactDOM from 'react-dom';
import { unregister } from './serviceWorker';
import { createBrowserHistory } from 'history';

const APP_ID = 'child2';

window[`mount_${APP_ID}`] = ({ history, elementId }) => {
  const App = lazy(() => import('./App'));

  ReactDOM.render(
    <Suspense fallback={<div>Child2 loading...</div>}>
      <App history={history || createBrowserHistory()} />
    </Suspense>,
    document.getElementById(elementId));

  unregister();
};

window[`unmount_${APP_ID}`] = ({ elementId }) => {
  ReactDOM.unmountComponentAtNode(document.getElementById(elementId));
};
