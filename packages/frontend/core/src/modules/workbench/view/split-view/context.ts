import { createContext } from 'react';

import type { View } from '../../entities/view';

export interface SplitViewContextType {
  draggingView: View | null;
  setDraggingView: (view: View | null) => void;
  droppingIndex: number | null;
  setDroppingIndex: (index: number | null) => void;
}

export const SplitViewContext = createContext<SplitViewContextType>({
  draggingView: null,
  setDraggingView: () => {},
  droppingIndex: null,
  setDroppingIndex: () => {},
});
