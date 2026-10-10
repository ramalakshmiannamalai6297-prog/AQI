// Centralized Dummy Dataset for AQI Monitoring Demo (AirLens AI)

export const AQI_CATEGORIES = {
  GOOD: { label: "Good", min: 0, max: 50, color: "#10b981", bg: "#ecfdf5", text: "#065f46" },
  SATISFACTORY: { label: "Satisfactory", min: 51, max: 100, color: "#84cc16", bg: "#f7fee7", text: "#3f6212" },
  MODERATE: { label: "Moderate", min: 101, max: 200, color: "#f59e0b", bg: "#fffbeb", text: "#92400e" },
  POOR: { label: "Poor", min: 201, max: 300, color: "#f97316", bg: "#fff7ed", text: "#9a3412" },
  VERY_POOR: { label: "Very Poor", min: 301, max: 400, color: "#ef4444", bg: "#fef2f2", text: "#991b1b" },
  SEVERE: { label: "Severe", min: 401, max: 500, color: "#7f1d1d", bg: "#fdf2f8", text: "#701a75" }
};

export function getAQICategory(aqi) {
  if (aqi <= 50) return AQI_CATEGORIES.GOOD;
  if (aqi <= 100) return AQI_CATEGORIES.SATISFACTORY;
  if (aqi <= 200) return AQI_CATEGORIES.MODERATE;
  if (aqi <= 300) return AQI_CATEGORIES.POOR;
  if (aqi <= 400) return AQI_CATEGORIES.VERY_POOR;
  return AQI_CATEGORIES.SEVERE;
}

export function getAQIColor(aqi) {
  return getAQICategory(aqi).color;
}

export function getAQIBgColor(aqi) {
  return getAQICategory(aqi).bg;
}

export function getHealthAdvice(aqi) {
  if (aqi <= 50) {
    return {
      risk: "Minimal Risk",
      riskLevel: "low",
      badgeColor: "#10b981",
      explanation: "Air quality is considered satisfactory, and air pollution poses little or no risk.",
      outdoorActivity: "Ideal for all outdoor activities and exercise. Open windows for fresh air.",
      precautions: [
        "Enjoy normal outdoor activities",
        "Natural ventilation is recommended",
        "No masks required for general public"
      ]
    };
  }
  if (aqi <= 100) {
    return {
      risk: "Minor Concern",
      riskLevel: "satisfactory",
      badgeColor: "#84cc16",
      explanation: "Air quality is acceptable; however, very sensitive individuals may experience minor irritation.",
      outdoorActivity: "Safe for outdoor sports and walks for the general public. Sensitive individuals should monitor symptoms.",
      precautions: [
        "Unusually sensitive individuals should reduce prolonged outdoor exertion",
        "Keep indoor areas clean",
        "Safe for most people to travel and work outdoors"
      ]
    };
  }
  if (aqi <= 200) {
    return {
      risk: "Moderate Risk",
      riskLevel: "moderate",
      badgeColor: "#f59e0b",
      explanation: "Breathing discomfort to people with lung disease, asthma, and heart conditions.",
      outdoorActivity: "Limit prolonged heavy exertion outdoors, especially in the early morning and late evening.",
      precautions: [
        "Children & elderly should reduce heavy exertion",
        "Wear anti-pollution mask (N95) if sensitive",
        "Keep indoor air filters running in bedrooms"
      ]
    };
  }
  if (aqi <= 300) {
    return {
      risk: "High Risk (Unhealthy)",
      riskLevel: "poor",
      badgeColor: "#f97316",
      explanation: "Breathing discomfort to most people on prolonged exposure. High risk for respiratory patients.",
      outdoorActivity: "Avoid prolonged outdoor cardio and sports. Shift activities indoors where possible.",
      precautions: [
        "Wear N95/FFP2 masks when stepping outside",
        "Keep home windows and doors tightly closed",
        "Run HEPA air purifiers inside living spaces"
      ]
    };
  }
  if (aqi <= 400) {
    return {
      risk: "Very High Health Risk",
      riskLevel: "very-poor",
      badgeColor: "#ef4444",
      explanation: "Respiratory illness on prolonged exposure. Significant aggravation of heart and lung diseases.",
      outdoorActivity: "Strictly avoid outdoor jogging, cycling, and strenuous physical exertion.",
      precautions: [
        "N95 mask mandatory for anyone going outside",
        "Vulnerable groups (children, seniors) should stay strictly indoors",
        "Use air purifiers on high filtration mode indoors"
      ]
    };
  }
  return {
    risk: "Emergency / Severe Hazard",
    riskLevel: "severe",
    badgeColor: "#7f1d1d",
    explanation: "Affects healthy people and seriously impacts those with existing diseases. Hazardous pollution levels.",
    outdoorActivity: "Avoid all outdoor physical activity. Remain indoors with sealed filtration.",
    precautions: [
      "Avoid all non-essential outdoor movement",
      "Seal door/window gaps and use medical-grade air purification",
      "Consult a healthcare professional if experiencing shortness of breath"
    ]
  };
}

