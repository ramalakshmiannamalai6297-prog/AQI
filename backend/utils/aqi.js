/**
 * Indian CPCB (Central Pollution Control Board) AQI Calculation Utility (CommonJS)
 */

const AQI_CATEGORIES = {
  GOOD: { label: "Good", min: 0, max: 50, color: "#10b981", bg: "#ecfdf5", text: "#065f46" },
  SATISFACTORY: { label: "Satisfactory", min: 51, max: 100, color: "#84cc16", bg: "#f7fee7", text: "#3f6212" },
  MODERATE: { label: "Moderate", min: 101, max: 200, color: "#f59e0b", bg: "#fffbeb", text: "#92400e" },
  POOR: { label: "Poor", min: 201, max: 300, color: "#f97316", bg: "#fff7ed", text: "#9a3412" },
  VERY_POOR: { label: "Very Poor", min: 301, max: 400, color: "#ef4444", bg: "#fef2f2", text: "#991b1b" },
  SEVERE: { label: "Severe", min: 401, max: 500, color: "#7f1d1d", bg: "#fdf2f8", text: "#701a75" }
};

const POLLUTANT_BREAKPOINTS = {
  "PM2.5": [
    { cLow: 0, cHigh: 30, iLow: 0, iHigh: 50 },
    { cLow: 31, cHigh: 60, iLow: 51, iHigh: 100 },
    { cLow: 61, cHigh: 90, iLow: 101, iHigh: 200 },
    { cLow: 91, cHigh: 120, iLow: 201, iHigh: 300 },
    { cLow: 121, cHigh: 250, iLow: 301, iHigh: 400 },
    { cLow: 250, cHigh: 380, iLow: 401, iHigh: 500 }
  ],
  "PM10": [
    { cLow: 0, cHigh: 50, iLow: 0, iHigh: 50 },
    { cLow: 51, cHigh: 100, iLow: 51, iHigh: 100 },
    { cLow: 101, cHigh: 250, iLow: 101, iHigh: 200 },
    { cLow: 251, cHigh: 350, iLow: 201, iHigh: 300 },
    { cLow: 351, cHigh: 430, iLow: 301, iHigh: 400 },
    { cLow: 430, cHigh: 510, iLow: 401, iHigh: 500 }
  ],
  "NO2": [
    { cLow: 0, cHigh: 40, iLow: 0, iHigh: 50 },
    { cLow: 41, cHigh: 80, iLow: 51, iHigh: 100 },
    { cLow: 81, cHigh: 180, iLow: 101, iHigh: 200 },
    { cLow: 181, cHigh: 280, iLow: 201, iHigh: 300 },
    { cLow: 281, cHigh: 400, iLow: 301, iHigh: 400 },
    { cLow: 400, cHigh: 800, iLow: 401, iHigh: 500 }
  ],
  "OZONE": [
    { cLow: 0, cHigh: 50, iLow: 0, iHigh: 50 },
    { cLow: 51, cHigh: 100, iLow: 51, iHigh: 100 },
    { cLow: 101, cHigh: 168, iLow: 101, iHigh: 200 },
    { cLow: 169, cHigh: 208, iLow: 201, iHigh: 300 },
    { cLow: 209, cHigh: 748, iLow: 301, iHigh: 400 },
    { cLow: 748, cHigh: 1000, iLow: 401, iHigh: 500 }
  ],
  "SO2": [
    { cLow: 0, cHigh: 40, iLow: 0, iHigh: 50 },
    { cLow: 41, cHigh: 80, iLow: 51, iHigh: 100 },
    { cLow: 81, cHigh: 380, iLow: 101, iHigh: 200 },
    { cLow: 381, cHigh: 800, iLow: 201, iHigh: 300 },
    { cLow: 801, cHigh: 1600, iLow: 301, iHigh: 400 },
    { cLow: 1600, cHigh: 2000, iLow: 401, iHigh: 500 }
  ],
  "CO": [
    { cLow: 0, cHigh: 1.0, iLow: 0, iHigh: 50 },
    { cLow: 1.1, cHigh: 2.0, iLow: 51, iHigh: 100 },
    { cLow: 2.1, cHigh: 10, iLow: 101, iHigh: 200 },
    { cLow: 10, cHigh: 17, iLow: 201, iHigh: 300 },
    { cLow: 17, cHigh: 34, iLow: 301, iHigh: 400 },
    { cLow: 34, cHigh: 50, iLow: 401, iHigh: 500 }
  ]
};

