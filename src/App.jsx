import SearchBar from "./components/SearchBar";
import Navbar from "./components/Navbar";
import AQICard from "./components/AQICard";
import PollutantCard from "./components/PollutantCard";
import AQIChart from "./components/AQIChart";

import EventCard from "./components/EventCard";
import PredictionCard from "./components/PredictionCard";
import RecommendationCard from "./components/RecommendationCard";
import NotificationCard from "./components/NotificationCard";
import HotspotCard from "./components/HotspotCard";
import AirMap from "./components/AirMap";
import Footer from "./components/Footer";

function App() {
  return (
    <div>
      <Navbar />
      <div style={{ textAlign: "center", marginTop: "40px" }}>
        <h1>Welcome to AirLens AI 🚀</h1>
  
        <button>Explore Dashboard</button>
      </div>
      <SearchBar />
      <AQICard />
      <PollutantCard />
      <AQIChart />
      <EventCard />
      <PredictionCard />
      <RecommendationCard />
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
  <p>📢 Air quality is expected to worsen tomorrow.</p>
</div>
      <NotificationCard />
      <HotspotCard />
      <AirMap />
      <Footer />
    </div>
  );
}
export default App;