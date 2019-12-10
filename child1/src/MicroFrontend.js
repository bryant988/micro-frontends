import React, { useEffect } from 'react';
import loadMicroFrontend from './MicroFrontendService';

const MicroFrontend = ({ history, host, appId, className, style }) => {
  const elementId = `microfrontend-container-${appId}`;

  useEffect(() => {
    loadMicroFrontend(host, () => {
      window[`mount_${appId}`]({ history, elementId });
    });

    return () => {
      window[`unmount_${appId}`]({ elementId });
    }
  }, [history, host, appId, elementId]);

  return (
    <div
      id={elementId}
      className={className}
      style={style} >Loading microfrontend...</div>
  );
}

export default MicroFrontend;
