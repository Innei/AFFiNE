import { Text } from '@react-email/components';

import { EmailTemplate, WorkspaceAvatar } from './components';

export type TeamReviewApproveProps = {
  url: string;
  workspaceName: string;
};

export default function TeamReviewApprove(props: TeamReviewApproveProps) {
  const { workspaceName, url } = props;
  return (
    <EmailTemplate
      title="Welcome to the workspace!"
      content={
        <Text>
          Your request to join <WorkspaceAvatar workspaceName={workspaceName} />
          has been accepted. You can now access the team workspace and
          collaborate with other members.
        </Text>
      }
      buttonContent="Open Workspace"
      buttonUrl={url || 'https://app.affine.pro'}
    />
  );
}
