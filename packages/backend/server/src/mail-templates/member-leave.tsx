import { EmailTemplate } from './components';

export type MemberLeaveProps = {
  inviteeName: string;
  workspaceName: string;
};

export default function MemberLeave(props: MemberLeaveProps) {
  const { inviteeName, workspaceName } = props;
  return (
    <EmailTemplate
      title={`${inviteeName} left ${workspaceName}`}
      content={`${inviteeName} has left your workspace`}
    />
  );
}
