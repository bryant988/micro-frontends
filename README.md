# Micro Frontends Demo
This is a demo project showcasing [micro frontend architecture](https://martinfowler.com/articles/micro-frontends.html)

*This is intended to serve as an example app demonstrating micro frontends concepts and can be modified depending on specific project needs and scenarios. Each project can have different sets of limitations and workarounds so this can be used as a starting point for incorporating a micro frontend architecture.*

The demo project consists of 3 separate applications.

Each application was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

To run each project, make sure to `npm install` to install dependencies and then `npm start` to run locally.

### `Parent`
Container app which hosts the micro frontend apps.

Application will run in `localhost:3000`

### `Child1`
Micro frontend app which is hosted within parent app and also hosts child2.

Application will run in `localhost:3001`


### `Child2`
Micro frontend app which is hosted within parent and child1 app.

Application will run in `localhost:3002`

# Micro Frontends Architecture

## Interface
The contract between a container and micro frontend simply consists of two main functions (mount and unmount).

### Mount
Each micro frontend app defines a uniquely named mount function on shared global window object which handles initialization and rendering of component.

This function can handle initialization of history object, lazy loading application, authentication, etc.

```javascript
// child1 index.js
window["mount_child1"] = ({ elementId, history }) => {
  ReactDOM.render(<App history={history} />, document.getElementById(elementId));
}
```
### Unmount
Each micro frontend app defines a uniquely named unmount function on shared global window object which handles unmounting and cleanup of rendered component.

```javascript
// child1 index.js
window["unmount_child1"] = ({ elementId }) => {
  ReactDOM.unmountComponentAtNode(document.getElementById(elementId));
}
```

### Communication
It is assumed that each micro frontend is fully standalone and should be able to function without constant messaging from container or other micro frontends.

However, special cases always exist and some sort of cross-app communication may be needed. [Custom events](https://developer.mozilla.org/en-US/docs/Web/Guide/Events/Creating_and_triggering_events) allows indirect communication which maintains decoupling. The `detail` property canbe used to pass custom data.

Anyone (parent/micro frontends) is able to publish and subscribe to any message. For direct communication to specific apps, it is suggested to use unique/specific scoped event names.

```javascript
// parent
const event = new CustomEvent('child1:onButtonClick', { detail: { id } });
window.dispatchEvent(event);
```

```javascript
// child1
window.addEventListener('child1:onButtonClick', (event) => {
  doSomething(event.detail.id);
});
```

## Integration
Each micro frontend is assumed to be fully standalone including independent deployment. Therefore, we do not use build-time integration, instead we use run-time javascript integration.

If we know the micro frontend scripts ahead of time and do not care to split out the load times, you can simply include the necessary `<script>` and `<style>` tags in html file. This will preload all micro frontends at startup but may delay first render.

For more dynamic/complex micro frontends, you can dynamically load an [asset-manifest.json](https://github.com/facebook/create-react-app/issues/6436) file which lists the necessary hashed javascript files needed to load the app. To avoid duplicate file loading, it is suggested to cache what is loaded and add `id` attribute for each `<script>` and `<style>` tags so other micro frontends can know what has already been loaded by other apps.

```javascript
// MicroFrontendService.js
const loadedCache = {};

const loadMicroFrontend = async (host, callback) => {
  // avoid loading asset-manifest.json more than once
  const cached = loadedCache[host];
  if (cached) {
    callback();
    return;
  }

  // fetch asset-manifest.json
  const res = await fetch(`${host}/asset-manifest.json`);
  const json = await res.json();
  loadedCache[host] = true;

  const entrypoints = json.entrypoints;

  // proceed if nothing to load from manifest
  if (!entrypoints) {
    callback();
    return;
  }

  // avoid loading same files more than once
  const files = [];
  for (let i = 0; i < entrypoints.length; i++) {
    const fileName = `${host}/${entrypoints[i]}`;
    const isLoaded = document.getElementById(fileName);
    if (!isLoaded) {
      files.push(fileName);
    }
  }

  // proceed if files already loaded
  if (files.length < 1) {
    callback();
    return;
  }

  // wait for files to load before callback
  loadjs(files, {
    async: true,
    success: callback,
    before: (path, scriptEl) => {
      scriptEl.id = path;
    }
  });
};
```

```javascript
// MicroFrontend.js
const MicroFrontend = ({ history, host, appId }) => {
  const elementId = `microfrontend-container-${appId}`;

  useEffect(() => {
    loadMicroFrontend(host, () => {
      window[`mount_${appId}`]({ elementId, history });
    });

    return () => {
      window[`unmount_${appId}`]({ elementId });
    }
  }, [history, host, appId, elementId]);

  return (
    <div id={elementId} />
  );
}
```
### Micro Frontend Bundling (webpack)
It is suggested to minimize and include webpack runtime chunk in child's initial bundle that loads micro frontend's main `index.js` entrypoint. [Overriding](https://github.com/timarney/react-app-rewired) the `config.optimization.runtimeChunk` and `config.optimization.splitChunks` configurations allow us to edit the default code splitting settings.

```javascript
// child's config-overrides.js
module.exports = {
  webpack: function (config, env) {
    // export initial bundle into single chunk
    config.optimization.runtimeChunk = false;
    config.optimization.splitChunks = {
      cacheGroups: {
        default: false
      }
    };
    return config;
  },
  devServer: function (configFunction) {
    return function (proxy, allowedHost) {
      const config = configFunction(proxy, allowedHost);
      // Allow cors for loading assets from different origins
      config.headers = {
        'Access-Control-Allow-Origin': '*',
      };
      return config;
    };
  },
}
```
### Micro Frontend Code Splitting (webpack)
If a micro frontend is very small, there is no need to chunk out specific components/pages. The whole app could be bundled together in 1 payload. 

However, if it makes sense to [split](https://reactjs.org/docs/code-splitting.html) out multiple components within the micro frontend, then the webpack configuration will need to be updated to include an absolute path (or relative subpath) since by default it uses relative path to load chunks. This causes problems because if each micro frontend is hosted in different domains, its' webpack must know which corresponding domain to go for when downloading split chunks.

#### Relative subpath
A project can choose to deploy container and all micro frontend apps of a project in domain, split by subfolders, such as:
```
https://myapp.com:
  /parent
    /static
      /js
  /child1
    /static
      /js
  /child2
    /static
      /js
```

Then the webpack [publicPath](https://webpack.js.org/guides/public-path) can be set to relative subpath

```javascript
// child1 config-overrides.js
module.exports = {
  webpack: function (config, env) {
    config.output.path = 'child1/'
    config.output.publicPath = 'child1/';
    return config;
  },
}
```

#### Absolute path
A project can choose to deploy container and all micro frontend apps of a project in separate domains such as:
```
https://parent.com:
  /static
    /js

https://child1.com:
  /static
    /js

https://child2.com:
  /static
    /js
```

Then the webpack [publicPath](https://webpack.js.org/guides/public-path) would have to be set to absolute paths including domain. Note that this may differ between local dev and production deployments, so its better to define them using [environment variables](https://github.com/bkeepers/dotenv#what-other-env-files-can-i-use)

```python
# child1 .env.deployment
ASSET_PATH=http://localhost:3001/
```
```python
# child1 .env.production
ASSET_PATH=https://child1.com/
```

```javascript
// child1 config-overrides.js
module.exports = {
  webpack: function (config, env) {
    config.output.publicPath = process.env.ASSET_PATH;
    return config;
  },
}
```
## Routing
Using a router such as [react-router](https://reacttraining.com/react-router/), allows you to pass the [history](https://github.com/ReactTraining/react-router/blob/master/packages/react-router/docs/api/history.md) object to micro frontends when mounting. This way there is only one history object that can be instantiated by parent container. It can be shared to all micro frontends allowing proper routing and navigation without always having to involve the parent container.

```javascript
// App.js
const Child1 = ({ history }) => (
  <MicroFrontend host={'http://localhost:3001'} name={'child1'} history={history} />
);

const App = () => (
  <BrowserRouter>
    <Route exact path="/" component={Child1} />
  </BrowserRouter>
);
```

## Dependencies
Each micro frontend will usually build and deploy including its own dependencies (even if they happen to be duplicated in memory across all micro frontends) to simplify integration process. 

There might be cases where a project might want to consolidate dependencies and can achieve it thru use of umd build script tags. The parent container can define all dependencies in html script tags and all child micro frontend apps can assume dependency will exist in memory at time of loading. This does, however, introduce dependency version coupling among all micro frontends which means that updating a dependency version can become more brittle.

Note: Duplicated dependencies can possibly cause memory issues if too much resources are unnecessarily taken up and other options can be looked in to such as monorepo or other build-time integrations such as making each micro frontend an npm library, which can help with de-duplicating common dependencies. But this can also cause other issue such as coupling release process, involving recompilation/release of every single micro frontend in order to release any type of change.

```html
<!-- index.html -->
<!DOCTYPE html>
<html lang="en">
  <head>
    ...
    <script crossorigin src="https://parent.com/umd/react.production.min.js"></script>
    <script crossorigin src="https://parent.com/umd/react-dom.production.min.js"></script>
  </head>
  <body>
  </body>
</html>
```

```javascript
// parent/child config-override.js
module.exports = {
  webpack: function (config, env) {
    config.externals = {
      react: 'React',
      'react-dom': 'ReactDOM'
    };
    return config;
  }
}
```

## Styling
Each micro frontends includes independent CSS bundling and deployment. Like the DOM, since CSS is global and cascading, it is **strongly** suggested that each stylesheet use proper scoping or namespacing conventions to avoid style classname clashes. Also should shy away from global css selectors which may undesirably bleed out and affect styling on other micro frontends loaded on the DOM as well. Common CSS scoping solutions include [css-modules](https://github.com/css-modules/css-modules) or various [css-in-js](https://mxstbr.com/thoughts/css-in-js) libraries which ensure styles are directly applied where desired. These patterns can also be achieved through [postcss-wrap](https://github.com/ruslansavenok/postcss-wrap) to gain CSS stylesheet independence.

For overall general theming, some projects may use a shared component library or some bootstrap UI framework that can define overall shared styling through global css that can be injected once by parent container and consumed by micro frontends. [CSS Variables](https://developer.mozilla.org/en-US/docs/Web/CSS/Using_CSS_custom_properties) can also be used to drive dynamic theming consistency throught parent and micro frontend apps.