function RecommendationCard() {
  return (
    <div
      style={{
        backgroundColor: "#f0fdf4",
        borderRadius: "15px",
        boxShadow: "0px 2px 10px lightgray",
        margin: "20px",
        padding: "20px",
      }}
    >
      <h2>💡 Recommendations</h2>

      <ul>
        <li>Wear a mask</li>
        <li>Avoid outdoor exercise</li>
        <li>Close windows</li>
      </ul>
    </div>
  );
}

export default RecommendationCard;