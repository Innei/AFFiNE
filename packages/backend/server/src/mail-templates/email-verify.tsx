import { EmailTemplate } from './components';

export type VerifyEmailProps = {
  url: string;
};

export default function VerifyEmail(props: VerifyEmailProps) {
  return (
    <EmailTemplate
      title="Verify your email address"
      content="You recently requested to verify the email address associated with your AFFiNE account. To complete this process, please click on the verification link below. This magic link will expire in 30 minutes."
      buttonContent="Verify your email address"
      buttonUrl={props.url || 'https://app.affine.pro'}
    />
  );
}
