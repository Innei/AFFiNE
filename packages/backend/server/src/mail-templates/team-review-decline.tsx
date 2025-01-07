import { Text } from '@react-email/components';

import { EmailTemplate, WorkspaceAvatar } from './components';

export type TeamReviewDeclineProps = {
  workspaceName: string;
};

export default function TeamReviewDecline(props: TeamReviewDeclineProps) {
  const { workspaceName } = props;
  return (
    <EmailTemplate
      title="Request declined"
      content={
        <Text>
          Your request to join <WorkspaceAvatar workspaceName={workspaceName} />
          has been declined by the workspace admin.
        </Text>
      }
    />
  );
}
