import NotificationsList from "../../components/notifications/NotificationsList";

export default function NotificationsPage() {
  return (
    <div style={{ maxWidth: "800px", margin: "0 auto" }}>
      <h1>Notifications</h1>
      <NotificationsList />
    </div>
  );
}