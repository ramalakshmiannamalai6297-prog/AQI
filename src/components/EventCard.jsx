function EventCard() {
  return (
    <div
      style={{
        backgroundColor: "#fef2f2",
        borderRadius: "15px",
        boxShadow: "0px 2px 10px lightgray",
        margin: "20px",
        padding: "20px",
      }}
    >
      <h2>⚠️ Event Detection</h2>

      <p>AQI increased by 40 points in the last hour.</p>
    </div>
  );
}

export default EventCard;