import React, { Suspense, lazy, /* useEffect */ } from 'react';
import { BrowserRouter as Router, Route, Switch } from "react-router-dom";
import './App.scss';
import Menu from './Menu';
import MicroFrontend from './MicroFrontend';
// import { UserManager } from 'oidc-client';

const ParentFragment = lazy(() => import('./ParentFragment'));

const Child1 = ({ history }) => (
  <MicroFrontend
    history={history}
    host={process.env.REACT_APP_CHILD1_HOST}
    appId={'child1'} />
);

const Child2 = ({ history }) => (
  <MicroFrontend
    history={history}
    host={process.env.REACT_APP_CHILD2_HOST}
    appId={'child2'} />
);

const Routes = [
  { id: 'H', path: '/', component: ParentFragment, exact: true },
  { id: '1', path: '/1', component: Child1 },
  { id: '2', path: '/2', component: Child2 }
];

// let userManager;

const App = () => {

  // useEffect(() => {
  //   const settings = {
  //     client_id: btoa('demo.localhost:3000'),
  //     redirect_uri: `http://demo.localhost:3000/?screenId=signin_oidc`,
  //     response_type: 'token id_token',
  //     scope: 'openid profile email role cw_manage api.portal',
  //     authority: 'https://dev.fso.connectwisedev.com',
  //     post_logout_redirect_uri: 'http://demo.localhost:3000',
  //     // automaticSilentRenew: true,
  //     // silent_redirect_uri: `${window.location.protocol}//${window.location.host}/silent_renew.html`,
  //   };
  //   userManager = new UserManager(settings);

  //   userManager.events.addUserLoaded(u => {
  //     console.log('userloaded! ');
  //     console.log(u);
  //   })

  //   if (window.location.hash) {
  //     userManager.signinRedirectCallback().then(user => {
  //       console.log('signinRedirectCallback()');
  //       console.log(user);
  //     });
  //     return;
  //   }

  //   userManager.getUser().then(user => {
  //     if (!user) {
  //       userManager.signinRedirect();
  //     } else {
  //       console.log('getUser()');
  //       console.log(user);
  //     }
  //   });
  // }, []);

  return (
    <Router>
      <div className="parent-app">
        <Menu routes={Routes} />
        <Suspense fallback={<div>Parent loading...</div>}>
          <div className="parent-content">
            <Switch>
              {Routes.map(route => {
                return (
                  <Route key={route.id} exact={route.exact} path={route.path} component={route.component} />
                );
              })}
            </Switch>
          </div>
        </Suspense>
      </div>
    </Router>
  );
}

export default App;
