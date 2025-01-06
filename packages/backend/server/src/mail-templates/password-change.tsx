import { EmailTemplate } from './components';

export type ChangePasswordProps = {
  url: string;
};

export default function ChangePassword(props: ChangePasswordProps) {
  return (
    <EmailTemplate
      title="Modify your AFFiNE password"
      content="Click the button below to reset your password. The magic link will expire in 30 minutes."
      buttonContent="Set new password"
      buttonUrl={props.url || 'https://app.affine.pro'}
    />
  );
}
