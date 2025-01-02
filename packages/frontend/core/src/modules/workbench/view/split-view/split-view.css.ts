import { cssVar } from '@toeverything/theme';
import { createVar, fallbackVar, style } from '@vanilla-extract/css';

const gap = createVar();
const borderRadius = createVar();
const resizeHandleWidth = createVar();
export const size = createVar();
export const panelOrder = createVar();

export const splitViewRoot = style({
  vars: {
    [gap]: '0px',
    [borderRadius]: '0px',
    [resizeHandleWidth]: '10px',
  },
  display: 'flex',
  flexDirection: 'row',
  position: 'relative',
  borderRadius,
  gap,

  selectors: {
    '&[data-client-border="true"]': {
      vars: {
        [gap]: '8px',
        [borderRadius]: '6px',
      },
    },
  },
});

export const splitViewPanel = style({
  flexShrink: 0,
  flexGrow: fallbackVar(size, '1'),
  position: 'relative',
  borderRadius: 'inherit',
  order: panelOrder,
  display: 'flex',

  selectors: {
    '[data-client-border="false"] &:not([data-is-last="true"]):not([data-is-dragging="true"])':
      {
        borderRight: `0.5px solid ${cssVar('borderColor')}`,
      },
    '[data-client-border="true"] &': {
      border: `0.5px solid ${cssVar('borderColor')}`,
    },
  },
});

export const splitViewPanelDrag = style({
  width: '100%',
  height: '100%',
  borderRadius: 'inherit',
  transition: 'opacity 0.2s',

  selectors: {
    '&::after': {
      content: '""',
      position: 'absolute',
      inset: 0,
      borderRadius: 'inherit',
      pointerEvents: 'none',
      zIndex: 10,

      // animate border in/out
      boxShadow: `inset 0 0 0 0 transparent`,
      transition: 'box-shadow 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
    },

    '[data-is-dragging="true"] &::after': {
      boxShadow: `inset 0 0 0 2px ${cssVar('brandColor')}`,
    },

    '[data-is-dragging="true"] &': {
      opacity: 0.5,
    },
  },
});

export const splitViewPanelContent = style({
  width: '100%',
  height: '100%',
  borderRadius: 'inherit',
  overflow: 'hidden',
});

export const resizeHandle = style({
  position: 'absolute',
  top: 0,
  bottom: 0,
  width: resizeHandleWidth,
  // to make sure it's above all-pages's header
  zIndex: 3,

  display: 'flex',
  justifyContent: 'center',
  alignItems: 'stretch',

  selectors: {
    '&[data-can-resize="false"]:not([data-state="drop-indicator"])': {
      pointerEvents: 'none',
    },

    '&[data-state="drop-indicator"]': {
      vars: {
        [resizeHandleWidth]: '20px',
      },
    },
    '&[data-position="left"]': {
      left: `calc(${resizeHandleWidth} * -0.5)`,
      right: 'auto',
    },
    '&[data-position="left"][data-is-first="true"]': {
      left: 0,
      right: 'auto',
    },
    '&[data-is-first="true"][data-position="left"]::before, &[data-is-first="true"][data-position="left"]::after':
      {
        transform: `translateX(calc(-0.5 * ${resizeHandleWidth} + 1px))`,
      },

    '&[data-position="right"]': {
      left: 'auto',
      right: `calc(${resizeHandleWidth} * -0.5)`,
    },
    '&[data-position="right"][data-is-last="true"]': {
      right: 0,
      left: 'auto',
    },
    '&[data-is-last="true"][data-position="right"]::before, &[data-is-last="true"][data-position="right"]::after':
      {
        transform: `translateX(calc(0.5 * ${resizeHandleWidth} - 1px))`,
      },

    '&[data-can-resize="true"]': {
      cursor: 'col-resize',
    },
    '[data-client-border="true"] &[data-position="right"]': {
      right: `calc(${resizeHandleWidth} * -0.5 - 0.5px - ${gap} / 2)`,
    },
    [`.${splitViewPanel}[data-is-dragging="true"] &`]: {
      display: 'none',
    },

    '&::before, &::after': {
      content: '""',
      width: 2,
      position: 'absolute',
      height: '100%',
      background: 'transparent',
      transition: 'all 0.2s',
      borderRadius: 10,
    },
    '&:is([data-state="resizing"], [data-dragging-over="true"])::before, &:is([data-state="resizing"], [data-dragging-over="true"])::after':
      {
        width: 3,
      },
    '&:is(:hover[data-can-resize="true"], [data-state="resizing"],[data-state="drop-indicator"])::before':
      {
        background: cssVar('brandColor'),
      },
    '&:is(:hover[data-can-resize="true"], [data-state="resizing"], [data-dragging-over="true"])::after':
      {
        boxShadow: `0px 12px 21px 4px ${cssVar('brandColor')}`,
        opacity: 0.15,
      },
  },
});
