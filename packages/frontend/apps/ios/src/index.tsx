import './setup';

import {
  init,
  reactRouterV6BrowserTracingIntegration,
  setTags,
} from '@sentry/react';
import { StrictMode, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import {
  createRoutesFromChildren,
  matchRoutes,
  useLocation,
  useNavigationType,
} from 'react-router-dom';

import { App } from './app';

function main() {
  if (BUILD_CONFIG.debug || window.SENTRY_RELEASE) {
    // workaround for Capacitor HttpPlugin
    // capacitor-http-plugin will replace window.XMLHttpRequest with its own implementation
    // but XMLHttpRequest.prototype is not defined which is used by sentry
    // see: https://github.com/ionic-team/capacitor/blob/74c3e9447e1e32e73f818d252eb12f453d849e8d/core/native-bridge.ts#L581
    if ('CapacitorWebXMLHttpRequest' in window) {
      window.XMLHttpRequest.prototype = (
        window.CapacitorWebXMLHttpRequest as any
      ).prototype;
    }
    // https://docs.sentry.io/platforms/javascript/guides/react/#configure
    init({
      dsn: process.env.SENTRY_DSN,
      environment: process.env.BUILD_TYPE ?? 'development',
      integrations: [
        reactRouterV6BrowserTracingIntegration({
          useEffect,
          useLocation,
          useNavigationType,
          createRoutesFromChildren,
          matchRoutes,
        }),
      ],
    });
    setTags({
      appVersion: BUILD_CONFIG.appVersion,
      editorVersion: BUILD_CONFIG.editorVersion,
    });
  }
  mountApp();
}

function mountApp() {
  // oxlint-disable-next-line @typescript-eslint/no-non-null-assertion
  const root = document.getElementById('app')!;
  createRoot(root).render(
    <StrictMode>
      <App />
    </StrictMode>
  );
}

try {
  main();
} catch (err) {
  console.error('Failed to bootstrap app', err);
}
