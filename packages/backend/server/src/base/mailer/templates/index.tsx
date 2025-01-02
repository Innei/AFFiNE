import { render } from '@react-email/render';

import SignUp from './sign-up';

export const renderSignUpEmail = (props: { url: string }): Promise<string> => {
  return render(<SignUp url={props.url} />);
};
