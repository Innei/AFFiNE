export const WorkspaceAvatar = (props: { workspaceName: string }) => {
  return (
    <>
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
        {props.workspaceName || 'Unknown Workspace'}
      </span>
    </>
  );
};
