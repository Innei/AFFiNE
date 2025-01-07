import { style } from '@vanilla-extract/css';

export const menuItem = style({
  display: 'flex',
  alignItems: 'center',
  gap: 8,
});
export const menuItemIcon = style({
  fontSize: 24,
  lineHeight: 0,
});
export const menuItemText = style({
  fontSize: 14,
  width: 0,
  flex: 1,
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
});
