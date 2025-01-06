import {
  Body,
  Container,
  Head,
  Html,
  Img,
  Link,
  Section,
  Text,
} from '@react-email/components';

import { ActionButton } from './action-button';
import { BasicTextStyle, type EmailTemplateProps } from './common';
import { Footer } from './footer';
import { SubContent } from './sub-content';

export const EmailTemplate = (props: EmailTemplateProps) => {
  const { title, content } = props;

  const mainContent =
    typeof content === 'string' ? (
      <Text
        style={{
          ...BasicTextStyle,
          fontSize: '15px',
          lineHeight: '24px',
          color: '#444',
        }}
      >
        {content}
      </Text>
    ) : (
      content
    );

  return (
    <Html>
      <Head />
      <Body style={{ backgroundColor: '#f6f7fb', overflow: 'hidden' }}>
        <Container
          style={{
            backgroundColor: '#fff',
            maxWidth: '450px',
            margin: '32px auto 0',
            borderRadius: '16px 16px 0 0',
            boxShadow: '0px 0px 20px 0px rgba(66, 65, 73, 0.04)',
            padding: '24px',
          }}
        >
          <Section>
            <Link href="https://affine.pro">
              <Img
                src="https://cdn.affine.pro/mail/2023-8-9/affine-logo.png"
                alt="AFFiNE logo"
                height="32px"
              />
            </Link>
          </Section>
          <Section>
            <Text
              style={{
                ...BasicTextStyle,
                fontSize: '20px',
                fontWeight: '600',
                lineHeight: '28px',
                color: '#444',
              }}
            >
              {title}
            </Text>
          </Section>
          <Section>{mainContent}</Section>
          <ActionButton {...props} />
          <SubContent {...props} />
        </Container>
        <Footer />
      </Body>
    </Html>
  );
};
