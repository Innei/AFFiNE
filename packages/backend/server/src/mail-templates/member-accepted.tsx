import { Text } from '@react-email/components';

import { EmailTemplate, WorkspaceAvatar } from './components';

export type MemberAcceptedProps = {
  inviteeName: string;
  workspaceName: string;
};

export default function MemberAccepted(props: MemberAcceptedProps) {
  const { inviteeName, workspaceName } = props;
  return (
    <EmailTemplate
      title={`${inviteeName} accepted your invitation`}
      content={
        <Text>
          {inviteeName} has joined
          <WorkspaceAvatar workspaceName={workspaceName} />
        </Text>
      }
    />
  );
}
