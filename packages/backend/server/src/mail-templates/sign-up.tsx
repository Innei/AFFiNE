import { EmailTemplate } from './components';

export type SignUpProps = {
  url: string;
};

export default function SignUp(props: SignUpProps) {
  return (
    <EmailTemplate
      title="Create AFFiNE Account"
      content="Click the button below to complete your account creation and sign in. This magic link will expire in 30 minutes."
      buttonContent="Create account and sign in"
      buttonUrl={props.url || 'https://app.affine.pro'}
    />
  );
}
