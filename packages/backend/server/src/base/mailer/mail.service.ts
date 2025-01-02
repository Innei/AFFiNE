import { Inject, Injectable, Optional } from '@nestjs/common';

import { Config } from '../config';
import { MailerServiceIsNotConfigured } from '../error';
import { URLHelper } from '../helpers';
import { metrics } from '../metrics';
import type { MailerService, Options } from './mailer';
import { MAILER_SERVICE } from './mailer';
import {
  emailTemplate,
  getRoleChangedTemplate,
  type RoleChangedMailParams,
} from './template';

@Injectable()
export class MailService {
  constructor(
    private readonly config: Config,
    private readonly url: URLHelper,
    @Optional() @Inject(MAILER_SERVICE) private readonly mailer?: MailerService
  ) {}

  async sendMail(options: Options) {
    if (!this.mailer) {
      throw new MailerServiceIsNotConfigured();
    }

    metrics.mail.counter('total').add(1);
    try {
      const result = await this.mailer.sendMail({
        from: this.config.mailer?.from,
        ...options,
      });

      metrics.mail.counter('sent').add(1);

      return result;
    } catch (e) {
      metrics.mail.counter('error').add(1);
      throw e;
    }
  }

  hasConfigured() {
    return !!this.mailer;
  }

  async sendInviteEmail(
    to: string,
    inviteId: string,
    invitationInfo: {
      workspace: {
        id: string;
        name: string;
        avatar: string;
      };
      user: {
        avatar: string;
        name: string;
      };
    }
  ) {
    const buttonUrl = this.url.link(`/invite/${inviteId}`);
    const workspaceAvatar = invitationInfo.workspace.avatar;

    const content = `<p style="margin:0">${
      invitationInfo.user.avatar
        ? `<img
    src="${invitationInfo.user.avatar}"
    alt=""
    width="24px"
    height="24px"
    style="width:24px; height:24px; border-radius: 12px;object-fit: cover;vertical-align: middle"
  />`
        : ''
    }
  <span style="font-weight:500;margin-right: 4px;">${
    invitationInfo.user.name
  }</span>
  <span>invited you to join</span>
  <img
    src="cid:workspaceAvatar"
    alt=""
    width="24px"
    height="24px"
    style="width:24px; height:24px; margin-left:4px;border-radius: 12px;object-fit: cover;vertical-align: middle"
  />
  <span style="font-weight:500;margin-right: 4px;">${
    invitationInfo.workspace.name
  }</span></p><p style="margin-top:8px;margin-bottom:0;">Click button to join this workspace</p>`;

    const html = emailTemplate({
      title: 'You are invited!',
      content,
      buttonContent: 'Accept & Join',
      buttonUrl,
    });

    return this.sendMail({
      to,
      subject: `${invitationInfo.user.name} invited you to join ${invitationInfo.workspace.name}`,
      html,
      attachments: [
        {
          cid: 'workspaceAvatar',
          filename: 'image.png',
          content: workspaceAvatar,
          encoding: 'base64',
        },
      ],
    });
  }

  async sendSignUpMail(url: string, options: Options) {
    const html = emailTemplate({
      title: 'Create AFFiNE Account',
      content:
        'Click the button below to complete your account creation and sign in. This magic link will expire in 30 minutes.',
      buttonContent: ' Create account and sign in',
      buttonUrl: url,
    });

    return this.sendMail({
      html,
      subject: 'Your AFFiNE account is waiting for you!',
      ...options,
    });
  }

  async sendSignInMail(url: string, options: Options) {
    const html = emailTemplate({
      title: 'Sign in to AFFiNE',
      content:
        'Click the button below to securely sign in. The magic link will expire in 30 minutes.',
      buttonContent: 'Sign in to AFFiNE',
      buttonUrl: url,
    });
    return this.sendMail({
      html,
      subject: 'Sign in to AFFiNE',
      ...options,
    });
  }

  async sendChangePasswordEmail(to: string, url: string) {
    const html = emailTemplate({
      title: 'Modify your AFFiNE password',
      content:
        'Click the button below to reset your password. The magic link will expire in 30 minutes.',
      buttonContent: 'Set new password',
      buttonUrl: url,
    });
    return this.sendMail({
      to,
      subject: `Modify your AFFiNE password`,
      html,
    });
  }

  async sendSetPasswordEmail(to: string, url: string) {
    const html = emailTemplate({
      title: 'Set your AFFiNE password',
      content:
        'Click the button below to set your password. The magic link will expire in 30 minutes.',
      buttonContent: 'Set your password',
      buttonUrl: url,
    });
    return this.sendMail({
      to,
      subject: `Set your AFFiNE password`,
      html,
    });
  }

