import { EmailTemplate } from './components';

export type VerifyChangeEmailProps = {
  url: string;
};

export default function VerifyChangeEmail(props: VerifyChangeEmailProps) {
  return (
    <EmailTemplate
      title="Verify your new email address"
      content="You recently requested to change the email address associated with your AFFiNE account. To complete this process, please click on the verification link below. This magic link will expire in 30 minutes."
      buttonContent="Verify your new email address"
      buttonUrl={props.url || 'https://app.affine.pro'}
    />
  );
}
