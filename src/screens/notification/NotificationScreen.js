import TabPlaceholder from '../../components/common/TabPlaceholder';

export default function NotificationScreen() {
  return (
    <TabPlaceholder
      icon="notifications-outline"
      subtitle="Your recent notifications will appear here."
      title="Notification"
      showBack={true}
    />
  );
}
