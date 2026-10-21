/**
 * Indian CPCB (Central Pollution Control Board) AQI Calculation Utility (CommonJS)
 *
 * Official CPCB AQI Rules:
 * - Feed values from data.gov.in are already CPCB AQI sub-indices (0-500) per pollutant.
 * - Overall AQI is the HIGHEST sub-index among available pollutants (no breakpoint conversion).
 * - Dominant pollutant is the pollutant with that highest value.
 * - CPCB Data Requirement: At least 3 pollutants with real numbers, and at least one must be PM2.5 or PM10.
 *   Otherwise, AQI is unavailable (insufficient data).
 */

const AQI_CATEGORIES = {
  GOOD: { label: "Good", min: 0, max: 50, color: "#10b981", bg: "#ecfdf5", text: "#065f46" },
  SATISFACTORY: { label: "Satisfactory", min: 51, max: 100, color: "#84cc16", bg: "#f7fee7", text: "#3f6212" },
  MODERATE: { label: "Moderate", min: 101, max: 200, color: "#f59e0b", bg: "#fffbeb", text: "#92400e" },
  POOR: { label: "Poor", min: 201, max: 300, color: "#f97316", bg: "#fff7ed", text: "#9a3412" },
  VERY_POOR: { label: "Very Poor", min: 301, max: 400, color: "#ef4444", bg: "#fef2f2", text: "#991b1b" },
  SEVERE: { label: "Severe", min: 401, max: 500, color: "#7f1d1d", bg: "#fdf2f8", text: "#701a75" }
};

// Kept for backward compatibility with external references; feed values are already sub-indices
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
  if (k === "NH3") return "NH3";
  if (k === "PB") return "PB";
  return k;
}

function extractValue(val) {
  if (val === null || val === undefined) return null;
  if (typeof val === "object") {
    const raw = val.avg ?? val.value ?? val.val ?? val.currentValue ?? val.current_value;
    if (raw === null || raw === undefined || raw === "NA" || raw === "na") return null;
    const num = Number(raw);
    return isNaN(num) || !isFinite(num) ? null : num;
  }
  if (val === "NA" || val === "na") return null;
  const num = Number(val);
  return isNaN(num) || !isFinite(num) ? null : num;
}

/**
 * Returns the pollutant sub-index. Feed values from data.gov.in are already
 * CPCB AQI sub-indices (0-500), so no breakpoint interpolation is performed.
 */
function calcSubIndex(pollutant, rawValue) {
  const val = extractValue(rawValue);
  if (val === null || isNaN(val) || val < 0) return null;
  return Math.min(500, Math.max(0, Math.round(val)));
}

// Pollutants excluded from overall AQI and dominant pollutant selection.
// Empty list: CO is a valid CPCB AQI sub-index (0-500) and counts toward AQI.
const EXCLUDED_FROM_AQI = [];

/**
 * Calculates overall CPCB AQI:
 * - Data requirement: at least 3 pollutants with real numbers, AND at least one of them must be PM2.5 or PM10.
 * - Overall AQI is the HIGHEST sub-index among available pollutants (no breakpoint conversion).
 * - Dominant pollutant is the pollutant with that highest value.
 * Returns null if data requirements are not met.
 */
