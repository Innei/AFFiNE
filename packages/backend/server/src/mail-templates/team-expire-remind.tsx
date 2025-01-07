import { Text } from '@react-email/components';
import type { JSX } from 'react';

import { EmailTemplate, WorkspaceAvatar } from './components';

export type TeamExpireRemindProps = {
  url: string;
  workspaceName: string;
  expirationDate: Date;
  deletionDate?: Date;
};

type ExpireContent = {
  subject: string;
  title: string;
  content: JSX.Element;
  button?: { buttonContent: string; buttonUrl: string };
};

const ExpireContent = {
  deleted: (props: Required<TeamExpireRemindProps>): ExpireContent => {
    const { workspaceName } = props;
    return {
      subject: `Data deletion completed for ${workspaceName}`,
      title: 'Workspace data deleted',
      content: (
        <Text>
          All data in <WorkspaceAvatar workspaceName={workspaceName} /> has been
          permanently deleted as the workspace remained expired for 180 days.
          This action cannot be undone. Thank you for your support of AFFiNE. We
          hope to see you again in the future.
        </Text>
      ),
    };
  },
  deleteIn24Hours: (props: Required<TeamExpireRemindProps>): ExpireContent => {
    const { workspaceName, deletionDate, url: buttonUrl } = props;
    return {
      subject: `[Action Required] Final warning: Your ${workspaceName} data will be deleted in 24 hours`,
      title: 'Urgent: Last chance to prevent data loss',
      content: (
        <Text>
          Your <WorkspaceAvatar workspaceName={workspaceName} /> team workspace
          data will be permanently deleted in 24 hours on
          {deletionDate.toLocaleString()}. To prevent data loss, please take
          immediate action:
          <li>Renew your subscription to restore team features</li>
          <li>
            Export your workspace data from Workspace Settings &gt; Export
            Workspace
          </li>
        </Text>
      ),
      button: { buttonContent: 'Go to Billing', buttonUrl },
    };
  },
  deleteSoon: (props: Required<TeamExpireRemindProps>): ExpireContent => {
    const {
      workspaceName,
      expirationDate,
      deletionDate,
      url: buttonUrl,
    } = props;
    return {
      subject: `Data deletion completed for ${workspaceName}`,
      title: 'Take action to prevent data loss',
      content: (
        <Text>
          Your <WorkspaceAvatar workspaceName={workspaceName} /> team workspace
          expired on {expirationDate.toLocaleString()}. All workspace data will
          be permanently deleted on
          {deletionDate.toLocaleString()} (180 days after expiration). To
          prevent data loss, please either:
          <li>Renew your subscription to restore team features</li>
          <li>
            Export your workspace data from Workspace Settings &gt; Export
            Workspace
          </li>
        </Text>
      ),
      button: { buttonContent: 'Go to Billing', buttonUrl },
    };
  },
  expired: (props: TeamExpireRemindProps): ExpireContent => {
    const { workspaceName, expirationDate, url: buttonUrl } = props;
    return {
      subject: `Your ${workspaceName} team workspace has expired`,
      title: 'Team workspace expired',
      content: (
        <Text>
          Your <WorkspaceAvatar workspaceName={workspaceName} /> team workspace
          expired on {expirationDate.toLocaleString()}. Your workspace
          can&apos;t sync or collaborate with team members. Please renew your
          subscription to restore all team features.
        </Text>
      ),
      button: { buttonContent: 'Go to Billing', buttonUrl },
    };
  },
  expireSoon: (props: TeamExpireRemindProps): ExpireContent => {
    const { workspaceName, expirationDate, url: buttonUrl } = props;
    return {
      subject: `[Action Required] Your ${workspaceName} team workspace is expiring soon`,
      title: 'Team workspace expiring soon',
      content: (
        <Text>
          Your <WorkspaceAvatar workspaceName={workspaceName} /> team workspace
          will expire on {expirationDate.toLocaleString()}. After expiration,
          you won&apos;t be able to sync or collaborate with team members.
          Please renew your subscription to continue using all team features.
        </Text>
      ),
      button: { buttonContent: 'Go to Billing', buttonUrl },
    };
  },
};

export const getTeamWorkspaceExpireContent = (props: TeamExpireRemindProps) => {
  const { expirationDate, deletionDate } = props;
  if (deletionDate) {
    const newProps = props as Required<TeamExpireRemindProps>;
    if (deletionDate < new Date()) {
      if (deletionDate.getTime() - Date.now() < 24 * 60 * 60 * 1000) {
        return ExpireContent.deleteIn24Hours(newProps);
      } else {
        return ExpireContent.deleteSoon(newProps);
      }
    } else {
      return ExpireContent.deleted(newProps);
    }
  } else if (expirationDate < new Date()) {
    return ExpireContent.expired(props);
  } else {
    return ExpireContent.expireSoon(props);
  }
};

export default function TeamExpireRemind(props: TeamExpireRemindProps) {
  const { title, content } = getTeamWorkspaceExpireContent(props);
  return <EmailTemplate title={title} content={content} />;
}
