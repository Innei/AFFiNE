import { Text } from '@react-email/components';

import { EmailTemplate, WorkspaceAvatar } from './components';

export type TeamReviewRequestProps = {
  url: string;
  invitee: string;
  workspaceName: string;
};

export default function TeamReviewRequest(props: TeamReviewRequestProps) {
  const { invitee, workspaceName, url } = props;
  return (
    <EmailTemplate
      title="Request to join your workspace"
      content={
        <Text>
          {invitee} has requested to join
          <WorkspaceAvatar workspaceName={workspaceName} />. As a workspace
          owner/admin, you can approve or decline this request.
        </Text>
      }
      buttonContent="Review request"
      buttonUrl={url || 'https://app.affine.pro'}
    />
  );
}
