/**
 * AirLens Responsive Email Templates
 * Built with HTML table layout and inline CSS for email client compatibility.
 */

function escapeHtml(str) {
  if (str === null || str === undefined) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function getCpcbStyle(category) {
  const cat = String(category || "").toLowerCase();
  if (cat.includes("unavailable") || cat.includes("insufficient") || cat.includes("n/a")) {
    return { bg: "#f1f5f9", text: "#475569", border: "#cbd5e1", lightBg: "#f8fafc" };
  }
  if (cat.includes("good")) {
    return { bg: "#10b981", text: "#ffffff", border: "#059669", lightBg: "#ecfdf5" };
  }
  if (cat.includes("satisfactory")) {
    return { bg: "#84cc16", text: "#ffffff", border: "#65a30d", lightBg: "#f7fee7" };
  }
  if (cat.includes("moderate")) {
    return { bg: "#f59e0b", text: "#ffffff", border: "#d97706", lightBg: "#fffbeb" };
  }
  if (cat.includes("very poor")) {
    return { bg: "#ef4444", text: "#ffffff", border: "#dc2626", lightBg: "#fef2f2" };
  }
  if (cat.includes("poor")) {
    return { bg: "#f97316", text: "#ffffff", border: "#ea580c", lightBg: "#fff7ed" };
  }
  if (cat.includes("severe")) {
    return { bg: "#7f1d1d", text: "#ffffff", border: "#450a0a", lightBg: "#fdf2f8" };
  }
  return { bg: "#f1f5f9", text: "#475569", border: "#cbd5e1", lightBg: "#f8fafc" };
}

function getAdviceSeverityColor(severity) {
  const s = String(severity || "").toLowerCase();
  if (s === "critical" || s === "severe") return "#ef4444";
  if (s === "warning") return "#f97316";
  if (s === "caution") return "#f59e0b";
  return "#10b981";
}

function formatISTDate(dateVal) {
  if (!dateVal) return "N/A";
  const d = new Date(dateVal);
  if (isNaN(d.getTime())) return String(dateVal);
  return d.toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true
  }) + " IST";
}

/**
 * Build Daily Report Email (HTML & Plain Text)
 */
