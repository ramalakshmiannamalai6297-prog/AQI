/**
 * Indian CPCB (Central Pollution Control Board) AQI Calculation Utility
 * 
 * Standard Breakpoints for 6 Pollutants (Units: µg/m³ except CO in mg/m³):
 * AQI Bands:
 *   0 - 50: Good
 *   51 - 100: Satisfactory
 *   101 - 200: Moderate
 *   201 - 300: Poor
 *   301 - 400: Very Poor
 *   401 - 500: Severe
 */

export const AQI_CATEGORIES = {
  GOOD: { label: "Good", min: 0, max: 50, color: "#10b981", bg: "#ecfdf5", text: "#065f46" },
  SATISFACTORY: { label: "Satisfactory", min: 51, max: 100, color: "#84cc16", bg: "#f7fee7", text: "#3f6212" },
  MODERATE: { label: "Moderate", min: 101, max: 200, color: "#f59e0b", bg: "#fffbeb", text: "#92400e" },
  POOR: { label: "Poor", min: 201, max: 300, color: "#f97316", bg: "#fff7ed", text: "#9a3412" },
  VERY_POOR: { label: "Very Poor", min: 301, max: 400, color: "#ef4444", bg: "#fef2f2", text: "#991b1b" },
  SEVERE: { label: "Severe", min: 401, max: 500, color: "#7f1d1d", bg: "#fdf2f8", text: "#701a75" }
};

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

/**
 * Normalizes any variation of pollutant names to standard keys
 */
export function normalizePollutantKey(key) {
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

/**
 * Extracts a numeric average value from numbers, strings, or { avg, min, max } objects
 */
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

/**
 * Calculates the CPCB Sub-Index for an individual pollutant value
 * Uses linear interpolation inside the respective breakpoint band.
 */
export function calcSubIndex(pollutant, rawValue) {
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
        // Last open-ended band: capped at 500
        const calc = b.iLow + ((b.iHigh - b.iLow) / (b.cHigh - b.cLow)) * (val - b.cLow);
        return Math.min(500, Math.max(0, Math.round(calc)));
      }
      const calc = b.iLow + ((b.iHigh - b.iLow) / (b.cHigh - b.cLow)) * (val - b.cLow);
      return Math.min(500, Math.max(0, Math.round(calc)));
    }
  }

  return 500;
}

/**
 * Calculates the overall Indian CPCB AQI from a map/object of pollutants.
 * The overall AQI is the HIGHEST sub-index across available pollutants.
 * Returns: { aqi, dominantPollutant, dominantKey, subIndices }
 * 
 * Rules:
 * - Uses the "avg" value of each pollutant.
 * - If a pollutant is missing, skips it.
 * - If both PM2.5 and PM10 are missing, returns null.
 */
export function calcAQI(pollutants) {
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

  // CPCB requirement: Must have at least one particulate matter indicator (PM2.5 or PM10)
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

/**
 * Returns label, color, background and text styling for a given AQI value
 */
export function getAQICategory(aqi) {
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

export function getAQIColor(aqi) {
  return getAQICategory(aqi).color;
}

export function getAQIBgColor(aqi) {
  return getAQICategory(aqi).bg;
}

export default {
  AQI_CATEGORIES,
  POLLUTANT_BREAKPOINTS,
  calcSubIndex,
  calcAQI,
  getAQICategory,
  getAQIColor,
  getAQIBgColor,
  normalizePollutantKey
};
