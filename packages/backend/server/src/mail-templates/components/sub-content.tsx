import { Section, Text } from '@react-email/components';

import { BasicTextStyle, type EmailTemplateProps } from './common';

export const SubContent = (props: EmailTemplateProps) => {
  const { subContent } = props;
  if (subContent) {
    return (
      <Section>
        <Text
          style={{
            ...BasicTextStyle,
            color: '#444',
          }}
        >
          {subContent}
        </Text>
      </Section>
    );
  }
  return null;
};
