import AQICard from "../components/AQICard";
import PollutantCard from "../components/PollutantCard";
import AQIChart from "../components/AQIChart";
import PredictionCard from "../components/PredictionCard";

function Dashboard() {
  return (
    <div>
      <AQICard />
      <PollutantCard />
      <AQIChart />
      <PredictionCard />
    </div>
  );
}

export default Dashboard;