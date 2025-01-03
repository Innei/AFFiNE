import { AffineContext } from '@affine/core/components/context';
import { WindowsAppControls } from '@affine/core/components/pure/header/windows-app-controls';
import { AppContainer } from '@affine/core/desktop/components/app-container';
import { router } from '@affine/core/desktop/router';
import { configureCommonModules } from '@affine/core/modules';
import { configureAppTabsHeaderModule } from '@affine/core/modules/app-tabs-header';
import { ValidatorProvider } from '@affine/core/modules/cloud';
import {
  configureDesktopApiModule,
  DesktopApiService,
} from '@affine/core/modules/desktop-api';
import { GlobalDialogService } from '@affine/core/modules/dialogs';
import { DocsService } from '@affine/core/modules/doc';
import {
  configureSpellCheckSettingModule,
  EditorSettingService,
} from '@affine/core/modules/editor-setting';
import { configureFindInPageModule } from '@affine/core/modules/find-in-page';
import { GlobalContextService } from '@affine/core/modules/global-context';
import { I18nProvider } from '@affine/core/modules/i18n';
import { LifecycleService } from '@affine/core/modules/lifecycle';
import { configureElectronStateStorageImpls } from '@affine/core/modules/storage';
import {
  ClientSchemeProvider,
  PopupWindowProvider,
} from '@affine/core/modules/url';
import { configureSqliteUserspaceStorageProvider } from '@affine/core/modules/userspace';
import {
  configureDesktopWorkbenchModule,
  WorkbenchService,
} from '@affine/core/modules/workbench';
import {
  WorkspaceEngineWorkerProvider,
  WorkspacesService,
} from '@affine/core/modules/workspace';
import {
  configureBrowserWorkspaceFlavours,
  configureSqliteWorkspaceEngineStorageProvider,
} from '@affine/core/modules/workspace-engine';
import createEmotionCache from '@affine/core/utils/create-emotion-cache';
import { apis, events } from '@affine/electron-api';
import { connectWebWorker } from '@affine/electron-api/web-worker';
import { WorkerClient } from '@affine/nbstore/worker/client';
import { CacheProvider } from '@emotion/react';
import { Framework, FrameworkRoot, getCurrentStore } from '@toeverything/infra';
import { OpClient } from '@toeverything/infra/op';
import { Suspense } from 'react';
import { RouterProvider } from 'react-router-dom';

import { DesktopThemeSync } from './theme-sync';

const desktopWhiteList = [
  '/open-app/signin-redirect',
  '/open-app/url',
  '/upgrade-success',
  '/ai-upgrade-success',
  '/share',
  '/oauth',
  '/magic-link',
];
if (
  !BUILD_CONFIG.isElectron &&
  BUILD_CONFIG.debug &&
  desktopWhiteList.every(path => !location.pathname.startsWith(path))
) {
  document.body.innerHTML = `<h1 style="color:red;font-size:5rem;text-align:center;">Don't run electron entry in browser.</h1>`;
  throw new Error('Wrong distribution');
}

const cache = createEmotionCache();

const future = {
  v7_startTransition: true,
} as const;

const framework = new Framework();
configureCommonModules(framework);
configureElectronStateStorageImpls(framework);
configureBrowserWorkspaceFlavours(framework);
configureSqliteWorkspaceEngineStorageProvider(framework);
configureSqliteUserspaceStorageProvider(framework);
configureDesktopWorkbenchModule(framework);
configureAppTabsHeaderModule(framework);
configureFindInPageModule(framework);
configureDesktopApiModule(framework);
configureSpellCheckSettingModule(framework);
framework.impl(WorkspaceEngineWorkerProvider, {
  openWorker(options) {
    const worker = new Worker(
      new URL(
        /* webpackChunkName: "nbstore-worker" */ './worker.ts',
        import.meta.url
      )
    );
    const electronApiCleanup = connectWebWorker(worker);
    const client = new WorkerClient(new OpClient(worker), options);
    return {
      client,
      dispose: () => {
        worker.terminate();
        electronApiCleanup();
      },
    };
  },
});
framework.impl(PopupWindowProvider, p => {
  const apis = p.get(DesktopApiService).api;
  return {
    open: (url: string) => {
      apis.handler.ui.openExternal(url).catch(e => {
        console.error('Failed to open external URL', e);
      });
    },
  };
});
framework.impl(ClientSchemeProvider, p => {
  const appInfo = p.get(DesktopApiService).appInfo;
  return {
    getClientScheme() {
      return appInfo?.scheme;
    },
  };
});
framework.impl(ValidatorProvider, p => {
  const apis = p.get(DesktopApiService).api;
  return {
    async validate(_challenge, resource) {
      const token = await apis.handler.ui.getChallengeResponse(resource);
      if (!token) {
        throw new Error('Challenge failed');
      }
      return token;
    },
  };
});
const frameworkProvider = framework.provider();

// setup application lifecycle events, and emit application start event
window.addEventListener('focus', () => {
  frameworkProvider.get(LifecycleService).applicationFocus();
});
frameworkProvider.get(LifecycleService).applicationStart();
window.addEventListener('unload', () => {
  frameworkProvider
    .get(DesktopApiService)
    .api.handler.ui.pingAppLayoutReady(false)
    .catch(console.error);
});

events?.applicationMenu.openAboutPageInSettingModal(() =>
  frameworkProvider.get(GlobalDialogService).open('setting', {
    activeTab: 'about',
  })
);
events?.applicationMenu.onNewPageAction(() => {
  const currentWorkspaceId = frameworkProvider
    .get(GlobalContextService)
    .globalContext.workspaceId.get();
  const workspacesService = frameworkProvider.get(WorkspacesService);
  const workspaceRef = currentWorkspaceId
    ? workspacesService.openByWorkspaceId(currentWorkspaceId)
    : null;
  if (!workspaceRef) {
    return;
  }
  const { workspace, dispose } = workspaceRef;
  const editorSettingService = frameworkProvider.get(EditorSettingService);
  const docsService = workspace.scope.get(DocsService);
  const editorSetting = editorSettingService.editorSetting;

  const docProps = {
    note: editorSetting.get('affine:note'),
  };
  apis?.ui
    .isActiveTab()
    .then(isActive => {
      if (!isActive) {
        return;
      }
      const page = docsService.createDoc({ docProps });
      workspace.scope.get(WorkbenchService).workbench.openDoc(page.id);
    })
    .catch(err => {
      console.error(err);
    });

  dispose();
});

export function App() {
  return (
    <Suspense>
      <FrameworkRoot framework={frameworkProvider}>
        <CacheProvider value={cache}>
          <I18nProvider>
            <AffineContext store={getCurrentStore()}>
              <DesktopThemeSync />
              <RouterProvider
                fallbackElement={<AppContainer fallback />}
                router={router}
                future={future}
              />
              {environment.isWindows && (
                <div style={{ position: 'fixed', right: 0, top: 0, zIndex: 5 }}>
                  <WindowsAppControls />
                </div>
              )}
            </AffineContext>
          </I18nProvider>
        </CacheProvider>
      </FrameworkRoot>
    </Suspense>
  );
}
