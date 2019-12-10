import loadjs from 'loadjs';

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

export default loadMicroFrontend;