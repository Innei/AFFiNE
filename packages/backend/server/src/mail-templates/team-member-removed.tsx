import { Text } from '@react-email/components';

import { EmailTemplate, WorkspaceAvatar } from './components';

export type TeamMemberRemovedProps = {
  workspaceName: string;
};

export default function TeamMemberRemoved(props: TeamMemberRemovedProps) {
  const { workspaceName } = props;
  return (
    <EmailTemplate
      title={`You have been removed from ${workspaceName}`}
      content={
        <Text>
          You have been removed from
          <WorkspaceAvatar workspaceName={workspaceName} />. You no longer have
          access to this workspace.
        </Text>
      }
    />
  );
}
