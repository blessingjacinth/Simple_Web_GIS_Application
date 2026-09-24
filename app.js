// ---------------------------------------------------------
// Simple Web GIS Application
// Basemap: OpenStreetMap  |  Library: Leaflet.js
// ---------------------------------------------------------

const GEOJSON_URL = "data/buildings.geojson";

// 1. Base map -----------------------------------------------------------
const map = L.map("map").setView([9.925, 78.119], 12);

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 19,
  attribution: "&copy; OpenStreetMap contributors"
}).addTo(map);

// 2. Colour palettes ------------------------------------------------------
const TYPE_COLORS = {
  Residential: "#2dd4bf",
  Commercial: "#f59e0b",
  Institutional: "#818cf8"
};

function floorColor(floors) {
  if (floors <= 1) return "#93c5fd";
  if (floors <= 3) return "#3b82f6";
  if (floors <= 5) return "#1d4ed8";
  return "#1e3a8a";
}

function getColor(feature, mode) {
  const p = feature.properties;
  if (mode === "building_type") return TYPE_COLORS[p.building_type] || "#64748b";
  if (mode === "floors") return floorColor(p.floors);
  return "#2dd4bf"; // single colour fallback
}

// 3. State ----------------------------------------------------------------
let buildingsLayer = null;
let geojsonData = null;
let colorMode = "building_type";

// 4. Load data --------------------------------------------------------------
fetch(GEOJSON_URL)
  .then((res) => {
    if (!res.ok) throw new Error("Could not load " + GEOJSON_URL);
    return res.json();
  })
  .then((data) => {
    geojsonData = data;
    buildingsLayer = buildLayer(data);
    buildingsLayer.addTo(map);
    map.fitBounds(buildingsLayer.getBounds(), { padding: [30, 30] });
    document.getElementById("feature-count").textContent = data.features.length;
    buildLegend();
  })
  .catch((err) => {
    document.getElementById("attribute-table").innerHTML =
      `<p class="muted">Error loading data: ${err.message}. Serve this folder with a local web server (see README).</p>`;
  });

// 5. Build the Leaflet GeoJSON layer -------------------------------------
function buildLayer(data) {
  return L.geoJSON(data, {
    style: (feature) => ({
      color: "#0f1720",
      weight: 1,
      fillColor: getColor(feature, colorMode),
      fillOpacity: 0.75
    }),
    onEachFeature: (feature, layer) => {
      layer.on("click", () => showAttributes(feature));
      layer.bindPopup(popupHTML(feature));
    }
  });
}

function popupHTML(feature) {
  const p = feature.properties;
  return `<strong>${p.name}</strong><br/>Type: ${p.building_type}<br/>Floors: ${p.floors}`;
}

function showAttributes(feature) {
  const p = feature.properties;
  const rows = Object.entries(p)
    .map(([k, v]) => `<tr><td>${k}</td><td>${v}</td></tr>`)
    .join("");
  document.getElementById("attribute-table").innerHTML = `<table>${rows}</table>`;
}

// 6. Layer on/off toggle ----------------------------------------------------
document.getElementById("toggle-buildings").addEventListener("change", (e) => {
  if (!buildingsLayer) return;
  if (e.target.checked) {
    map.addLayer(buildingsLayer);
  } else {
    map.removeLayer(buildingsLayer);
  }
});

// 7. Zoom to layer ------------------------------------------------------------
document.getElementById("zoom-to-layer").addEventListener("click", () => {
  if (buildingsLayer) map.fitBounds(buildingsLayer.getBounds(), { padding: [30, 30] });
});

// 8. Colour-by-attribute control -----------------------------------------------
document.getElementById("color-attribute").addEventListener("change", (e) => {
  colorMode = e.target.value;
  if (buildingsLayer) {
    buildingsLayer.eachLayer((layer) => {
      layer.setStyle({ fillColor: getColor(layer.feature, colorMode) });
    });
  }
  buildLegend();
});

// 9. Legend -----------------------------------------------------------------------
function buildLegend() {
  const el = document.getElementById("legend");
  el.innerHTML = "";

  if (colorMode === "building_type") {
    Object.entries(TYPE_COLORS).forEach(([label, color]) => {
      el.innerHTML += `<div class="legend-row"><span class="legend-swatch" style="background:${color}"></span>${label}</div>`;
    });
  } else if (colorMode === "floors") {
    const bands = [
      ["1 floor", "#93c5fd"],
      ["2-3 floors", "#3b82f6"],
      ["4-5 floors", "#1d4ed8"],
      ["6+ floors", "#1e3a8a"]
    ];
    bands.forEach(([label, color]) => {
      el.innerHTML += `<div class="legend-row"><span class="legend-swatch" style="background:${color}"></span>${label}</div>`;
    });
  } else {
    el.innerHTML = `<div class="legend-row"><span class="legend-swatch" style="background:#2dd4bf"></span>All buildings</div>`;
  }
}