function normalizePollutantKey(key) {
  if (!key) return null;
  const k = String(key).toUpperCase().replace(/₂/g, "2").replace(/₃/g, "3").replace(/[^A-Z0-9.]/g, "").trim();
  if (k === "PM2.5" || k === "PM25") return "PM2.5";
  if (k === "PM10") return "PM10";
  if (k === "NO2") return "NO2";
  if (k === "SO2") return "SO2";
  if (k === "CO") return "CO";
  if (k === "OZONE" || k === "O3") return "OZONE";
  return null;
}

function extractValue(val) {
  if (val === null || val === undefined) return null;
  if (typeof val === "object") {
    const raw = val.avg ?? val.value ?? val.val ?? val.currentValue ?? val.current_value;
    if (raw === null || raw === undefined) return null;
    const num = Number(raw);
    return isNaN(num) ? null : num;
  }
  const num = Number(val);
  return isNaN(num) ? null : num;
}

function calcSubIndex(pollutant, rawValue) {
  const val = extractValue(rawValue);
  if (val === null || isNaN(val) || val < 0) return null;

  const key = normalizePollutantKey(pollutant);
  if (!key) return null;

  const bands = POLLUTANT_BREAKPOINTS[key];
  if (!bands || !Array.isArray(bands)) return null;

  for (let i = 0; i < bands.length; i++) {
    const b = bands[i];
    if (val <= b.cHigh || i === bands.length - 1) {
      if (val >= b.cHigh && i === bands.length - 1) {
        const calc = b.iLow + ((b.iHigh - b.iLow) / (b.cHigh - b.cLow)) * (val - b.cLow);
        return Math.min(500, Math.max(0, Math.round(calc)));
      }
      const calc = b.iLow + ((b.iHigh - b.iLow) / (b.cHigh - b.cLow)) * (val - b.cLow);
      return Math.min(500, Math.max(0, Math.round(calc)));
    }
  }

  return 500;
}

function calcAQI(pollutants) {
  if (!pollutants || typeof pollutants !== "object") {
    return null;
  }

  const standardKeys = ["PM2.5", "PM10", "NO2", "SO2", "CO", "OZONE"];
  const displayNames = {
    "PM2.5": "PM2.5",
    "PM10": "PM10",
    "NO2": "NO₂",
    "SO2": "SO₂",
    "CO": "CO",
    "OZONE": "O₃"
  };

  const normalizedInputs = {};
  for (const [rawKey, rawVal] of Object.entries(pollutants)) {
    const normKey = normalizePollutantKey(rawKey);
    if (normKey) {
      const extracted = extractValue(rawVal);
      if (extracted !== null && !isNaN(extracted)) {
        normalizedInputs[normKey] = extracted;
      }
    }
  }

  const hasPM = normalizedInputs["PM2.5"] !== undefined || normalizedInputs["PM10"] !== undefined;
  if (!hasPM) {
    return null;
  }

  let maxSubIndex = -1;
  let dominantKey = null;
  const subIndices = {};

  for (const key of standardKeys) {
    if (normalizedInputs[key] !== undefined) {
      const sub = calcSubIndex(key, normalizedInputs[key]);
      if (sub !== null && !isNaN(sub)) {
        subIndices[key] = sub;
        if (sub > maxSubIndex) {
          maxSubIndex = sub;
          dominantKey = key;
        }
      }
    }
  }

  if (maxSubIndex < 0 || dominantKey === null) {
    return null;
  }

  return {
    aqi: maxSubIndex,
    dominantPollutant: displayNames[dominantKey] || dominantKey,
    dominantKey,
    subIndices
  };
}

