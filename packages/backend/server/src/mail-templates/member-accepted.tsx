import { EmailTemplate } from './components';

export type MemberAcceptedProps = {
  inviteeName: string;
  workspaceName: string;
};

export default function MemberAccepted(props: MemberAcceptedProps) {
  const { inviteeName, workspaceName } = props;
  return (
    <EmailTemplate
      title={`${inviteeName} accepted your invitation`}
      content={`${inviteeName} has joined ${workspaceName}`}
    />
  );
}