function buildDailyReportEmail({ email, stations, dateStr }) {
  const safeEmail = escapeHtml(email);
  const formattedToday = formatISTDate(new Date());

  // HTML Cards for each station
  const stationCardsHtml = stations.map((st) => {
    const isAqiAvailable = typeof st.aqi === "number" && st.aqi !== null;
    const cpcb = getCpcbStyle(isAqiAvailable ? st.category : "unavailable");
    const stationName = escapeHtml(st.stationName || "Unknown Station");
    const city = escapeHtml(st.city || "India");
    const state = escapeHtml(st.state || "");
    const aqiDisplay = isAqiAvailable ? st.aqi : null;
    const categoryDisplay = isAqiAvailable ? escapeHtml(st.category || "") : "AQI unavailable (insufficient data)";
    const dominantDisplay = isAqiAvailable ? escapeHtml(st.dominantPollutant || "Unavailable") : "Unavailable";
    const lastUpdateDisplay = formatISTDate(st.lastUpdate);

    // 24h Summary Section (ONLY if at least 3 historical readings exist and all numbers are valid)
    let summary24hHtml = "";
    if (isAqiAvailable && st.has24hStats && st.stats24h) {
      const { change, min, max, trend } = st.stats24h;
      const changeNum = Number(change);
      const isNum = Number.isFinite(changeNum);
      const changeSign = isNum && changeNum > 0 ? "+" : "";
      const changeColor = !isNum ? "#475569" : changeNum > 0 ? "#ef4444" : changeNum < 0 ? "#10b981" : "#64748b";
      const trendColor = trend === "Rising" ? "#ef4444" : trend === "Falling" ? "#10b981" : "#64748b";

      summary24hHtml = `
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; margin: 14px 0; border-collapse: separate;">
          <tr>
            <td width="25%" align="center" style="padding: 10px 6px; border-right: 1px solid #e2e8f0;">
              <div style="font-size: 10px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;">24h Change</div>
              <div style="font-size: 15px; font-weight: 800; color: ${changeColor}; margin-top: 2px;">${isNum ? `${changeSign}${changeNum}` : "N/A"}</div>
            </td>
            <td width="25%" align="center" style="padding: 10px 6px; border-right: 1px solid #e2e8f0;">
              <div style="font-size: 10px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;">24h Min</div>
              <div style="font-size: 15px; font-weight: 800; color: #0f172a; margin-top: 2px;">${Number.isFinite(min) ? min : "N/A"}</div>
            </td>
            <td width="25%" align="center" style="padding: 10px 6px; border-right: 1px solid #e2e8f0;">
              <div style="font-size: 10px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;">24h Max</div>
              <div style="font-size: 15px; font-weight: 800; color: #0f172a; margin-top: 2px;">${Number.isFinite(max) ? max : "N/A"}</div>
            </td>
            <td width="25%" align="center" style="padding: 10px 6px;">
              <div style="font-size: 10px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;">Trend</div>
              <div style="font-size: 14px; font-weight: 800; color: ${trendColor}; margin-top: 2px;">${escapeHtml(trend || "Stable")}</div>
            </td>
          </tr>
        </table>
      `;
    }

    // Pollutant AQI Sub-Indices Table (No µg/m³ or mg/m³ units)
    const p = st.pollutants || {};
    const fmt = (v) => (v !== null && v !== undefined && !isNaN(Number(v)) ? Math.round(Number(v)) : "No data");
    const pollutantsRows = [
      { name: "PM2.5", label: "PM2.5 (Fine Particulate)", val: fmt(p["PM2.5"]) },
      { name: "PM10", label: "PM10 (Coarse Dust)", val: fmt(p["PM10"]) },
      { name: "NO2", label: "Nitrogen Dioxide (NO₂)", val: fmt(p["NO2"]) },
      { name: "SO2", label: "Sulphur Dioxide (SO₂)", val: fmt(p["SO2"]) },
      { name: "CO", label: "Carbon Monoxide (CO)", val: fmt(p["CO"]) },
      { name: "OZONE", label: "Ozone (O₃)", val: fmt(p["OZONE"]) }
    ];

    const pollutantTableHtml = `
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="font-size: 12px; margin-top: 10px; border-collapse: collapse; border: 1px solid #f1f5f9; border-radius: 6px;">
        <thead>
          <tr style="background-color: #f8fafc; color: #64748b; border-bottom: 1px solid #e2e8f0;">
            <th align="left" style="padding: 6px 10px; font-size: 11px; font-weight: 700; text-transform: uppercase;">Pollutant</th>
            <th align="right" style="padding: 6px 10px; font-size: 11px; font-weight: 700; text-transform: uppercase;">AQI Sub-Index</th>
          </tr>
        </thead>
        <tbody>
          ${pollutantsRows
            .map(
              (row, idx) => `
            <tr style="background-color: ${idx % 2 === 0 ? "#ffffff" : "#fbfcfe"}; border-bottom: 1px solid #f1f5f9;">
              <td style="padding: 6px 10px; color: #1e293b; font-weight: 600;">${escapeHtml(row.label)}</td>
              <td align="right" style="padding: 6px 10px; color: ${row.val === "No data" ? "#94a3b8" : "#0f172a"}; font-weight: 700; font-family: monospace;">${escapeHtml(row.val)}</td>
            </tr>
          `
            )
            .join("")}
        </tbody>
      </table>
    `;

    // Health Advice list
    const recs = isAqiAvailable && Array.isArray(st.recommendations) ? st.recommendations.slice(0, 4) : [];
    const adviceHtml = recs.length > 0 ? `
      <div style="margin-top: 14px;">
        <div style="font-size: 11px; font-weight: 700; color: #475569; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px;">
          Health & Safety Advisory
        </div>
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
          ${recs
            .map(
              (item) => `
            <tr>
              <td width="14" valign="top" style="padding: 4px 6px 4px 0;">
                <div style="width: 8px; height: 8px; border-radius: 50%; background-color: ${getAdviceSeverityColor(item.severity)}; margin-top: 5px;"></div>
              </td>
              <td valign="top" style="padding: 4px 0; font-size: 12px; color: #334155; line-height: 1.45;">
                <strong style="color: #0f172a;">${escapeHtml(item.group)}:</strong> ${escapeHtml(item.advice)}
              </td>
            </tr>
          `
            )
            .join("")}
        </table>
      </div>
    ` : "";

    const aqiBadgeHtml = isAqiAvailable
      ? `
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="background-color: ${cpcb.bg}; border-radius: 10px; border: 1px solid ${cpcb.border};">
          <tr>
            <td align="center" style="padding: 8px 14px;">
              <div style="font-size: 26px; font-weight: 900; color: ${cpcb.text}; line-height: 1;">
                ${aqiDisplay}
              </div>
              <div style="font-size: 10px; font-weight: 700; color: ${cpcb.text}; text-transform: uppercase; margin-top: 2px; letter-spacing: 0.5px;">
                ${categoryDisplay}
              </div>
            </td>
          </tr>
        </table>
      `
      : `
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="background-color: #f1f5f9; border-radius: 10px; border: 1px solid #cbd5e1;">
          <tr>
            <td align="center" style="padding: 8px 12px;">
              <div style="font-size: 11px; font-weight: 700; color: #475569; text-transform: uppercase; letter-spacing: 0.5px;">
                AQI unavailable (insufficient data)
              </div>
            </td>
          </tr>
        </table>
      `;

    return `
      <!-- Station Card -->
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 14px; margin-bottom: 20px; box-shadow: 0 2px 8px rgba(15, 23, 42, 0.04); overflow: hidden;">
        <!-- Card Header with Station & AQI Badge -->
        <tr>
          <td style="padding: 18px 20px 14px; border-bottom: 1px solid #f1f5f9;">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
              <tr>
                <td valign="middle">
                  <div style="font-size: 18px; font-weight: 800; color: #0f172a; line-height: 1.2;">
                    ${city}
                  </div>
                  <div style="font-size: 13px; color: #64748b; margin-top: 2px;">
                    ${stationName}${state ? `, ${state}` : ""}
                  </div>
                </td>
                <td align="right" valign="middle" style="padding-left: 14px;">
                  ${aqiBadgeHtml}
                </td>
              </tr>
            </table>
            
            <div style="margin-top: 10px; font-size: 12px; color: #64748b;">
              <span style="display: inline-block; background-color: #f1f5f9; padding: 2px 8px; border-radius: 6px; font-weight: 600; color: #334155;">
                Dominant: <strong style="color: #0f172a;">${dominantDisplay}</strong>
              </span>
              <span style="margin-left: 8px; font-size: 11px; color: #94a3b8;">
                Updated: ${lastUpdateDisplay}
              </span>
            </div>
          </td>
        </tr>

        <!-- Card Body -->
        <tr>
          <td style="padding: 16px 20px 18px;">
            ${summary24hHtml}

            <div style="font-size: 11px; font-weight: 700; color: #475569; text-transform: uppercase; letter-spacing: 0.5px; margin-top: 8px;">
              Pollutant AQI Sub-Indices
            </div>
            ${pollutantTableHtml}

            ${adviceHtml}
          </td>
        </tr>
      </table>
    `;
  }).join("");

  // Full HTML Document
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>AirLens Daily Air Quality Report</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; color: #0f172a;">
  <center style="width: 100%; background-color: #f1f5f9; padding: 24px 0;">
    <!-- Container Table 600px -->
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width: 600px; margin: 0 auto; background-color: transparent;">
      
      <!-- Brand Header -->
      <tr>
        <td style="padding: 0 0 16px 0;">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #0f172a; border-radius: 14px; overflow: hidden; box-shadow: 0 4px 12px rgba(15, 23, 42, 0.15);">
            <tr>
              <td style="padding: 24px 24px 20px; background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);">
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                  <tr>
                    <td>
                      <div style="font-size: 22px; font-weight: 900; color: #38bdf8; letter-spacing: -0.5px;">
                        AirLens
                      </div>
                      <div style="font-size: 13px; color: #94a3b8; margin-top: 4px;">
                        Daily Air Quality Morning Report
                      </div>
                    </td>
                    <td align="right" valign="top">
                      <div style="display: inline-block; background-color: rgba(56, 189, 248, 0.15); border: 1px solid rgba(56, 189, 248, 0.3); padding: 4px 10px; border-radius: 20px; font-size: 11px; font-weight: 700; color: #38bdf8;">
                        08:00 AM IST
                      </div>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </td>
      </tr>

      <!-- Subtitle & Stations Count -->
      <tr>
        <td style="padding: 4px 6px 14px;">
          <div style="font-size: 12px; color: #64748b;">
            Reporting for <strong style="color: #0f172a;">${safeEmail}</strong> &bull; Monitoring ${stations.length} station${stations.length > 1 ? "s" : ""}
          </div>
        </td>
      </tr>

      <!-- Stations Cards -->
      <tr>
        <td>
          ${stationCardsHtml}
        </td>
      </tr>

      <!-- Footer -->
      <tr>
        <td style="padding: 10px 16px 30px; text-align: center;">
          <div style="font-size: 11px; color: #94a3b8; line-height: 1.6;">
            Data comes directly from <strong>CPCB (Central Pollution Control Board)</strong> via <strong>data.gov.in</strong>.<br>
            AQI calculated strictly according to Indian CPCB standards.<br>
            To update your monitoring preferences or unsubscribe, please visit the <strong>Alerts</strong> page in AirLens.
          </div>
          <div style="margin-top: 10px; font-size: 11px; color: #cbd5e1;">
            AirLens Environmental Intelligence Network &bull; Asia/Kolkata
          </div>
        </td>
      </tr>

    </table>
  </center>
</body>
</html>
  `.trim();

  // Plain-Text Version (No units)
  const textParts = [
    "==================================================",
    "AirLens - Daily Air Quality Report",
    `Delivered to: ${email}`,
    `Date: ${formattedToday}`,
    "==================================================\n"
  ];

  stations.forEach((st, idx) => {
    const isAqiAvailable = typeof st.aqi === "number" && st.aqi !== null;
    textParts.push(`[${idx + 1}] ${st.city} - ${st.stationName}`);
    textParts.push(`Current AQI: ${isAqiAvailable ? `${st.aqi} (${st.category})` : "AQI unavailable (insufficient data)"}`);
    textParts.push(`Dominant Pollutant: ${isAqiAvailable ? (st.dominantPollutant || "Unavailable") : "Unavailable"}`);
    textParts.push(`Last Updated: ${formatISTDate(st.lastUpdate)}`);

    if (isAqiAvailable && st.has24hStats && st.stats24h) {
      const { change, min, max, trend } = st.stats24h;
      textParts.push(`24h Summary: Change ${change > 0 ? "+" : ""}${change} | Min ${min} | Max ${max} | Trend ${trend}`);
    }

    const p = st.pollutants || {};
    textParts.push("Pollutant AQI Sub-Indices:");
    textParts.push(`• PM2.5: ${p["PM2.5"] !== null && p["PM2.5"] !== undefined ? Math.round(Number(p["PM2.5"])) : "No data"}`);
    textParts.push(`• PM10: ${p["PM10"] !== null && p["PM10"] !== undefined ? Math.round(Number(p["PM10"])) : "No data"}`);
    textParts.push(`• NO₂: ${p["NO2"] !== null && p["NO2"] !== undefined ? Math.round(Number(p["NO2"])) : "No data"}`);
    textParts.push(`• SO₂: ${p["SO2"] !== null && p["SO2"] !== undefined ? Math.round(Number(p["SO2"])) : "No data"}`);
    textParts.push(`• CO: ${p["CO"] !== null && p["CO"] !== undefined ? Math.round(Number(p["CO"])) : "No data"}`);
    textParts.push(`• Ozone: ${p["OZONE"] !== null && p["OZONE"] !== undefined ? Math.round(Number(p["OZONE"])) : "No data"}`);

    if (isAqiAvailable && Array.isArray(st.recommendations) && st.recommendations.length > 0) {
      textParts.push("Health Advisory:");
      st.recommendations.slice(0, 3).forEach((r) => {
        textParts.push(`• ${r.group}: ${r.advice}`);
      });
    }

    textParts.push("--------------------------------------------------\n");
  });

  textParts.push("Data comes from CPCB via data.gov.in.");
  textParts.push("You can unsubscribe anytime on the Alerts page.");

  const subject = `AirLens Daily Air Quality Report - ${dateStr || "Today"}`;

  return { html, text: textParts.join("\n"), subject };
}

/**
 * Build Spike Alert Email (HTML & Plain Text)
 */
function buildSpikeAlertEmail({ email, spikes }) {
  const safeEmail = escapeHtml(email);
  const totalSpikes = spikes.length;
  const displayedSpikes = spikes.slice(0, 10);
  const remainingCount = totalSpikes > 10 ? totalSpikes - 10 : 0;

  const spikeItemsHtml = displayedSpikes.map((spike) => {
    const stationName = escapeHtml(spike.station_name || "Station");
    const city = escapeHtml(spike.city || "City");
    const state = escapeHtml(spike.state || "");
    const pollutant = escapeHtml(spike.pollutant_id || "Pollutant");
    const prevVal = Number(spike.previous_value).toFixed(1);
    const currVal = Number(spike.current_value).toFixed(1);
    const pctRise = Number(spike.change_percentage).toFixed(1);
    const detectedAt = formatISTDate(spike.detected_at);
    const message = escapeHtml(spike.message || `${pollutant} AQI rose from ${prevVal} to ${currVal}`);

    return `
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #ffffff; border: 1px solid #fed7aa; border-left: 4px solid #ea580c; border-radius: 10px; margin-bottom: 14px; box-shadow: 0 2px 6px rgba(234, 88, 12, 0.06);">
        <tr>
          <td style="padding: 14px 16px;">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
              <tr>
                <td>
                  <div style="font-size: 16px; font-weight: 800; color: #0f172a;">
                    ${city} <span style="font-size: 13px; font-weight: 500; color: #64748b;">(${stationName}${state ? `, ${state}` : ""})</span>
                  </div>
                </td>
                <td align="right" valign="top">
                  <div style="display: inline-block; background-color: #ffedd5; color: #9a3412; font-size: 13px; font-weight: 800; padding: 4px 10px; border-radius: 6px; border: 1px solid #fdba74;">
                    +${pctRise}% RISE
                  </div>
                </td>
              </tr>
            </table>

            <div style="margin-top: 10px; font-size: 13px; color: #1e293b;">
              <strong>${pollutant}</strong> AQI rose from <span style="color: #64748b;">${prevVal}</span> to <span style="font-weight: 700; color: #ea580c;">${currVal}</span>
            </div>

            <div style="margin-top: 6px; font-size: 12px; color: #475569; line-height: 1.4;">
              ${message}
            </div>

            <div style="margin-top: 8px; font-size: 11px; color: #94a3b8;">
              Detected: ${detectedAt}
            </div>
          </td>
        </tr>
      </table>
    `;
  }).join("");

  const moreNoticeHtml = remainingCount > 0 ? `
    <div style="text-align: center; padding: 12px; background-color: #fff7ed; border: 1px dashed #fdba74; border-radius: 8px; font-size: 13px; font-weight: 700; color: #c2410c; margin-bottom: 16px;">
      ... and ${remainingCount} more sudden spike${remainingCount > 1 ? "s" : ""} detected across your monitored stations.
    </div>
  ` : "";

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>AirLens Pollution Spike Alert</title>
</head>
<body style="margin: 0; padding: 0; background-color: #fff7ed; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #0f172a;">
  <center style="width: 100%; background-color: #fff7ed; padding: 24px 0;">
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width: 600px; margin: 0 auto;">
      
      <!-- Red/Orange Alert Header -->
      <tr>
        <td style="padding: 0 0 16px 0;">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background: linear-gradient(135deg, #b91c1c 0%, #ea580c 100%); border-radius: 14px; overflow: hidden; box-shadow: 0 4px 14px rgba(185, 28, 28, 0.25);">
            <tr>
              <td style="padding: 22px 24px;">
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                  <tr>
                    <td>
                      <div style="font-size: 12px; font-weight: 800; color: #fef08a; text-transform: uppercase; letter-spacing: 1px;">
                        ⚠️ CRITICAL POLLUTION INCIDENT
                      </div>
                      <div style="font-size: 22px; font-weight: 900; color: #ffffff; margin-top: 4px;">
                        AirLens AQI Spike Alert
                      </div>
                      <div style="font-size: 13px; color: #ffedd5; margin-top: 4px;">
                        ${totalSpikes} sudden pollution spike${totalSpikes > 1 ? "s" : ""} detected in your stations (&ge;75% rise)
                      </div>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </td>
      </tr>

      <!-- Recipient line -->
      <tr>
        <td style="padding: 2px 6px 12px;">
          <div style="font-size: 12px; color: #7c2d12;">
            Notification for: <strong>${safeEmail}</strong>
          </div>
        </td>
      </tr>

      <!-- Spikes List -->
      <tr>
        <td>
          ${spikeItemsHtml}
          ${moreNoticeHtml}
        </td>
      </tr>

      <!-- Footer -->
      <tr>
        <td style="padding: 10px 16px 30px; text-align: center;">
          <div style="font-size: 11px; color: #9a3412; line-height: 1.6;">
            Data comes from <strong>CPCB</strong> via <strong>data.gov.in</strong>.<br>
            To manage alerts or unsubscribe, visit the <strong>Alerts</strong> page on AirLens.
          </div>
        </td>
      </tr>

    </table>
  </center>
</body>
</html>
  `.trim();

  // Plain-Text Version (No units)
  const textParts = [
    "==================================================",
    "AirLens - AQI Spike Alert",
    `${totalSpikes} sudden pollution spike(s) in your stations`,
    `Delivered to: ${email}`,
    "==================================================\n"
  ];

  displayedSpikes.forEach((spike, idx) => {
    const prevVal = Number(spike.previous_value).toFixed(1);
    const currVal = Number(spike.current_value).toFixed(1);
    const pctRise = Number(spike.change_percentage).toFixed(1);

    textParts.push(`[${idx + 1}] ${spike.city} (${spike.station_name})`);
    textParts.push(`• Pollutant: ${spike.pollutant_id}`);
    textParts.push(`• Change: ${prevVal} -> ${currVal} (+${pctRise}%)`);
    textParts.push(`• Detected: ${formatISTDate(spike.detected_at)}`);
    if (spike.message) {
      textParts.push(`• Advisory: ${spike.message}`);
    }
    textParts.push("--------------------------------------------------\n");
  });

  if (remainingCount > 0) {
    textParts.push(`... and ${remainingCount} more spikes detected.\n`);
  }

  textParts.push("Data comes from CPCB via data.gov.in.");
  textParts.push("You can unsubscribe on the Alerts page.");

  const subject = `AQI Spike Alert: ${totalSpikes} sudden pollution spike(s) in your stations`;

  return { html, text: textParts.join("\n"), subject };
}

module.exports = {
  escapeHtml,
  getCpcbStyle,
  getAdviceSeverityColor,
  formatISTDate,
  buildDailyReportEmail,
  buildSpikeAlertEmail
};
