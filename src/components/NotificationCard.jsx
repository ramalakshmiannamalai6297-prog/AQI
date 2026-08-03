function NotificationCard() {
  return (
<div
  style={{
    backgroundColor: "#fefce8",
    borderRadius: "15px",
    boxShadow: "0px 2px 10px lightgray",
    margin: "20px",
    padding: "20px",
  }}
>
  <h2>🔔 Notifications</h2>

  <p>⚠️ AQI crossed 150.</p>

  <p>🌫️ PM2.5 levels are increasing.</p>
</div>
  );
}

export default NotificationCard;