function getAQICategory(aqi) {
  const num = Number(aqi);
  if (isNaN(num) || aqi === null || aqi === undefined) {
    return {
      label: "N/A",
      min: 0,
      max: 0,
      color: "#94a3b8",
      bg: "#f1f5f9",
      text: "#475569"
    };
  }

  if (num <= 50) return AQI_CATEGORIES.GOOD;
  if (num <= 100) return AQI_CATEGORIES.SATISFACTORY;
  if (num <= 200) return AQI_CATEGORIES.MODERATE;
  if (num <= 300) return AQI_CATEGORIES.POOR;
  if (num <= 400) return AQI_CATEGORIES.VERY_POOR;
  return AQI_CATEGORIES.SEVERE;
}

function generateRecommendations(aqi, dominantKey) {
  const cat = getAQICategory(aqi);
  const label = cat.label;
  const recommendations = [];

  let genAdvice, childAdvice, elderlyAdvice, asthmaAdvice, exerciseAdvice, maskAdvice, windowAdvice;
  let severity = "low";

  if (label === "Good") {
    severity = "low";
    genAdvice = "Air quality is considered satisfactory, and air pollution poses little or no risk.";
    childAdvice = "Safe for all outdoor activities, active play, and sports.";
    elderlyAdvice = "Safe to spend time outdoors and engage in regular daily routines.";
    asthmaAdvice = "No special precautions needed; regular activities can be safely continued.";
    exerciseAdvice = "Ideal conditions for outdoor running, cycling, and intense athletic training.";
    maskAdvice = "No mask required under current clean ambient conditions.";
    windowAdvice = "Keep windows open for natural fresh air ventilation; air purifiers are not needed.";
  } else if (label === "Satisfactory") {
    severity = "low";
    genAdvice = "Air quality is acceptable; unusually sensitive individuals may experience minor breathing discomfort.";
    childAdvice = "Safe for outdoor play, but take breaks during prolonged strenuous activities.";
    elderlyAdvice = "Generally safe for outdoor walks; monitor if any respiratory irritation occurs.";
    asthmaAdvice = "Keep quick-relief inhalers accessible if you are sensitive to atmospheric dust.";
    exerciseAdvice = "Outdoor exercise is generally fine; sensitive individuals should moderate exertion intensity.";
    maskAdvice = "Masks are not required for the general population.";
    windowAdvice = "Natural ventilation is fine; keep indoor living spaces dust-free.";
  } else if (label === "Moderate") {
    severity = "medium";
    genAdvice = "Air quality may cause breathing discomfort to people with lung disease, asthma, and heart conditions.";
    childAdvice = "Limit prolonged outdoor exertion and take regular indoor rest breaks.";
    elderlyAdvice = "Reduce prolonged or heavy outdoor exertion; take frequent rest intervals.";
    asthmaAdvice = "Reduce strenuous outdoor activities, keep inhalers handy, and avoid traffic corridors.";
    exerciseAdvice = "Consider shifting intense cardio workouts indoors or to early morning hours.";
    maskAdvice = "Sensitive individuals and elderly should wear a protective mask when outdoors.";
    windowAdvice = "Close windows during peak traffic hours; consider running air purifiers in bedrooms.";
  } else if (label === "Poor") {
    severity = "high";
    genAdvice = "Breathing discomfort to most people on prolonged exposure. Significant health risks for sensitive groups.";
    childAdvice = "Avoid prolonged outdoor play and sports; shift activities indoors.";
    elderlyAdvice = "Avoid outdoor morning walks and any strenuous physical activity.";
    asthmaAdvice = "Stay indoors as much as possible; strictly avoid physical exertion in ambient air.";
    exerciseAdvice = "Avoid outdoor running and strenuous workouts; switch to indoor exercise.";
    maskAdvice = "Wear a well-fitted N95 or equivalent particulate respirator when stepping outside.";
    windowAdvice = "Keep windows closed to prevent pollutant infiltration; run air purifiers indoors.";
  } else if (label === "Very Poor") {
    severity = "high";
    genAdvice = "Respiratory illness likely on prolonged exposure. Pronounced effect on people with lung or heart conditions.";
    childAdvice = "Strictly avoid all outdoor activities; remain indoors in clean air.";
    elderlyAdvice = "Stay indoors with doors and windows shut; avoid any outdoor exposure.";
    asthmaAdvice = "Remain strictly indoors; operate air filtration and consult your physician if symptoms worsen.";
    exerciseAdvice = "Do not exercise outdoors under any circumstances; exercise only indoors with filtered air.";
    maskAdvice = "N95 / FFP2 mask is mandatory if stepping outdoors even for brief periods.";
    windowAdvice = "Keep all windows and doors sealed; operate HEPA air purifiers continuously.";
  } else {
    // Severe
    severity = "high";
    genAdvice = "Emergency health alert: affects healthy individuals and severely impacts those with pre-existing conditions.";
    childAdvice = "Emergency indoor stay required; suspend all outdoor activities and physical education.";
    elderlyAdvice = "Strict indoor confinement; avoid all physical exertion and ambient air exposure.";
    asthmaAdvice = "Critical risk of severe exacerbations; remain in a sealed room with HEPA filtration and seek emergency care if needed.";
    exerciseAdvice = "Zero outdoor physical activity permitted. Complete indoor rest advised.";
    maskAdvice = "N95/N99 respirator required for any emergency outdoor transit; minimize exposure time.";
    windowAdvice = "Seal windows and gaps with weather stripping or damp towels; run HEPA air purifiers 24/7 on maximum.";
  }

  recommendations.push(
    { group: "General public", advice: genAdvice, severity },
    { group: "Children", advice: childAdvice, severity },
    { group: "Elderly", advice: elderlyAdvice, severity },
    { group: "People with asthma or heart disease", advice: asthmaAdvice, severity },
    { group: "Outdoor exercise", advice: exerciseAdvice, severity },
    { group: "Mask", advice: maskAdvice, severity },
    { group: "Windows and air purifier", advice: windowAdvice, severity }
  );

  // Dominant pollutant specific tip
  const normKey = normalizePollutantKey(dominantKey);
  if (normKey === "PM2.5" || normKey === "PM10") {
    recommendations.push({
      group: "Dominant Pollutant Tip (" + normKey + ")",
      advice: "Particulate matter is the primary driver of pollution today. Use an N95 mask and avoid dusty roadside areas and unpaved roads.",
      severity: severity === "low" ? "low" : "high"
    });
  } else if (normKey === "NO2" || normKey === "CO") {
    recommendations.push({
      group: "Dominant Pollutant Tip (" + normKey + ")",
      advice: "Traffic-related combustion gases are elevated. Avoid traffic-heavy roads, congested intersections, and diesel exhaust corridors.",
      severity: severity === "low" ? "low" : "high"
    });
  } else if (normKey === "OZONE") {
    recommendations.push({
      group: "Dominant Pollutant Tip (Ozone)",
      advice: "Ground-level Ozone is high. Avoid afternoon outdoor activity between 1 PM and 5 PM when solar radiation peaks ozone formation.",
      severity: severity === "low" ? "low" : "high"
    });
  } else if (normKey === "SO2") {
    recommendations.push({
      group: "Dominant Pollutant Tip (SO2)",
      advice: "Sulfur Dioxide levels are elevated. Avoid industrial zones, brick kilns, and thermal power plant downwind areas.",
      severity: severity === "low" ? "low" : "high"
    });
  } else {
    recommendations.push({
      group: "Dominant Pollutant Tip",
      advice: "Monitor local air quality index updates and avoid peak emission hours.",
      severity
    });
  }

  return recommendations;
}

module.exports = {
  AQI_CATEGORIES,
  POLLUTANT_BREAKPOINTS,
  normalizePollutantKey,
  calcSubIndex,
  calcAQI,
  getAQICategory,
  generateRecommendations
};
