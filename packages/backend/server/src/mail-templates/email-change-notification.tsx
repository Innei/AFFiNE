import { EmailTemplate } from './components';

export type ChangeEmailNotificationProps = {
  to: string;
};

export default function ChangeEmailNotification(
  props: ChangeEmailNotificationProps
) {
  return (
    <EmailTemplate
      title="Verify your current email for AFFiNE"
      content={`As per your request, we have changed your email. Please make sure you're using ${props.to} when you log in the next time.`}
    />
  );
}
