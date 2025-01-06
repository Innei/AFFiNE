import { cssVarV2 } from '@toeverything/theme/v2';
import { style } from '@vanilla-extract/css';

export const list = style({
  display: 'flex',
  flexDirection: 'column',
  gap: 4,
  minWidth: 250,
  maxWidth: 355,
});

export const item = style({
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  padding: 4,
});

export const itemIcon = style({
  fontSize: 20,
  lineHeight: 0,
  color: cssVarV2.icon.primary,
});

export const itemText = style({
  width: 0,
  flex: 1,
  fontSize: 14,
  lineHeight: '22px',
  color: cssVarV2.text.primary,
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
});

export const menuContent = style({
  paddingRight: 0,
});
export const scrollableViewport = style({
  paddingRight: 8,
  maxHeight: 360,
});
