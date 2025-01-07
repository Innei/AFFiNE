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
import TeamExpireRemind, {
  getTeamWorkspaceExpireContent,
  type TeamExpireRemindProps,
} from './team-expire-remind';
import TeamMemberRemoved, {
  type TeamMemberRemovedProps,
} from './team-member-removed';
import TeamOwnershipTransferred, {
  type TeamOwnershipTransferredProps,
} from './team-ownership-transferred';
import TeamReviewApprove, {
  type TeamReviewApproveProps,
} from './team-review-approve';
import TeamReviewDecline, {
  type TeamReviewDeclineProps,
} from './team-review-decline';
import TeamReviewRequest, {
  type TeamReviewRequestProps,
} from './team-review-request';
import TeamRoleChanged, {
  type TeamRoleChangedProps,
} from './team-role-changed';
import TeamWorkspaceUpgraded, {
  type TeamWorkspaceUpgradedProps,
} from './team-workspace-upgraded';

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

// ================ Team ================

export const renderTeamWorkspaceUpgradedMail = async (
  props: TeamWorkspaceUpgradedProps
): Promise<EmailContent> => {
  const { workspaceName, isOwner } = props;
  return {
    subject: isOwner
      ? 'Your workspace has been upgraded to team workspace! 🎉'
      : `${workspaceName} has been upgraded to team workspace! 🎉`,
    html: await render(<TeamWorkspaceUpgraded {...props} />),
  };
};

export const renderTeamReviewRequestMail = async (
  props: TeamReviewRequestProps
): Promise<EmailContent> => {
  const { workspaceName } = props;
  return {
    subject: `New request to join ${workspaceName}`,
    html: await render(<TeamReviewRequest {...props} />),
  };
};

export const renderTeamReviewApproveMail = async (
  props: TeamReviewApproveProps
): Promise<EmailContent> => {
  const { workspaceName } = props;
  return {
    subject: `Your request to join ${workspaceName} has been approved`,
    html: await render(<TeamReviewApprove {...props} />),
  };
};

export const renderTeamReviewDeclineMail = async (
  props: TeamReviewDeclineProps
): Promise<EmailContent> => {
  const { workspaceName } = props;
  return {
    subject: `Your request to join ${workspaceName} was declined`,
    html: await render(<TeamReviewDecline {...props} />),
  };
};

export const renderTeamRoleChangedMail = async (
  props: TeamRoleChangedProps
): Promise<EmailContent> => {
  const { workspaceName, role } = props;
  return {
    subject: ['owner', 'admin'].includes(role)
      ? `You are now an ${role} of ${workspaceName}`
      : `Your role has been changed in ${workspaceName}`,
    html: await render(<TeamRoleChanged {...props} />),
  };
};

export const renderTeamOwnershipTransferredMail = async (
  props: TeamOwnershipTransferredProps
): Promise<EmailContent> => {
  const { workspaceName } = props;
  return {
    subject: `Your ownership of ${workspaceName} has been transferred`,
    html: await render(<TeamOwnershipTransferred {...props} />),
  };
};

export const renderTeamMemberRemovedMail = async (
  props: TeamMemberRemovedProps
): Promise<EmailContent> => {
  const { workspaceName } = props;
  return {
    subject: `Your ownership of ${workspaceName} has been transferred`,
    html: await render(<TeamMemberRemoved {...props} />),
  };
};

export const renderTeamExpireRemindMail = async (
  props: TeamExpireRemindProps
): Promise<EmailContent> => {
  const { subject, button } = getTeamWorkspaceExpireContent(props);
  return {
    subject,
    html: await render(<TeamExpireRemind {...props} />),
    ...button,
  };
};
