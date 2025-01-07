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
  renderTeamExpireRemindMail,
  renderTeamMemberRemovedMail,
  renderTeamOwnershipTransferredMail,
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
    const { workspaceName, attachments } = this.extractWorkspaceInfo(ws);
    const { html, subject } = await renderTeamOwnershipTransferredMail({
      workspaceName,
    });
    return this.sendMail({ to, subject, html, attachments });
  }

  async sendMemberRemovedEmail(to: string, ws: Workspace) {
    const { workspaceName, attachments } = this.extractWorkspaceInfo(ws);
    const { html, subject } = await renderTeamMemberRemovedMail({
      workspaceName,
    });
    return this.sendMail({ to, subject, html, attachments });
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
    const { html, subject } = await renderTeamExpireRemindMail({
      url: this.url.link(`/workspace/${workspaceId}/billing`),
      workspaceName,
      expirationDate,
      deletionDate,
    });
    return this.sendMail({ to, subject, html });
  }
}
