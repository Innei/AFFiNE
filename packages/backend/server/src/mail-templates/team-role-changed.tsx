import { Text } from '@react-email/components';

import { EmailTemplate, WorkspaceAvatar } from './components';

export type TeamRoleChangedProps = {
  workspaceName: string;
  role: 'owner' | 'admin' | 'member' | 'readonly';
};

export default function TeamRoleChanged(props: TeamRoleChangedProps) {
  const { workspaceName, role } = props;
  switch (role) {
    case 'owner':
      return (
        <EmailTemplate
          title="Welcome, new workspace owner!"
          content={
            <Text>
              You have been assigned as the owner of
              <WorkspaceAvatar workspaceName={workspaceName} />. As a workspace
              owner, you have full control over this team workspace.
            </Text>
          }
        />
      );
    case 'admin':
      return (
        <EmailTemplate
          title="You've been promoted to admin."
          content={
            <Text>
              You have been promoted to admin of
              <WorkspaceAvatar workspaceName={workspaceName} />. As an admin,
              you can help the workspace owner manage members in this workspace.
            </Text>
          }
        />
      );
    default:
      return (
        <EmailTemplate
          title="Role update in workspace"
          content={
            <Text>
              Your role in <WorkspaceAvatar workspaceName={workspaceName} /> has
              been changed to {role}. You can continue to collaborate in this
              workspace.
            </Text>
          }
        />
      );
  }
}
