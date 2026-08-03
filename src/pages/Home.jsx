import SearchBar from "../components/SearchBar";

function Home() {
  return (
    <div
      style={{
        textAlign: "center",
        marginTop: "40px",
        padding: "20px",
      }}
    >
      <h1
        style={{
          fontSize: "50px",
          marginBottom: "20px",
        }}
      >
        Hello, Welcome to AirLens AI 🚀
      </h1>

      <button
        style={{
          backgroundColor: "#2563eb",
          color: "white",
          border: "none",
          padding: "12px 20px",
          borderRadius: "10px",
          fontSize: "16px",
          cursor: "pointer",
          marginBottom: "25px",
        }}
      >
        Explore Dashboard
      </button>

      <SearchBar />
    </div>
  );
}

export default Home;