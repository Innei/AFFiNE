import { Button, Section } from '@react-email/components';

import { BasicTextStyle, type EmailTemplateProps } from './common';

export const ActionButton = (props: EmailTemplateProps) => {
  const { buttonContent, buttonUrl } = props;
  if (buttonContent && buttonUrl) {
    return (
      <Section style={{ paddingTop: '16px' }}>
        <Button
          href={buttonUrl}
          style={{
            ...BasicTextStyle,
            backgroundColor: '#1E96EB',
            color: '#fff',
            textDecoration: 'none',
            fontSize: '15px',
            fontWeight: '600',
            padding: '8px 18px',
            borderRadius: '8px',
            border: '1px solid rgba(0,0,0,.1)',
          }}
        >
          {buttonContent}
        </Button>
      </Section>
    );
  }
  return null;
};
