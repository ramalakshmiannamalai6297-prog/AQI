/**
 * Indian CPCB (Central Pollution Control Board) AQI Calculation Utility (ES Module)
 *
 * Official CPCB AQI Rules:
 * - Feed values from data.gov.in are already CPCB AQI sub-indices (0-500) per pollutant.
 * - Overall AQI is the HIGHEST sub-index among available pollutants (no breakpoint conversion).
 * - Dominant pollutant is the pollutant with that highest value.
 * - CPCB Data Requirement: At least 3 pollutants with real numbers, and at least one must be PM2.5 or PM10.
 *   Otherwise, AQI is unavailable (insufficient data).
 */

export const AQI_CATEGORIES = {
  GOOD: { label: "Good", min: 0, max: 50, color: "#10b981", bg: "#ecfdf5", text: "#065f46" },
  SATISFACTORY: { label: "Satisfactory", min: 51, max: 100, color: "#84cc16", bg: "#f7fee7", text: "#3f6212" },
  MODERATE: { label: "Moderate", min: 101, max: 200, color: "#f59e0b", bg: "#fffbeb", text: "#92400e" },
  POOR: { label: "Poor", min: 201, max: 300, color: "#f97316", bg: "#fff7ed", text: "#9a3412" },
  VERY_POOR: { label: "Very Poor", min: 301, max: 400, color: "#ef4444", bg: "#fef2f2", text: "#991b1b" },
  SEVERE: { label: "Severe", min: 401, max: 500, color: "#7f1d1d", bg: "#fdf2f8", text: "#701a75" }
};

// Kept for backward compatibility with external references; feed values are already sub-indices
export const POLLUTANT_BREAKPOINTS = {
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

export function normalizePollutantKey(key) {
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
export function calcSubIndex(pollutant, rawValue) {
  const val = extractValue(rawValue);
  if (val === null || isNaN(val) || val < 0) return null;
  return Math.min(500, Math.max(0, Math.round(val)));
}

// Pollutants excluded from overall AQI and dominant pollutant selection.
// Empty list: CO is a valid CPCB AQI sub-index (0-500) and counts toward AQI.
export const EXCLUDED_FROM_AQI = [];

/**
 * Calculates overall CPCB AQI:
 * - Data requirement: at least 3 pollutants with real numbers, AND at least one of them must be PM2.5 or PM10.
 * - Overall AQI is the HIGHEST sub-index among available pollutants (no breakpoint conversion).
 * - Dominant pollutant is the pollutant with that highest value.
 * Returns null if data requirements are not met.
 */
export function calcAQI(pollutants) {
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

export function getAQICategory(aqi) {
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

export function getAQIColor(aqi) {
  return getAQICategory(aqi).color;
}

export function getAQIBgColor(aqi) {
  return getAQICategory(aqi).bg;
}

export default {
  AQI_CATEGORIES,
  POLLUTANT_BREAKPOINTS,
  EXCLUDED_FROM_AQI,
  calcSubIndex,
  calcAQI,
  getAQICategory,
  getAQIColor,
  getAQIBgColor,
  normalizePollutantKey
};
