import { Text } from '@react-email/components';

import { EmailTemplate, WorkspaceAvatar } from './components';

export type MemberLeaveProps = {
  inviteeName: string;
  workspaceName: string;
};

export default function MemberLeave(props: MemberLeaveProps) {
  const { inviteeName = 'Unknown User', workspaceName } = props;
  return (
    <EmailTemplate
      title={`${inviteeName} left ${workspaceName}`}
      content={
        <Text>
          <span style={{ fontWeight: 500, marginRight: '4px' }}>
            {inviteeName}
          </span>
          has left your workspace
          <WorkspaceAvatar workspaceName={workspaceName} />
        </Text>
      }
    />
  );
}
