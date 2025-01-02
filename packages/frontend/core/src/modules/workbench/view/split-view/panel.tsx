import {
  type DropTargetDragEvent,
  MenuItem,
  shallowEqual,
  useDraggable,
  useDropTarget,
} from '@affine/component';
import type { AffineDNDData } from '@affine/core/types/dnd';
import { useI18n } from '@affine/i18n';
import {
  ExpandCloseIcon,
  MoveToLeftDuotoneIcon,
  MoveToRightDuotoneIcon,
  SoloViewIcon,
} from '@blocksuite/icons/rc';
import { useLiveData, useService } from '@toeverything/infra';
import { assignInlineVars } from '@vanilla-extract/dynamic';
import type { HTMLAttributes, PropsWithChildren } from 'react';
import { memo, useCallback, useMemo } from 'react';

import type { View } from '../../entities/view';
import { WorkbenchService } from '../../services/workbench';
import { SplitViewIndicator } from './indicator';
import { ResizeHandle } from './resize-handle';
import * as styles from './split-view.css';

export interface SplitViewPanelProps
  extends PropsWithChildren<HTMLAttributes<HTMLDivElement>> {
  view: View;
  index: number;
  resizeHandle?: React.ReactNode;
  onMove: (from: number, to: number) => void;
  onResizing: (dxy: { x: number; y: number }) => void;
  draggingDoc: boolean;
}

export const SplitViewPanelContainer = ({
  children,
  ...props
}: HTMLAttributes<HTMLDivElement>) => {
  return (
    <div className={styles.splitViewPanel} {...props}>
      {children}
    </div>
  );
};

/**
 * Calculate the order of the panel
 */
function calculateOrder(
  index: number,
  draggingIndex: number,
  droppingIndex: number
) {
  // If not dragging or invalid indices, return original index
  if (draggingIndex === -1 || draggingIndex < 0 || droppingIndex < 0) {
    return index;
  }

  // If this is the dragging item, move it to the dropping position
  if (index === draggingIndex) {
    return droppingIndex;
  }

  // If dropping before the dragging item
  if (droppingIndex < draggingIndex) {
    // Items between drop and drag positions shift right
    if (index >= droppingIndex && index < draggingIndex) {
      return index + 1;
    }
  }
  // If dropping after the dragging item
  else if (
    droppingIndex > draggingIndex &&
    index > draggingIndex &&
    index <= droppingIndex
  ) {
    // Items between drag and drop positions shift left
    return index - 1;
  }

  // For all other items, keep their original position
  return index;
}

