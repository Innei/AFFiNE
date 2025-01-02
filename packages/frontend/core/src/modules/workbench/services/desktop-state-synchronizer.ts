import { LiveData, Service } from '@toeverything/infra';

import type { DesktopApiService } from '../../desktop-api';
import type { WorkbenchService } from '../../workbench';

/**
 * Synchronize workbench state with state stored in main process
 */
export class DesktopStateSynchronizer extends Service {
  constructor(
    private readonly workbenchService: WorkbenchService,
    private readonly electronApi: DesktopApiService
  ) {
    super();
    this.startSync();
  }

  startSync = () => {
    if (!BUILD_CONFIG.isElectron) {
      return;
    }

    const workbench = this.workbenchService.workbench;
    const appInfo = this.electronApi.appInfo;

    this.electronApi.events.ui.onTabAction(event => {
      if (
        event.type === 'open-in-split-view' &&
        event.payload.tabId === appInfo?.viewId
      ) {
        workbench.openAll({
          at: 'beside',
          show: false,
        });
      }

      if (
        event.type === 'separate-view' &&
        event.payload.tabId === appInfo?.viewId
      ) {
        const view = workbench.viewAt(event.payload.viewIndex);
        if (view) {
          workbench.close(view);
        }
      }

      if (
        event.type === 'activate-view' &&
        event.payload.tabId === appInfo?.viewId
      ) {
        workbench.active(event.payload.viewIndex);
      }
    });

    this.electronApi.events.ui.onToggleRightSidebar(tabId => {
      if (tabId === appInfo?.viewId) {
        workbench.sidebarOpen$.next(!workbench.sidebarOpen$.value);
      }
    });

    // sync workbench state with main process
    // also fill tab view meta with title & moduleName
    LiveData.computed(get => {
      return get(workbench.views$).map(view => {
        const location = get(view.location$);
        return {
          id: view.id,
          title: get(view.title$),
          iconName: get(view.icon$),
          path: {
            pathname: location.pathname,
            search: location.search,
            hash: location.hash,
          },
        };
      });
    }).subscribe(views => {
      if (!appInfo?.viewId) {
        return;
      }

      this.electronApi.handler.ui
        .updateWorkbenchMeta(appInfo.viewId, {
          views,
        })
        .catch(console.error);
    });

    workbench.activeViewIndex$.subscribe(activeViewIndex => {
      if (!appInfo?.viewId) {
        return;
      }

      this.electronApi.handler.ui
        .updateWorkbenchMeta(appInfo.viewId, {
          activeViewIndex: activeViewIndex,
        })
        .catch(console.error);
    });

    workbench.basename$.subscribe(basename => {
      if (!appInfo?.viewId) {
        return;
      }

      this.electronApi.handler.ui
        .updateWorkbenchMeta(appInfo.viewId, {
          basename: basename,
        })
        .catch(console.error);
    });
  };
}
