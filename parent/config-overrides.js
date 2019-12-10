module.exports = {
  // The Webpack config to use when compiling your react app for development or production.
  webpack: function (config, env) {
    // https://github.com/camjackson/react-app-rewire-micro-frontends/blob/master/config-overrides.js
    config.externals = {
      react: 'React',
      'react-dom': 'ReactDOM'
    };
    return config;
  }
}