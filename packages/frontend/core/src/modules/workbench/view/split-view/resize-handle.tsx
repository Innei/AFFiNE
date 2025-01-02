import { useDropTarget } from '@affine/component';
import type { AffineDNDData } from '@affine/core/types/dnd';
import { useLiveData, useService } from '@toeverything/infra';
import type { HTMLAttributes } from 'react';
import { useCallback, useState } from 'react';

import type { View } from '../../entities/view';
import { WorkbenchService } from '../../services/workbench';
import * as styles from './split-view.css';

interface ResizeHandleProps extends HTMLAttributes<HTMLDivElement> {
  state: 'resizing' | 'drop-indicator' | 'idle';
  position: 'left' | 'right';
  view: View;
  onResizeStart?: () => void;
  onResizeEnd?: () => void;
  onResizing?: (offset: { x: number; y: number }) => void;
}
export const ResizeHandle = ({
  state,
  view,
  position,
  onResizing,
  onResizeStart,
  onResizeEnd,
}: ResizeHandleProps) => {
  const [draggingOver, setDraggingOver] = useState(false);
  const workbench = useService(WorkbenchService).workbench;
  const views = useLiveData(workbench.views$);

  const index = views.findIndex(v => v.id === view.id);

  const isLast = index === views.length - 1;
  const isFirst = index === 0;

  const { dropTargetRef } = useDropTarget<AffineDNDData>(() => {
    return {
      data: {
        at: 'workbench:resize-handle',
        position,
        viewId: view.id,
      },
      canDrop: data => {
        return data.source.data.entity?.type === 'doc';
      },
      onDragEnter: () => {
        setDraggingOver(true);
      },
      onDragLeave: () => {
        setDraggingOver(false);
      },
    };
  }, [position, view.id]);

  // TODO(@catsjuice): touch support
  const onMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (!onResizing || !onResizeStart || !onResizeEnd) {
        return;
      }

      e.preventDefault();

      onResizeStart?.();
      const prevPos = { x: e.clientX, y: e.clientY };

      function onMouseMove(e: MouseEvent) {
        e.preventDefault();
        const dx = e.clientX - prevPos.x;
        const dy = e.clientY - prevPos.y;
        onResizing?.({ x: dx, y: dy });
        prevPos.x = e.clientX;
        prevPos.y = e.clientY;
      }

      function onMouseUp(e: MouseEvent) {
        e.preventDefault();
        onResizeEnd?.();
        document.removeEventListener('mousemove', onMouseMove);
      }

      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp, { once: true });
    },
    [onResizeEnd, onResizeStart, onResizing]
  );

  const canResize =
    state === 'idle' &&
    !(isLast && position === 'right') &&
    !(isFirst && position === 'left');

  return (
    <div
      ref={dropTargetRef}
      data-position={position}
      onMouseDown={onMouseDown}
      data-is-last={isLast}
      data-is-first={isFirst}
      data-state={state}
      data-dragging-over={state === 'drop-indicator' ? draggingOver : undefined}
      data-can-resize={canResize}
      className={styles.resizeHandle}
    />
  );
};