  async sendChangeEmail(to: string, url: string) {
    const html = emailTemplate({
      title: 'Verify your current email for AFFiNE',
      content:
        'You recently requested to change the email address associated with your AFFiNE account. To complete this process, please click on the verification link below. This magic link will expire in 30 minutes.',
      buttonContent: 'Verify and set up a new email address',
      buttonUrl: url,
    });
    return this.sendMail({
      to,
      subject: `Verify your current email for AFFiNE`,
      html,
    });
  }

  async sendVerifyChangeEmail(to: string, url: string) {
    const html = emailTemplate({
      title: 'Verify your new email address',
      content:
        'You recently requested to change the email address associated with your AFFiNE account. To complete this process, please click on the verification link below. This magic link will expire in 30 minutes.',
      buttonContent: 'Verify your new email address',
      buttonUrl: url,
    });
    return this.sendMail({
      to,
      subject: `Verify your new email for AFFiNE`,
      html,
    });
  }

  async sendVerifyEmail(to: string, url: string) {
    const html = emailTemplate({
      title: 'Verify your email address',
      content:
        'You recently requested to verify the email address associated with your AFFiNE account. To complete this process, please click on the verification link below. This magic link will expire in 30 minutes.',
      buttonContent: 'Verify your email address',
      buttonUrl: url,
    });
    return this.sendMail({
      to,
      subject: `Verify your email for AFFiNE`,
      html,
    });
  }

  async sendNotificationChangeEmail(to: string) {
    const html = emailTemplate({
      title: 'Email change successful',
      content: `As per your request, we have changed your email. Please make sure you're using ${to} when you log in the next time. `,
    });
    return this.sendMail({
      to,
      subject: `Your email has been changed`,
      html,
    });
  }

  async sendAcceptedEmail(
    to: string,
    {
      inviteeName,
      workspaceName,
    }: {
      inviteeName: string;
      workspaceName: string;
    }
  ) {
    const title = `${inviteeName} accepted your invitation`;

    const html = emailTemplate({
      title,
      content: `${inviteeName} has joined ${workspaceName}`,
    });
    return this.sendMail({
      to,
      subject: title,
      html,
    });
  }

  async sendLeaveWorkspaceEmail(
    to: string,
    {
      inviteeName,
      workspaceName,
    }: {
      inviteeName: string;
      workspaceName: string;
    }
  ) {
    const title = `${inviteeName} left ${workspaceName}`;

    const html = emailTemplate({
      title,
      content: `${inviteeName} has left your workspace`,
    });
    return this.sendMail({
      to,
      subject: title,
      html,
    });
  }

  // =================== Team Workspace Mails ===================
  async sendTeamWorkspaceUpgradedEmail(
    to: string,
    ws: { id: string; name: string; isOwner: boolean }
  ) {
    const { id: workspaceId, name: workspaceName, isOwner } = ws;

    const baseContent = {
      subject: `${workspaceName} has been upgraded to team workspace! 🎉`,
      title: 'Welcome to the team workspace!',
      content: `Great news! ${workspaceName} has been upgraded to team workspace by the workspace owner. You now have access to the following enhanced features:`,
    };
    if (isOwner) {
      baseContent.subject =
        'Your workspace has been upgraded to team workspace! 🎉';
      baseContent.title = 'Welcome to the team workspace!';
      baseContent.content = `${workspaceName} has been upgraded to team workspace with the following benefits:`;
    }

    const html = emailTemplate({
      title: baseContent.title,
      content: `${baseContent.content}
✓ 100 GB initial storage + 20 GB per seat
✓ 500 MB of maximum file size
✓ Unlimited team members (10+ seats)
✓ Multiple admin roles
✓ Priority customer support`,
      buttonContent: 'Open Workspace',
      buttonUrl: this.url.link(`/workspace/${workspaceId}`),
    });
    return this.sendMail({ to, subject: baseContent.subject, html });
  }

  async sendReviewRequestEmail(
    to: string,
    invitee: string,
    ws: { id: string; name: string }
  ) {
    const { id: workspaceId, name: workspaceName } = ws;
    const title = `New request to join ${workspaceName}`;

    const html = emailTemplate({
      title: 'Request to join your workspace',
      content: `${invitee} has requested to join ${workspaceName}. As a workspace owner/admin, you can approve or decline this request.`,
      buttonContent: 'Review request',
      buttonUrl: this.url.link(`/workspace/${workspaceId}`),
    });
    return this.sendMail({ to, subject: title, html });
  }

  async sendReviewApproveEmail(to: string, ws: { id: string; name: string }) {
    const { id: workspaceId, name: workspaceName } = ws;
    const title = `Your request to join ${workspaceName} has been approved`;

    const html = emailTemplate({
      title: 'Welcome to the workspace!',
      content: `Your request to join ${workspaceName} has been accepted. You can now access the team workspace and collaborate with other members.`,
      buttonContent: 'Open Workspace',
      buttonUrl: this.url.link(`/workspace/${workspaceId}`),
    });
    return this.sendMail({ to, subject: title, html });
  }

