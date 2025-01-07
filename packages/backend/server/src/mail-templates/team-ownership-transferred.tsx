import { Text } from '@react-email/components';

import { EmailTemplate, WorkspaceAvatar } from './components';

export type TeamOwnershipTransferredProps = {
  workspaceName: string;
};

export default function TeamOwnershipTransferred(
  props: TeamOwnershipTransferredProps
) {
  const { workspaceName } = props;
  return (
    <EmailTemplate
      title="Ownership transferred"
      content={
        <Text>
          You have transferred ownership of
          <WorkspaceAvatar workspaceName={workspaceName} />. You are now a admin
          in this workspace.
        </Text>
      }
    />
  );
}
