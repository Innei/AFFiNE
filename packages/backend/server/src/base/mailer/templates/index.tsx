import { render } from '@react-email/render';

import Invite, { type InviteProps } from './invite';
import SignIn, { type SignInProps } from './sign-in';
import SignUp, { type SignUpProps } from './sign-up';

export const renderInviteEmail = (props: InviteProps): Promise<string> => {
  return render(<Invite {...props} />);
};

export const renderSignInEmail = (props: SignInProps): Promise<string> => {
  return render(<SignIn {...props} />);
};

export const renderSignUpEmail = (props: SignUpProps): Promise<string> => {
  return render(<SignUp {...props} />);
};
