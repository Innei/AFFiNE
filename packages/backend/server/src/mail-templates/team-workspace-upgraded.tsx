import { Text } from '@react-email/components';

import { EmailTemplate, WorkspaceAvatar } from './components';

export type TeamWorkspaceUpgradedProps = {
  workspaceName: string;
  isOwner: boolean;
  url?: string;
};

const MailContent = (props: TeamWorkspaceUpgradedProps) => {
  const { isOwner, workspaceName } = props;
  return (
    <Text>
      {isOwner ? (
        <>
          <WorkspaceAvatar workspaceName={workspaceName} />
          has been upgraded to team workspace with the following benefits:
        </>
      ) : (
        <>
          Great news! <WorkspaceAvatar workspaceName={workspaceName} /> has been
          upgraded to team workspace by the workspace owner.
          <br />
          You now have access to the following enhanced features:
        </>
      )}
      <br /> ✓ 100 GB initial storage + 20 GB per seat
      <br /> ✓ 500 MB of maximum file size
      <br /> ✓ Unlimited team members (10+ seats)
      <br /> ✓ Multiple admin roles
      <br /> ✓ Priority customer support
    </Text>
  );
};

export default function TeamWorkspaceUpgraded(
  props: TeamWorkspaceUpgradedProps
) {
  return (
    <EmailTemplate
      title="Welcome to the team workspace!"
      content={<MailContent {...props} />}
      buttonContent="Open Workspace"
      buttonUrl={props.url || 'https://app.affine.pro'}
    />
  );
}
