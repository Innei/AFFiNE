import type { CSSProperties, JSX } from 'react';

export type EmailTemplateProps = {
  title: string;
  content: JSX.Element | string;
  buttonContent?: string;
  buttonUrl?: string;
  subContent?: string;
};

export const DefaultProps: EmailTemplateProps = {
  title: 'Welcome to the team',
  content:
    'You have been invited to join the team. Click the button below to get started.',
  buttonContent: 'Get Started',
  buttonUrl: 'https://app.affine.pro',
  subContent:
    'If you did not request this invitation, please ignore this email.',
};

export const BasicTextStyle: CSSProperties = {
  fontSize: '12px',
  fontWeight: '400',
  lineHeight: '20px',
  fontFamily: 'Inter, Arial, Helvetica, sans-serif',
  margin: '24px 0 0',
};