export const SplitViewPanel = memo(function SplitViewPanel({
  children,
  view,
  onMove,
  onResizing,
  draggingDoc,
  index,
}: SplitViewPanelProps) {
  const size = useLiveData(view.size$);
  const workbench = useService(WorkbenchService).workbench;

  const activeView = useLiveData(workbench.activeView$);
  const views = useLiveData(workbench.views$);
  const isLast = views[views.length - 1] === view;
  const isActive = activeView === view;

  const draggingOver = useLiveData(workbench.draggingOver$);
  const draggingView = useLiveData(workbench.draggingView$);
  const resizingView = useLiveData(workbench.resizingView$);

  const order = useMemo(
    () =>
      calculateOrder(
        index,
        draggingView?.index ?? -1,
        draggingOver?.index ?? -1
      ),
    [index, draggingView, draggingOver]
  );

  const style = useMemo(() => {
    return {
      ...assignInlineVars({
        [styles.size]: size.toString(),
        [styles.panelOrder]: order.toString(),
      }),
    };
  }, [size, order]);

  const { dropTargetRef } = useDropTarget<AffineDNDData>(() => {
    const handleDrag = (data: DropTargetDragEvent<AffineDNDData>) => {
      if (data.source.data.from?.at !== 'workbench:view') {
        return;
      }

      if (
        shallowEqual(workbench.draggingOver$.value, {
          view,
          index: order,
        })
      ) {
        return;
      }

      workbench.draggingOver$.value = {
        view,
        index: order,
      };

      if (data.source.data.from?.viewId === view.id) {
        return;
      }
    };

    return {
      isSticky: true,
      canDrop(data) {
        return data.source.data.from?.at === 'workbench:view';
      },
      onDragEnter: handleDrag,
      onDrag: handleDrag,
    };
  }, [order, view, workbench.draggingOver$]);

  const { dragRef, dragHandleRef } = useDraggable<AffineDNDData>(() => {
    return {
      data: () => {
        return {
          from: {
            at: 'workbench:view',
            viewId: view.id,
          },
        };
      },
      onDrop() {
        if (order !== index && workbench.draggingOver$.value) {
          onMove?.(index, workbench.draggingOver$.value.index);
        }
        workbench.draggingView$.value = null;
        workbench.draggingOver$.value = null;
      },
      onDragStart() {
        workbench.draggingView$.value = {
          view,
          index: order,
        };
      },
      disableDragPreview: true,
    };
  }, [
    index,
    onMove,
    order,
    view,
    workbench.draggingOver$,
    workbench.draggingView$,
  ]);

  const dragging = draggingView?.view.id === view.id;

  const onResizeStart = useCallback(() => {
    workbench.resizingView$.value = { view, index };
  }, [view, index, workbench.resizingView$]);

  const onResizeEnd = useCallback(() => {
    workbench.resizingView$.value = null;
  }, [workbench.resizingView$]);

  return (
    <SplitViewPanelContainer
      style={style}
      data-is-dragging={dragging}
      data-is-active={isActive && views.length > 1}
      data-is-last={isLast}
      data-testid="split-view-panel"
      draggable={false} // only drag via drag handle
    >
      {index === 0 ? (
        <ResizeHandle
          position="left"
          view={view}
          state={draggingDoc ? 'drop-indicator' : 'idle'}
        />
      ) : null}
      <div
        ref={node => {
          dropTargetRef.current = node;
          dragRef.current = node;
        }}
        className={styles.splitViewPanelDrag}
      >
        <div draggable={false} className={styles.splitViewPanelContent}>
          {children}
        </div>
        {views.length > 1 && onMove ? (
          <SplitViewIndicator
            view={view}
            isActive={isActive}
            isDragging={dragging}
            dragHandleRef={dragHandleRef}
            menuItems={<SplitViewMenu view={view} onMove={onMove} />}
          />
        ) : null}
      </div>
      {!draggingView ? (
        <ResizeHandle
          position="right"
          view={view}
          state={
            resizingView?.view.id === view.id
              ? 'resizing'
              : draggingDoc
                ? 'drop-indicator'
                : 'idle'
          }
          onResizeStart={onResizeStart}
          onResizeEnd={onResizeEnd}
          onResizing={onResizing}
        />
      ) : null}
    </SplitViewPanelContainer>
  );
});

const SplitViewMenu = ({
  view,
  onMove,
}: {
  view: View;
  onMove: (from: number, to: number) => void;
}) => {
  const t = useI18n();
  const workbench = useService(WorkbenchService).workbench;
  const views = useLiveData(workbench.views$);

  const viewIndex = views.findIndex(v => v === view);

  const handleClose = useCallback(
    () => workbench.close(view),
    [view, workbench]
  );
  const handleMoveLeft = useCallback(() => {
    onMove(viewIndex, viewIndex - 1);
  }, [onMove, viewIndex]);
  const handleMoveRight = useCallback(() => {
    onMove(viewIndex, viewIndex + 1);
  }, [onMove, viewIndex]);
  const handleCloseOthers = useCallback(() => {
    workbench.closeOthers(view);
  }, [view, workbench]);

  const CloseItem =
    views.length > 1 ? (
      <MenuItem prefixIcon={<ExpandCloseIcon />} onClick={handleClose}>
        {t['com.affine.workbench.split-view-menu.close']()}
      </MenuItem>
    ) : null;

  const MoveLeftItem =
    viewIndex > 0 && views.length > 1 ? (
      <MenuItem onClick={handleMoveLeft} prefixIcon={<MoveToLeftDuotoneIcon />}>
        {t['com.affine.workbench.split-view-menu.move-left']()}
      </MenuItem>
    ) : null;

  const FullScreenItem =
    views.length > 1 ? (
      <MenuItem onClick={handleCloseOthers} prefixIcon={<SoloViewIcon />}>
        {t['com.affine.workbench.split-view-menu.keep-this-one']()}
      </MenuItem>
    ) : null;

  const MoveRightItem =
    viewIndex < views.length - 1 ? (
      <MenuItem
        onClick={handleMoveRight}
        prefixIcon={<MoveToRightDuotoneIcon />}
      >
        {t['com.affine.workbench.split-view-menu.move-right']()}
      </MenuItem>
    ) : null;
  return (
    <>
      {MoveRightItem}
      {MoveLeftItem}
      {FullScreenItem}
      {CloseItem}
    </>
  );
};