  async sendReviewDeclinedEmail(to: string, ws: { name: string }) {
    const { name: workspaceName } = ws;
    const title = `Your request to join ${workspaceName} was declined`;

    const html = emailTemplate({
      title: 'Request declined',
      content: `Your request to join ${workspaceName} has been declined by the workspace admin.`,
    });
    return this.sendMail({ to, subject: title, html });
  }

  async sendRoleChangedEmail(to: string, ws: RoleChangedMailParams) {
    const { subject, title, content } = getRoleChangedTemplate(ws);
    const html = emailTemplate({ title, content });
    console.log({ subject, title, content, to });
    return this.sendMail({ to, subject, html });
  }

  async sendOwnershipTransferredEmail(to: string, ws: { name: string }) {
    const { name: workspaceName } = ws;
    const title = `Your ownership of ${workspaceName} has been transferred`;

    const html = emailTemplate({
      title: 'Ownership transferred',
      content: `You have transferred ownership of ${workspaceName}. You are now a admin in this workspace.`,
    });
    return this.sendMail({ to, subject: title, html });
  }

  async sendMemberRemovedEmail(to: string, ws: { name: string }) {
    const { name: workspaceName } = ws;
    const title = `You have been removed from ${workspaceName}`;

    const html = emailTemplate({
      title: 'Workspace access removed',
      content: `You have been removed from {workspace name}. You no longer have access to this workspace.`,
    });
    return this.sendMail({ to, subject: title, html });
  }

  async sendWorkspaceExpireRemindEmail(
    to: string,
    ws: {
      id: string;
      name: string;
      expirationDate: Date;
      deletionDate?: Date;
    }
  ) {
    const {
      id: workspaceId,
      name: workspaceName,
      expirationDate,
      deletionDate,
    } = ws;
    const baseContent: {
      subject: string;
      title: string;
      content: string;
      button?: { buttonContent: string; buttonUrl: string };
    } = {
      subject: `[Action Required] Your ${workspaceName} team workspace is expiring soon`,
      title: 'Team workspace expiring soon',
      content: `Your ${workspaceName} team workspace will expire on ${expirationDate}. After expiration, you won't be able to sync or collaborate with team members. Please renew your subscription to continue using all team features.`,
      button: {
        buttonContent: 'Go to Billing',
        // TODO(@darkskygit): use real billing path
        buttonUrl: this.url.link(`/workspace/${workspaceId}/billing`),
      },
    };

    if (deletionDate) {
      if (deletionDate < new Date()) {
        // in 24 hours
        if (deletionDate.getTime() - Date.now() < 24 * 60 * 60 * 1000) {
          baseContent.subject = `[Action Required] Final warning: Your ${workspaceName} data will be deleted in 24 hours`;
          baseContent.title = 'Urgent: Last chance to prevent data loss';
          baseContent.content = `Your ${workspaceName} team workspace data will be permanently deleted in 24 hours on ${deletionDate}. To prevent data loss, please take immediate action:
<li>Renew your subscription to restore team features</li>
<li>Export your workspace data from Workspace Settings > Export Workspace</li>`;
        } else {
          baseContent.subject = `[Action Required] Important: Your ${workspaceName} data will be deleted soon`;
          baseContent.title = 'Take action to prevent data loss';
          baseContent.content = `Your ${workspaceName} team workspace expired on ${expirationDate}. All workspace data will be permanently deleted on ${deletionDate} (180 days after expiration). To prevent data loss, please either:
<li>Renew your subscription to restore team features</li>
<li>Export your workspace data from Workspace Settings > Export Workspace</li>`;
        }
      } else {
        baseContent.subject = `Data deletion completed for ${workspaceName}`;
        baseContent.title = 'Workspace data deleted';
        baseContent.content = `All data in ${workspaceName} has been permanently deleted as the workspace remained expired for 180 days. This action cannot be undone.
Thank you for your support of AFFiNE. We hope to see you again in the future.`;
        baseContent.button = undefined;
      }
    } else if (expirationDate < new Date()) {
      baseContent.subject = `Your ${workspaceName} team workspace has expired`;
      baseContent.title = 'Team workspace expired';
      baseContent.content = `Your ${workspaceName} team workspace expired on ${expirationDate}. Your workspace can't sync or collaborate with team members. Please renew your subscription to restore all team features.`;
    }

    const html = emailTemplate({
      title: baseContent.title,
      content: baseContent.content,
      ...baseContent.button,
    });
    return this.sendMail({ to, subject: baseContent.subject, html });
  }
}
