import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip
} from "recharts";

const data = [
  { time: "9 AM", aqi: 80 },
  { time: "10 AM", aqi: 95 },
  { time: "11 AM", aqi: 120 },
  { time: "12 PM", aqi: 150 },
  { time: "1 PM", aqi: 135 }
];

function AQIChart() {
  return (
    <div style={{ marginTop: "30px", textAlign: "center" }}>
      <h2>AQI Trend</h2>

      <LineChart width={600} height={300} data={data}>
        <CartesianGrid strokeDasharray="3 3" />

        <XAxis dataKey="time" />

        <YAxis />

        <Tooltip />

        <Line type="monotone" dataKey="aqi" stroke="#2563eb" />
      </LineChart>
    </div>
  );
}

export default AQIChart;