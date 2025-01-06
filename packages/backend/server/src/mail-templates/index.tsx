import { render } from '@react-email/render';
import type SMTPTransport from 'nodemailer/lib/smtp-transport';

import ChangeEmail, { type ChangeEmailProps } from './email-change';
import ChangeEmailNotification, {
  type ChangeEmailNotificationProps,
} from './email-change-notification';
import VerifyChangeEmail, {
  type VerifyChangeEmailProps,
} from './email-change-verify';
import VerifyEmail, { type VerifyEmailProps } from './email-verify';
import MemberAccepted, { type MemberAcceptedProps } from './member-accepted';
import MemberInvite, { type MemberInviteProps } from './member-invite';
import MemberLeave, { type MemberLeaveProps } from './member-leave';
import ChangePassword, { type ChangePasswordProps } from './password-change';
import SetPassword, { type SetPasswordProps } from './password-set';
import SignIn, { type SignInProps } from './sign-in';
import SignUp, { type SignUpProps } from './sign-up';

type EmailContent = Pick<SMTPTransport.Options, 'subject' | 'html'>;

// ================ Auth ================

export const renderSignInMail = async (
  props: SignInProps
): Promise<EmailContent> => {
  return {
    subject: 'Sign in to AFFiNE',
    html: await render(<SignIn {...props} />),
  };
};

export const renderSignUpMail = async (
  props: SignUpProps
): Promise<EmailContent> => {
  return {
    subject: 'Your AFFiNE account is waiting for you!',
    html: await render(<SignUp {...props} />),
  };
};

// ================ User ================

export const renderSetPasswordMail = async (
  props: SetPasswordProps
): Promise<EmailContent> => {
  return {
    subject: 'Set your AFFiNE password',
    html: await render(<SetPassword {...props} />),
  };
};

export const renderChangePasswordMail = async (
  props: ChangePasswordProps
): Promise<EmailContent> => {
  return {
    subject: 'Modify your AFFiNE password',
    html: await render(<ChangePassword {...props} />),
  };
};

export const renderVerifyEmailMail = async (
  props: VerifyEmailProps
): Promise<EmailContent> => {
  return {
    subject: 'Change your email address',
    html: await render(<VerifyEmail {...props} />),
  };
};

export const renderChangeEmailMail = async (
  props: ChangeEmailProps
): Promise<EmailContent> => {
  return {
    subject: 'Change your email address',
    html: await render(<ChangeEmail {...props} />),
  };
};

export const renderVerifyChangeEmailMail = async (
  props: VerifyChangeEmailProps
): Promise<EmailContent> => {
  return {
    subject: 'Change your email address',
    html: await render(<VerifyChangeEmail {...props} />),
  };
};

export const renderChangeEmailNotificationMail = async (
  props: ChangeEmailNotificationProps
): Promise<EmailContent> => {
  return {
    subject: 'Change your email address',
    html: await render(<ChangeEmailNotification {...props} />),
  };
};

// ================ Workspace ================

export const renderMemberInviteMail = async (
  props: MemberInviteProps
): Promise<EmailContent> => {
  return {
    subject: `${props.userName} invited you to join ${props.workspaceName}`,
    html: await render(<MemberInvite {...props} />),
  };
};

export const renderMemberAcceptedMail = async (
  props: MemberAcceptedProps
): Promise<EmailContent> => {
  const { inviteeName } = props;
  return {
    subject: `${inviteeName} accepted your invitation`,
    html: await render(<MemberAccepted {...props} />),
  };
};

export const renderMemberLeaveMail = async (
  props: MemberLeaveProps
): Promise<EmailContent> => {
  const { inviteeName, workspaceName } = props;
  return {
    subject: `${inviteeName} left ${workspaceName}`,
    html: await render(<MemberLeave {...props} />),
  };
};
