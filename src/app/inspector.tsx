'use client';

import { Inspector } from 'react-dev-inspector';

export const InspectorDev = () => {
  if (process.env.NODE_ENV === 'development') {
    return <Inspector keys={['Ctrl', 'Shift', 'Z']} />;
  }
  return null;
};
