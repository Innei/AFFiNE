import { EmailTemplate } from './components';

export type ChangeEmailProps = {
  url: string;
};

export default function ChangeEmail(props: ChangeEmailProps) {
  return (
    <EmailTemplate
      title="Verify your current email for AFFiNE"
      content="You recently requested to change the email address associated with your AFFiNE account. To complete this process, please click on the verification link below. This magic link will expire in 30 minutes."
      buttonContent="Verify and set up a new email address"
      buttonUrl={props.url || 'https://app.affine.pro'}
    />
  );
}
