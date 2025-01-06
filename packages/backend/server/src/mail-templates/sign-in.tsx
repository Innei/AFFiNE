import { EmailTemplate } from './components';

export type SignInProps = {
  url: string;
};

export default function SignUp(props: SignInProps) {
  return (
    <EmailTemplate
      title="Sign in to AFFiNE"
      content="Click the button below to securely sign in. The magic link will expire in 30 minutes."
      buttonContent="Sign in to AFFiNE"
      buttonUrl={props.url || 'https://app.affine.pro'}
    />
  );
}
