function PredictionCard() {
  return (
    <div
  style={{
    backgroundColor: "#f1f5f9",
    borderRadius: "15px",
    boxShadow: "0px 2px 10px lightgray",
    margin: "20px",
    padding: "20px",
  }}
    >
      <h2>🤖 AQI Prediction</h2>

      <p>Next hour AQI: 170</p>

      <p>After 3 hours: 190</p>
    </div>
  );
}

export default PredictionCard;