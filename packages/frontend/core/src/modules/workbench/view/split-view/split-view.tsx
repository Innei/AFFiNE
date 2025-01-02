import { useDndMonitor } from '@affine/component';
import { useAppSettingHelper } from '@affine/core/components/hooks/affine/use-app-setting-helper';
import { DesktopApiService } from '@affine/core/modules/desktop-api';
import { FeatureFlagService } from '@affine/core/modules/feature-flag';
import type { AffineDNDData } from '@affine/core/types/dnd';
import {
  useLiveData,
  useService,
  useServiceOptional,
} from '@toeverything/infra';
import clsx from 'clsx';
import type { HTMLAttributes } from 'react';
import { useCallback, useLayoutEffect, useRef, useState } from 'react';

import type { View } from '../../entities/view';
import { WorkbenchService } from '../../services/workbench';
import { SplitViewPanel } from './panel';
import * as styles from './split-view.css';

export interface SplitViewProps extends HTMLAttributes<HTMLDivElement> {
  /**
   * ⚠️ `vertical` orientation is not supported yet
   * @default 'horizontal'
   */
  orientation?: 'horizontal' | 'vertical';
  views: View[];
  renderer: (item: View) => React.ReactNode;
  onMove?: (from: number, to: number) => void;
}

export const SplitView = ({
  orientation = 'horizontal',
  className,
  views,
  renderer,
  onMove,
  ...attrs
}: SplitViewProps) => {
  const rootRef = useRef<HTMLDivElement>(null);
  const { appSettings } = useAppSettingHelper();
  const workbench = useService(WorkbenchService).workbench;
  const electronApi = useServiceOptional(DesktopApiService);
  const featureFlagService = useService(FeatureFlagService);

  // workaround: blocksuite's lit host element has an issue on remounting.
  // we do not want the view to change its render ordering here after reordering
  // instead we use a local state to store the views + its order to avoid remounting
  const [localViewsState, setLocalViewsState] = useState<View[]>(views);

  useLayoutEffect(() => {
    setLocalViewsState(oldViews => {
      let newViews = oldViews.filter(v => views.includes(v));

      for (const view of views) {
        if (!newViews.includes(view)) {
          newViews.push(view);
        }
      }

      return newViews;
    });
  }, [views]);

  const onResizing = useCallback(
    (index: number, { x, y }: { x: number; y: number }) => {
      const rootEl = rootRef.current;
      if (!rootEl) return;

      const rootRect = rootEl.getBoundingClientRect();
      const offset = orientation === 'horizontal' ? x : y;
      const total =
        orientation === 'horizontal' ? rootRect.width : rootRect.height;

      const percent = offset / total;
      workbench.resize(index, percent);
    },
    [orientation, workbench]
  );

  const handleOnMove = useCallback(
    (from: number, to: number) => {
      onMove?.(from, to);
    },
    [onMove]
  );

  const enableMultiView = useLiveData(
    featureFlagService.flags.enable_multi_view.$
  );

  const [draggingDoc, setDraggingDoc] = useState(false);

  useDndMonitor<AffineDNDData>(() => {
    return {
      // todo(@pengx17): external data for monitor is not supported yet
      // allowExternal: true,
      onDragStart(data) {
        if (
          enableMultiView &&
          data.source.data?.entity?.type === 'doc' &&
          !(
            data.source.data?.from?.at === 'app-header:tabs' &&
            data.source.data?.from?.tabId === electronApi?.appInfo.viewId
          )
        ) {
          setDraggingDoc(true);
        }
      },
      onDrop(data) {
        if (!enableMultiView) {
          return;
        }

        setDraggingDoc(false);
        if (!data.source.data.entity) {
          return;
        }

        const candidate = data.location.current.dropTargets.find(
          target => target.data.at === 'workbench:resize-handle'
        );
        if (!candidate) {
          return;
        }

        const from = candidate.data as AffineDNDData['draggable']['from'];

        if (from?.at === 'workbench:resize-handle') {
          const { position, viewId } = from;
          const index = views.findIndex(v => v.id === viewId);
          const at = (() => {
            if (position === 'left') {
              if (index === 0) {
                return 'head';
              }
              return index - 1;
            } else if (position === 'right') {
              if (index === views.length - 1) {
                return 'tail';
              }
              return index + 1;
            } else {
              return 'tail';
            }
          })();
          const to = `/${data.source.data.entity.id}`;
          workbench.createView(at, to);
        }
      },
    };
  }, []);

  return (
    <div
      ref={rootRef}
      className={clsx(styles.splitViewRoot, className)}
      data-orientation={orientation}
      data-client-border={appSettings.clientBorder}
      {...attrs}
    >
      {localViewsState.map(view => {
        const order = views.indexOf(view);
        return (
          <SplitViewPanel
            view={view}
            index={order}
            key={view.id}
            onMove={handleOnMove}
            onResizing={dxy => onResizing(order, dxy)}
            draggingDoc={draggingDoc}
          >
            {renderer(view)}
          </SplitViewPanel>
        );
      })}
    </div>
  );
};
