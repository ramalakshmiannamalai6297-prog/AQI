function SearchBar() {
  return (
    <div style={{ textAlign: "center", marginTop: "20px" }}>
      <input
        type="text"
        placeholder="🔍 Search city..."
        style={{
          width: "300px",
          padding: "10px",
          borderRadius: "10px",
          border: "1px solid gray",
        }}
      />
    </div>
  );
}

export default SearchBar;