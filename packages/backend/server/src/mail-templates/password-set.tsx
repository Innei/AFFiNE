import { EmailTemplate } from './components';

export type SetPasswordProps = {
  url: string;
};

export default function SetPassword(props: SetPasswordProps) {
  return (
    <EmailTemplate
      title="Set your AFFiNE password"
      content="Click the button below to set your password. The magic link will expire in 30 minutes."
      buttonContent="Set your password"
      buttonUrl={props.url || 'https://app.affine.pro'}
    />
  );
}