function calcAQI(pollutants) {
  if (!pollutants || typeof pollutants !== "object") {
    return null;
  }

  const displayNames = {
    "PM2.5": "PM2.5",
    "PM10": "PM10",
    "NO2": "NO₂",
    "SO2": "SO₂",
    "CO": "CO",
    "OZONE": "O₃",
    "NH3": "NH₃",
    "PB": "Pb"
  };

  const normalizedInputs = {};
  for (const [rawKey, rawVal] of Object.entries(pollutants)) {
    const normKey = normalizePollutantKey(rawKey);
    if (normKey) {
      const extracted = extractValue(rawVal);
      if (extracted !== null && !isNaN(extracted) && extracted >= 0) {
        normalizedInputs[normKey] = Math.min(500, Math.max(0, Math.round(extracted)));
      }
    }
  }

  // CPCB Data Requirement:
  // 1. Must have at least 3 pollutants with real numbers
  // 2. At least one must be PM2.5 or PM10
  const validPollutantCount = Object.keys(normalizedInputs).length;
  const hasPM = normalizedInputs["PM2.5"] !== undefined || normalizedInputs["PM10"] !== undefined;

  if (validPollutantCount < 3 || !hasPM) {
    return null;
  }

  let maxSubIndex = -1;
  let dominantKey = null;
  const subIndices = {};

  for (const [key, val] of Object.entries(normalizedInputs)) {
    subIndices[key] = val;
    if (!EXCLUDED_FROM_AQI.includes(key)) {
      if (val > maxSubIndex) {
        maxSubIndex = val;
        dominantKey = key;
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
      label: "AQI unavailable (insufficient data)",
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
  if (aqi === null || aqi === undefined || isNaN(Number(aqi))) {
    return [];
  }

  const cat = getAQICategory(aqi);
  const label = cat.label;
  const normKey = normalizePollutantKey(dominantKey);
  const recommendations = [];

  let genAdvice, childAdvice, elderlyAdvice, asthmaAdvice, exerciseAdvice, maskAdvice, windowAdvice;
  let genSev, childSev, elderlySev, asthmaSev, exerciseSev, maskSev, windowSev, dominantSev;

  if (label === "Good") {
    genSev = "low";
    childSev = "low";
    elderlySev = "low";
    asthmaSev = "low";
    exerciseSev = "low";
    maskSev = "low";
    windowSev = "low";
    dominantSev = "low";

    genAdvice = "Air quality is considered satisfactory, and air pollution poses little or no risk.";
    childAdvice = "Safe for all outdoor activities, active play, and sports.";
    elderlyAdvice = "Safe to spend time outdoors and engage in regular daily routines.";
    asthmaAdvice = "Clean air conditions; regular activities can be safely continued.";
    exerciseAdvice = "Ideal conditions for outdoor running, cycling, and intense athletic training.";
    maskAdvice = "No mask required under current clean ambient conditions.";
    windowAdvice = "Keep windows open for natural fresh air ventilation; air purifiers are not needed.";
  } else if (label === "Satisfactory") {
    genSev = "low";
    childSev = "low";
    elderlySev = "low";
    asthmaSev = "caution";
    exerciseSev = "low";
    maskSev = "low";
    windowSev = "low";
    dominantSev = "low";

    genAdvice = "Air quality is acceptable; poses little risk for the general population.";
    childAdvice = "Safe for outdoor play; normal activities can be maintained.";
    elderlyAdvice = "Generally safe for outdoor walks; monitor if any mild respiratory irritation occurs.";
    asthmaAdvice = "Unusually sensitive individuals may experience minor breathing discomfort; keep rescue inhalers accessible.";
    exerciseAdvice = "Outdoor workouts are fine; highly sensitive individuals may moderate heavy exertion.";
    maskAdvice = "Masks are not required for the general population.";
    windowAdvice = "Natural ventilation is fine; keep indoor living spaces clean and ventilated.";
  } else if (label === "Moderate") {
    genSev = "caution";
    childSev = "caution";
    elderlySev = "caution";
    asthmaSev = "warning";
    exerciseSev = "caution";
    maskSev = "caution";
    windowSev = "caution";
    dominantSev = "caution";

    genAdvice = "Air quality may cause minor breathing discomfort to sensitive individuals on prolonged exposure.";
    childAdvice = "Limit prolonged heavy exertion outdoors and take frequent rest breaks.";
    elderlyAdvice = "Reduce prolonged or heavy outdoor exertion; take frequent rest intervals.";
    asthmaAdvice = "Reduce strenuous outdoor activities, keep inhalers handy, and avoid heavy traffic corridors.";
    exerciseAdvice = "Consider shifting intense cardio workouts indoors or to early morning hours.";
    maskAdvice = "Sensitive individuals and elderly should consider wearing a protective mask in congested or dusty areas.";
    windowAdvice = "Close windows during peak traffic hours; consider running air purifiers in bedrooms.";
  } else if (label === "Poor") {
    genSev = "warning";
    childSev = "danger";
    elderlySev = "danger";
    asthmaSev = "danger";
    exerciseSev = "warning";
    maskSev = "warning";
    windowSev = "warning";
    dominantSev = "warning";

    genAdvice = "Breathing discomfort to most people on prolonged exposure. Significant health risks for sensitive groups.";
    childAdvice = "Avoid prolonged outdoor play and sports; shift activities indoors.";
    elderlyAdvice = "Avoid outdoor morning walks and any strenuous physical activity; remain indoors.";
    asthmaAdvice = "High risk of respiratory distress; stay indoors, avoid physical exertion, and keep medication accessible.";
    exerciseAdvice = "Avoid outdoor running, cycling, and strenuous workouts; switch to indoor exercise.";
    maskAdvice = "Wear a well-fitted N95 or equivalent particulate respirator when stepping outside.";
    windowAdvice = "Keep windows closed to prevent pollutant infiltration; run indoor air purifiers.";
  } else if (label === "Very Poor") {
    genSev = "danger";
    childSev = "danger";
    elderlySev = "danger";
    asthmaSev = "danger";
    exerciseSev = "danger";
    maskSev = "danger";
    windowSev = "danger";
    dominantSev = "danger";

    genAdvice = "Respiratory illness likely on prolonged exposure. Significant health impact on all individuals.";
    childAdvice = "Strictly avoid all outdoor activities; remain indoors in clean, filtered air.";
    elderlyAdvice = "Stay indoors with doors and windows shut; avoid any outdoor exposure.";
    asthmaAdvice = "Critical risk of acute symptoms; remain strictly indoors with air filtration and consult your doctor if symptoms worsen.";
    exerciseAdvice = "Do not exercise outdoors under any circumstances; exercise only indoors with filtered air.";
    maskAdvice = "N95 / FFP2 mask is mandatory if stepping outdoors even for brief periods.";
    windowAdvice = "Keep all windows and doors sealed; operate HEPA air purifiers continuously.";
  } else {
    // Severe
    genSev = "danger";
    childSev = "danger";
    elderlySev = "danger";
    asthmaSev = "danger";
    exerciseSev = "danger";
    maskSev = "danger";
    windowSev = "danger";
    dominantSev = "danger";

    genAdvice = "Emergency health alert: affects healthy individuals and severely impacts those with pre-existing conditions.";
    childAdvice = "Emergency indoor stay required; suspend all outdoor activities and physical education.";
    elderlyAdvice = "Strict indoor confinement; avoid all physical exertion and ambient air exposure.";
    asthmaAdvice = "Critical risk of severe exacerbations; remain in a sealed room with HEPA filtration and seek emergency care if needed.";
    exerciseAdvice = "Zero outdoor physical activity permitted. Complete indoor rest advised.";
    maskAdvice = "N95/N99 respirator required for any emergency outdoor transit; minimize exposure time.";
    windowAdvice = "Seal windows and gaps with weather stripping or damp towels; run HEPA air purifiers 24/7 on maximum.";
  }

  recommendations.push(
    { group: "General public", advice: genAdvice, severity: genSev },
    { group: "Children", advice: childAdvice, severity: childSev },
    { group: "Elderly", advice: elderlyAdvice, severity: elderlySev },
    { group: "People with asthma or heart disease", advice: asthmaAdvice, severity: asthmaSev },
    { group: "Outdoor exercise", advice: exerciseAdvice, severity: exerciseSev },
    { group: "Mask", advice: maskAdvice, severity: maskSev },
    { group: "Windows and air purifier", advice: windowAdvice, severity: windowSev }
  );

  // Dominant pollutant specific tip — depends on both pollutant and AQI band
  let dominantTipAdvice = "";
  const groupLabel = normKey ? `Dominant Pollutant Tip (${normKey})` : "Dominant Pollutant Tip";

  if (normKey === "PM2.5" || normKey === "PM10") {
    if (label === "Good") {
      dominantTipAdvice = `${normKey} is the primary contributor today, but levels are well within safe, clean limits. No protective measures needed.`;
    } else if (label === "Satisfactory") {
      dominantTipAdvice = `${normKey} is the dominant pollutant today, but levels remain within satisfactory limits.`;
    } else if (label === "Moderate") {
      dominantTipAdvice = `Particulate matter (${normKey}) is elevated. Sensitive individuals should avoid dusty roadside areas and consider wearing a mask outdoors.`;
    } else if (label === "Poor") {
      dominantTipAdvice = `High ${normKey} particulate levels. Wear an N95 mask outdoors and avoid dusty roads and high-traffic zones.`;
    } else if (label === "Very Poor") {
      dominantTipAdvice = `Dangerous ${normKey} particulate levels. N95 mask is required for any outdoor exposure; minimize time outdoors.`;
    } else {
      dominantTipAdvice = `Hazardous ${normKey} particulate levels. Emergency N95/N99 protection required outdoors; remain strictly indoors with HEPA filtration.`;
    }
  } else if (normKey === "NO2" || normKey === "CO") {
    if (label === "Good") {
      dominantTipAdvice = `Combustion gases (${normKey}) are at safe, minimal baseline levels.`;
    } else if (label === "Satisfactory") {
      dominantTipAdvice = `Vehicular combustion emissions (${normKey}) are within satisfactory ambient limits.`;
    } else if (label === "Moderate") {
      dominantTipAdvice = `Traffic-related combustion gases (${normKey}) are elevated. Avoid heavy traffic corridors and idling vehicles.`;
    } else if (label === "Poor") {
      dominantTipAdvice = `High ${normKey} traffic emissions. Avoid congested intersections, highways, and diesel exhaust corridors.`;
    } else if (label === "Very Poor") {
      dominantTipAdvice = `Dangerous combustion gas levels. Strictly avoid traffic-heavy corridors and industrial zones.`;
    } else {
      dominantTipAdvice = `Hazardous toxic combustion gas levels. Remain indoors with sealed ventilation.`;
    }
  } else if (normKey === "OZONE") {
    if (label === "Good") {
      dominantTipAdvice = `Ground-level Ozone (O₃) is at natural, safe background levels.`;
    } else if (label === "Satisfactory") {
      dominantTipAdvice = `Ground-level Ozone (O₃) is within satisfactory limits.`;
    } else if (label === "Moderate") {
      dominantTipAdvice = `Ground-level Ozone (O₃) is elevated. Sensitive groups should reduce afternoon outdoor exertion between 1 PM and 5 PM.`;
    } else if (label === "Poor") {
      dominantTipAdvice = `High Ground-level Ozone (O₃). Avoid strenuous afternoon outdoor activity between 1 PM and 5 PM when solar radiation peaks ozone formation.`;
    } else if (label === "Very Poor") {
      dominantTipAdvice = `Dangerous Ground-level Ozone (O₃) levels. Strictly avoid outdoor exposure during peak daylight hours.`;
    } else {
      dominantTipAdvice = `Hazardous Ozone (O₃) alert. Complete indoor shelter advised; avoid all outdoor air intake.`;
    }
  } else if (normKey === "SO2") {
    if (label === "Good") {
      dominantTipAdvice = `Sulfur Dioxide (SO₂) is minimal and well within safe environmental limits.`;
    } else if (label === "Satisfactory") {
      dominantTipAdvice = `Sulfur Dioxide (SO₂) levels are within satisfactory thresholds.`;
    } else if (label === "Moderate") {
      dominantTipAdvice = `Sulfur Dioxide (SO₂) is elevated. Sensitive individuals should avoid areas near heavy industrial emissions.`;
    } else if (label === "Poor") {
      dominantTipAdvice = `High Sulfur Dioxide (SO₂) levels. Avoid industrial zones, brick kilns, and thermal power plant downwind areas.`;
    } else if (label === "Very Poor") {
      dominantTipAdvice = `Dangerous Sulfur Dioxide (SO₂) levels. Avoid all outdoor exposure near industrial sectors.`;
    } else {
      dominantTipAdvice = `Hazardous Sulfur Dioxide (SO₂) levels. Remain strictly indoors with sealed windows.`;
    }
  } else {
    if (label === "Good" || label === "Satisfactory") {
      dominantTipAdvice = `All monitored pollutant levels are within safe, acceptable limits.`;
    } else if (label === "Moderate") {
      dominantTipAdvice = `Dominant pollutant is elevated; sensitive individuals should take precautions during peak hours.`;
    } else if (label === "Poor") {
      dominantTipAdvice = `High pollutant levels; wear protective masks and limit outdoor exposure.`;
    } else {
      dominantTipAdvice = `Severe pollutant levels; wear N95 respirator and remain indoors.`;
    }
  }

  recommendations.push({
    group: groupLabel,
    advice: dominantTipAdvice,
    severity: dominantSev
  });

  return recommendations;
}

module.exports = {
  AQI_CATEGORIES,
  POLLUTANT_BREAKPOINTS,
  EXCLUDED_FROM_AQI,
  normalizePollutantKey,
  calcSubIndex,
  calcAQI,
  getAQICategory,
  generateRecommendations
};