// Generate realistic 24h trend data around a base AQI
function generateHourlyTrend(baseAQI) {
  const hours = [
    "00:00", "02:00", "04:00", "06:00", "08:00", "10:00",
    "12:00", "14:00", "16:00", "18:00", "20:00", "22:00"
  ];
  return hours.map((hour, index) => {
    // Diurnal variation: higher in morning/night, lower in afternoon
    const factor = [1.05, 1.1, 1.15, 1.25, 1.3, 1.1, 0.85, 0.8, 0.9, 1.05, 1.2, 1.15][index];
    const aqi = Math.round(baseAQI * factor);
    const pm25 = Math.round(aqi * 0.55);
    const pm10 = Math.round(aqi * 0.92);
    return {
      time: hour,
      aqi,
      pm25,
      pm10
    };
  });
}

// 20 Indian cities covering North, South, East, West, Central, and Northeast
export const sensorLocations = [
  {
    id: "delhi-anand-vihar",
    city: "Delhi",
    state: "Delhi NCR",
    station: "Anand Vihar CPCB",
    latitude: 28.6469,
    longitude: 77.3160,
    aqi: 382,
    pm25: 210,
    pm10: 345,
    co: 2.8,
    no2: 74,
    so2: 26,
    o3: 45,
    temperature: "24°C",
    humidity: "68%",
    sensorStatus: "Online",
    lastUpdated: "5 mins ago",
    dominatingPollutant: "PM2.5",
    trend: "+14 pts (last hr)"
  },
  {
    id: "mumbai-bkc",
    city: "Mumbai",
    state: "Maharashtra",
    station: "Bandra Kurla Complex",
    latitude: 19.0664,
    longitude: 72.8687,
    aqi: 148,
    pm25: 58,
    pm10: 112,
    co: 1.2,
    no2: 42,
    so2: 15,
    o3: 31,
    temperature: "29°C",
    humidity: "78%",
    sensorStatus: "Online",
    lastUpdated: "8 mins ago",
    dominatingPollutant: "PM10",
    trend: "-5 pts (last hr)"
  },
  {
    id: "bengaluru-btm",
    city: "Bengaluru",
    state: "Karnataka",
    station: "BTM Layout Station",
    latitude: 12.9166,
    longitude: 77.6101,
    aqi: 42,
    pm25: 14,
    pm10: 36,
    co: 0.5,
    no2: 18,
    so2: 6,
    o3: 22,
    temperature: "22°C",
    humidity: "62%",
    sensorStatus: "Online",
    lastUpdated: "3 mins ago",
    dominatingPollutant: "O₃",
    trend: "-2 pts (last hr)"
  },
  {
    id: "kolkata-victoria",
    city: "Kolkata",
    state: "West Bengal",
    station: "Victoria Memorial Fort",
    latitude: 22.5448,
    longitude: 88.3426,
    aqi: 235,
    pm25: 118,
    pm10: 184,
    co: 1.9,
    no2: 56,
    so2: 21,
    o3: 38,
    temperature: "27°C",
    humidity: "74%",
    sensorStatus: "Online",
    lastUpdated: "12 mins ago",
    dominatingPollutant: "PM2.5",
    trend: "+8 pts (last hr)"
  },
  {
    id: "chennai-alandur",
    city: "Chennai",
    state: "Tamil Nadu",
    station: "Alandur Metro Hub",
    latitude: 13.0034,
    longitude: 80.2016,
    aqi: 68,
    pm25: 26,
    pm10: 55,
    co: 0.7,
    no2: 24,
    so2: 9,
    o3: 28,
    temperature: "31°C",
    humidity: "82%",
    sensorStatus: "Online",
    lastUpdated: "15 mins ago",
    dominatingPollutant: "PM10",
    trend: "+3 pts (last hr)"
  },
  {
    id: "hyderabad-sanathnagar",
    city: "Hyderabad",
    state: "Telangana",
    station: "Sanathnagar Ind. Area",
    latitude: 17.4563,
    longitude: 78.4439,
    aqi: 112,
    pm25: 44,
    pm10: 89,
    co: 1.1,
    no2: 36,
    so2: 14,
    o3: 29,
    temperature: "26°C",
    humidity: "58%",
    sensorStatus: "Online",
    lastUpdated: "6 mins ago",
    dominatingPollutant: "PM2.5",
    trend: "-1 pt (last hr)"
  },
  {
    id: "ahmedabad-maninagar",
    city: "Ahmedabad",
    state: "Gujarat",
    station: "Maninagar Crossing",
    latitude: 22.9978,
    longitude: 72.6033,
    aqi: 185,
    pm25: 84,
    pm10: 145,
    co: 1.5,
    no2: 48,
    so2: 19,
    o3: 35,
    temperature: "28°C",
    humidity: "48%",
    sensorStatus: "Online",
    lastUpdated: "10 mins ago",
    dominatingPollutant: "PM10",
    trend: "+6 pts (last hr)"
  },
  {
    id: "pune-shivajinagar",
    city: "Pune",
    state: "Maharashtra",
    station: "Shivajinagar Station",
    latitude: 18.5314,
    longitude: 73.8446,
    aqi: 95,
    pm25: 35,
    pm10: 74,
    co: 0.9,
    no2: 28,
    so2: 11,
    o3: 25,
    temperature: "25°C",
    humidity: "55%",
    sensorStatus: "Online",
    lastUpdated: "4 mins ago",
    dominatingPollutant: "PM2.5",
    trend: "+2 pts (last hr)"
  },
  {
    id: "jaipur-mansarovar",
    city: "Jaipur",
    state: "Rajasthan",
    station: "Mansarovar Sector 5",
    latitude: 26.8533,
    longitude: 75.7672,
    aqi: 260,
    pm25: 135,
    pm10: 215,
    co: 2.1,
    no2: 60,
    so2: 22,
    o3: 40,
    temperature: "23°C",
    humidity: "42%",
    sensorStatus: "Online",
    lastUpdated: "7 mins ago",
    dominatingPollutant: "PM10",
    trend: "+12 pts (last hr)"
  },
  {
    id: "lucknow-talkatora",
    city: "Lucknow",
    state: "Uttar Pradesh",
    station: "Talkatora Ind. Estate",
    latitude: 26.8322,
    longitude: 80.9022,
    aqi: 340,
    pm25: 185,
    pm10: 298,
    co: 2.6,
    no2: 70,
    so2: 25,
    o3: 42,
    temperature: "22°C",
    humidity: "72%",
    sensorStatus: "Online",
    lastUpdated: "9 mins ago",
    dominatingPollutant: "PM2.5",
    trend: "+18 pts (last hr)"
  },
  {
    id: "patna-samastipur",
    city: "Patna",
    state: "Bihar",
    station: "Muradpur / Rajbansi Nagar",
    latitude: 25.6127,
    longitude: 85.1278,
    aqi: 418,
    pm25: 265,
    pm10: 395,
    co: 3.4,
    no2: 82,
    so2: 32,
    o3: 52,
    temperature: "21°C",
    humidity: "79%",
    sensorStatus: "Online",
    lastUpdated: "2 mins ago",
    dominatingPollutant: "PM2.5",
    trend: "+22 pts (last hr)"
  },
  {
    id: "chandigarh-sector22",
    city: "Chandigarh",
    state: "Punjab / Haryana",
    station: "Sector 22-B Central",
    latitude: 30.7333,
    longitude: 76.7794,
    aqi: 125,
    pm25: 52,
    pm10: 98,
    co: 1.1,
    no2: 34,
    so2: 12,
    o3: 30,
    temperature: "20°C",
    humidity: "60%",
    sensorStatus: "Online",
    lastUpdated: "14 mins ago",
    dominatingPollutant: "PM2.5",
    trend: "-4 pts (last hr)"
  },
  {
    id: "varanasi-ardhali",
    city: "Varanasi",
    state: "Uttar Pradesh",
    station: "Ardhali Bazar Stn",
    latitude: 25.3356,
    longitude: 82.9739,
    aqi: 295,
    pm25: 155,
    pm10: 245,
    co: 2.3,
    no2: 64,
    so2: 24,
    o3: 41,
    temperature: "24°C",
    humidity: "70%",
    sensorStatus: "Online",
    lastUpdated: "11 mins ago",
    dominatingPollutant: "PM2.5",
    trend: "+9 pts (last hr)"
  },
  {
    id: "kochi-eloor",
    city: "Kochi",
    state: "Kerala",
    station: "Eloor Industrial Belt",
    latitude: 10.0818,
    longitude: 76.2996,
    aqi: 48,
    pm25: 18,
    pm10: 42,
    co: 0.6,
    no2: 19,
    so2: 7,
    o3: 20,
    temperature: "30°C",
    humidity: "84%",
    sensorStatus: "Online",
    lastUpdated: "18 mins ago",
    dominatingPollutant: "PM10",
    trend: "0 pts (last hr)"
  },
  {
    id: "guwahati-panbazaar",
    city: "Guwahati",
    state: "Assam",
    station: "Pan Bazaar Riverfront",
    latitude: 26.1856,
    longitude: 91.7485,
    aqi: 172,
    pm25: 76,
    pm10: 138,
    co: 1.4,
    no2: 44,
    so2: 17,
    o3: 33,
    temperature: "22°C",
    humidity: "76%",
    sensorStatus: "Online",
    lastUpdated: "16 mins ago",
    dominatingPollutant: "PM2.5",
    trend: "+5 pts (last hr)"
  },
  {
    id: "bhopal-ttnagar",
    city: "Bhopal",
    state: "Madhya Pradesh",
    station: "T.T. Nagar Complex",
    latitude: 23.2332,
    longitude: 77.4005,
    aqi: 138,
    pm25: 56,
    pm10: 105,
    co: 1.2,
    no2: 38,
    so2: 15,
    o3: 28,
    temperature: "26°C",
    humidity: "52%",
    sensorStatus: "Online",
    lastUpdated: "20 mins ago",
    dominatingPollutant: "PM2.5",
    trend: "-3 pts (last hr)"
  },
  {
    id: "indore-vijaynagar",
    city: "Indore",
    state: "Madhya Pradesh",
    station: "Vijay Nagar Junction",
    latitude: 22.7533,
    longitude: 75.8937,
    aqi: 84,
    pm25: 32,
    pm10: 68,
    co: 0.8,
    no2: 26,
    so2: 10,
    o3: 24,
    temperature: "25°C",
    humidity: "50%",
    sensorStatus: "Online",
    lastUpdated: "5 mins ago",
    dominatingPollutant: "PM10",
    trend: "-2 pts (last hr)"
  },
  {
    id: "visakhapatnam-gajuwaka",
    city: "Visakhapatnam",
    state: "Andhra Pradesh",
    station: "Gajuwaka Industrial Area",
    latitude: 17.6904,
    longitude: 83.2185,
    aqi: 92,
    pm25: 34,
    pm10: 72,
    co: 0.9,
    no2: 29,
    so2: 12,
    o3: 26,
    temperature: "29°C",
    humidity: "80%",
    sensorStatus: "Online",
    lastUpdated: "13 mins ago",
    dominatingPollutant: "PM10",
    trend: "+1 pt (last hr)"
  },
  {
    id: "surat-varachha",
    city: "Surat",
    state: "Gujarat",
    station: "Varachha Main Ring",
    latitude: 21.2185,
    longitude: 72.8619,
    aqi: 164,
    pm25: 72,
    pm10: 128,
    co: 1.4,
    no2: 45,
    so2: 18,
    o3: 32,
    temperature: "29°C",
    humidity: "65%",
    sensorStatus: "Online",
    lastUpdated: "7 mins ago",
    dominatingPollutant: "PM2.5",
    trend: "+4 pts (last hr)"
  },
  {
    id: "srinagar-rajbagh",
    city: "Srinagar",
    state: "Jammu & Kashmir",
    station: "Rajbagh Tourist Area",
    latitude: 34.0722,
    longitude: 74.8194,
    aqi: 35,
    pm25: 11,
    pm10: 28,
    co: 0.4,
    no2: 14,
    so2: 5,
    o3: 18,
    temperature: "12°C",
    humidity: "58%",
    sensorStatus: "Online",
    lastUpdated: "25 mins ago",
    dominatingPollutant: "O₃",
    trend: "-1 pt (last hr)"
  }
].map(sensor => {
  const categoryInfo = getAQICategory(sensor.aqi);
  return {
    ...sensor,
    category: categoryInfo.label,
    categoryColor: categoryInfo.color,
    categoryBg: categoryInfo.bg,
    categoryText: categoryInfo.text,
    healthAdvice: getHealthAdvice(sensor.aqi),
    hourlyTrend: generateHourlyTrend(sensor.aqi),
    pollutants: {
      pm25: sensor.pm25,
      pm10: sensor.pm10,
      co: sensor.co,
      no2: sensor.no2,
      so2: sensor.so2,
      o3: sensor.o3
    },
    pollutantBreakdown: [
      { name: "PM2.5", value: sensor.pm25, safeLimit: 60, unit: "µg/m³" },
      { name: "PM10", value: sensor.pm10, safeLimit: 100, unit: "µg/m³" },
      { name: "NO₂", value: sensor.no2, safeLimit: 80, unit: "µg/m³" },
      { name: "SO₂", value: sensor.so2, safeLimit: 80, unit: "µg/m³" },
      { name: "CO", value: sensor.co * 10, safeLimit: 20, unit: "0.1mg/m³" },
      { name: "O₃", value: sensor.o3, safeLimit: 100, unit: "µg/m³" }
    ]
  };
});

// Default fallback data for backward compatibility
export const aqiData = sensorLocations[0];

export function getCityData(idOrCity) {
  if (!idOrCity) return sensorLocations[0];
  const normalized = idOrCity.toLowerCase().trim();
  const match = sensorLocations.find(
    s => s.id === normalized || s.city.toLowerCase() === normalized
  );
  return match || sensorLocations[0];
}

export function getAllCities() {
  return sensorLocations;
}