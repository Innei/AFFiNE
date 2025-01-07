import { Text } from '@react-email/components';

import { EmailTemplate, WorkspaceAvatar } from './components';

export type MemberAcceptedProps = {
  inviteeName: string;
  workspaceName: string;
};

export default function MemberAccepted(props: MemberAcceptedProps) {
  const { inviteeName = 'Unknown User', workspaceName } = props;
  return (
    <EmailTemplate
      title={`${inviteeName} accepted your invitation`}
      content={
        <Text>
          <span style={{ fontWeight: 500, marginRight: '4px' }}>
            {inviteeName}
          </span>
          has joined
          <WorkspaceAvatar workspaceName={workspaceName} />
        </Text>
      }
    />
  );
}
