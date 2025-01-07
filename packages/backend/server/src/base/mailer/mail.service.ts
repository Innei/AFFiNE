import { Inject, Injectable, Optional } from '@nestjs/common';

import {
  renderChangeEmailMail,
  renderChangeEmailNotificationMail,
  renderChangePasswordMail,
  renderMemberAcceptedMail,
  renderMemberInviteMail,
  renderMemberLeaveMail,
  renderSetPasswordMail,
  renderSignInMail,
  renderSignUpMail,
  renderTeamReviewApproveMail,
  renderTeamReviewDeclineMail,
  renderTeamReviewRequestMail,
  renderTeamRoleChangedMail,
  renderTeamWorkspaceUpgradedMail,
  renderVerifyChangeEmailMail,
  renderVerifyEmailMail,
} from '../../mail-templates';
import { Config } from '../config';
import { MailerServiceIsNotConfigured } from '../error';
import { URLHelper } from '../helpers';
import { metrics } from '../metrics';
import type { MailerService, Options } from './mailer';
import { MAILER_SERVICE } from './mailer';
import { emailTemplate } from './template';

type Workspace = {
  id: string;
  name: string;
  avatar: string;
};

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

  async sendSignUpMail(to: string, url: string) {
    const { html, subject } = await renderSignUpMail({ url });

    return this.sendMail({
      to,
      subject,
      html,
    });
  }

  async sendSignInMail(to: string, url: string) {
    const { html, subject } = await renderSignInMail({ url });

    return this.sendMail({
      to,
      subject,
      html,
    });
  }

  async sendChangePasswordMail(to: string, url: string) {
    const { html, subject } = await renderChangePasswordMail({ url });

    return this.sendMail({
      to,
      subject,
      html,
    });
  }

  async sendSetPasswordMail(to: string, url: string) {
    const { html, subject } = await renderSetPasswordMail({ url });

    return this.sendMail({
      to,
      subject,
      html,
    });
  }

  async sendChangeEmailMail(to: string, url: string) {
    const { html, subject } = await renderChangeEmailMail({ url });

    return this.sendMail({
      to,
      subject,
      html,
    });
  }

  async sendVerifyChangeEmail(to: string, url: string) {
    const { html, subject } = await renderVerifyChangeEmailMail({ url });

    return this.sendMail({
      to,
      subject,
      html,
    });
  }

  async sendVerifyEmail(to: string, url: string) {
    const { html, subject } = await renderVerifyEmailMail({ url });

    return this.sendMail({
      to,
      subject,
      html,
    });
  }

  async sendNotificationChangeEmail(to: string) {
    const { html, subject } = await renderChangeEmailNotificationMail({ to });

    return this.sendMail({
      to,
      subject,
      html,
    });
  }

  // =================== Workspace Mails ===================

  private extractWorkspaceInfo(ws: Workspace) {
    const {
      id: workspaceId,
      name: workspaceName,
      avatar: workspaceAvatar,
    } = ws;
    return {
      workspaceId,
      workspaceName,
      attachments: [
        {
          cid: 'workspaceAvatar',
          filename: 'image.png',
          content: workspaceAvatar,
          encoding: 'base64',
        },
      ],
    };
  }

  async sendMemberInviteMail(
    to: string,
    inviteId: string,
    invitationInfo: {
      workspace: Workspace;
      user: { avatar: string; name: string };
    }
  ) {
    const { name: userName, avatar: userAvatar } = invitationInfo.user;
    const { workspaceName, attachments } = this.extractWorkspaceInfo(
      invitationInfo.workspace
    );
    const { html, subject } = await renderMemberInviteMail({
      userName,
      userAvatar,
      workspaceName,
      url: this.url.link(`/invite/${inviteId}`),
    });
    return this.sendMail({ to, subject, html, attachments });
  }

  async sendMemberAcceptedEmail(
    to: string,
    props: { inviteeName: string; workspace: Workspace }
  ) {
    const { workspaceName, attachments } = this.extractWorkspaceInfo(
      props.workspace
    );
    const { html, subject } = await renderMemberAcceptedMail({
      inviteeName: props.inviteeName,
      workspaceName,
    });
    return this.sendMail({ to, subject, html, attachments });
  }

  async sendMemberLeaveEmail(
    to: string,
    props: { inviteeName: string; workspace: Workspace }
  ) {
    const { workspaceName, attachments } = this.extractWorkspaceInfo(
      props.workspace
    );
    const { html, subject } = await renderMemberLeaveMail({
      inviteeName: props.inviteeName,
      workspaceName,
    });
    return this.sendMail({ to, subject, html, attachments });
  }

  // =================== Team Workspace Mails ===================
  async sendTeamWorkspaceUpgradedEmail(
    to: string,
    ws: Workspace & { isOwner: boolean }
  ) {
    const { workspaceId, workspaceName, attachments } =
      this.extractWorkspaceInfo(ws);
    const { html, subject } = await renderTeamWorkspaceUpgradedMail({
      url: this.url.link(`/workspace/${workspaceId}`),
      workspaceName,
      isOwner: ws.isOwner,
    });
    return this.sendMail({ to, subject, html, attachments });
  }

  async sendReviewRequestEmail(to: string, invitee: string, ws: Workspace) {
    const { workspaceId, workspaceName, attachments } =
      this.extractWorkspaceInfo(ws);
    const { html, subject } = await renderTeamReviewRequestMail({
      url: this.url.link(`/workspace/${workspaceId}`),
      invitee,
      workspaceName,
    });
    return this.sendMail({ to, subject, html, attachments });
  }

  async sendReviewApproveEmail(to: string, ws: Workspace) {
    const { workspaceId, workspaceName, attachments } =
      this.extractWorkspaceInfo(ws);
    const { html, subject } = await renderTeamReviewApproveMail({
      url: this.url.link(`/workspace/${workspaceId}`),
      workspaceName,
    });
    return this.sendMail({ to, subject, html, attachments });
  }

  async sendReviewDeclinedEmail(to: string, ws: Workspace) {
    const { workspaceName, attachments } = this.extractWorkspaceInfo(ws);
    const { html, subject } = await renderTeamReviewDeclineMail({
      workspaceName,
    });
    return this.sendMail({ to, subject, html, attachments });
  }

  async sendRoleChangedEmail(
    to: string,
    ws: Workspace & { role: 'owner' | 'admin' | 'member' | 'readonly' }
  ) {
    const { workspaceName, attachments } = this.extractWorkspaceInfo(ws);
    const { html, subject } = await renderTeamRoleChangedMail({
      workspaceName,
      role: ws.role,
    });
    return this.sendMail({ to, subject, html, attachments });
  }

  async sendOwnershipTransferredEmail(to: string, ws: Workspace) {
    const { name: workspaceName } = ws;
    const title = `Your ownership of ${workspaceName} has been transferred`;

    const html = emailTemplate({
      title: 'Ownership transferred',
      content: `You have transferred ownership of ${workspaceName}. You are now a admin in this workspace.`,
    });
    return this.sendMail({ to, subject: title, html });
  }

  async sendMemberRemovedEmail(to: string, ws: Workspace) {
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
    ws: Omit<Workspace, 'avatar'> & {
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
