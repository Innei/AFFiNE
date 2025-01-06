import { Img, Text } from '@react-email/components';

import { EmailTemplate } from './components';

export type InviteProps = {
  userName: string;
  userAvatar?: string;
  workspaceName: string;
  url: string;
};

const InviteContent = (props: Omit<InviteProps, 'url'>) => {
  const { userAvatar, workspaceName } = props;
  let avatar = null;
  if (userAvatar) {
    avatar = (
      <Img
        src={userAvatar}
        width="24px"
        height="24px"
        style={{
          width: '24px',
          height: '24px',
          borderRadius: '12px',
          objectFit: 'cover',
          verticalAlign: 'middle',
        }}
      />
    );
  }

  return (
    <>
      <Text>
        {avatar}
        <span style={{ fontWeight: 500, marginRight: '4px' }}>
          {workspaceName}
        </span>
        <span>invited you to join</span>
        <img
          src="cid:workspaceAvatar"
          alt=""
          width="24px"
          height="24px"
          style={{
            width: '24px',
            height: '24px',
            marginLeft: '4px',
            borderRadius: '12px',
            objectFit: 'cover',
            verticalAlign: 'middle',
          }}
        />
        <span style={{ fontWeight: 500, marginRight: '4px' }}>
          {workspaceName}
        </span>
      </Text>
      <Text style={{ marginTop: '8px', marginBottom: '0' }}>
        Click button to join this workspace
      </Text>
    </>
  );
};

export default function Invite(props: InviteProps) {
  return (
    <EmailTemplate
      title="You are invited!"
      content={
        <InviteContent
          {...props}
          userName={props.userName || 'Unknown User'}
          workspaceName={props.workspaceName || 'Unknown Workspace'}
        />
      }
      buttonContent="Accept & Join"
      buttonUrl={props.url || 'https://app.affine.pro'}
    />
  );
}
