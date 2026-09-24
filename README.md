# Madurai Building Explorer — Web GIS Application

This is my submission for the GIS Development assessment — a simple web GIS
app built with Leaflet.js on an OpenStreetMap base map, plus a Python script
for the geoprocessing task.

## What it does

- Shows an OpenStreetMap base map
- Loads a building GeoJSON (`data/buildings.geojson`) — 12 sample buildings
  around Madurai, each with a name, building type, and floor count
- Click on any building to see its attributes, both in a map popup and in
  the sidebar
- Checkbox to turn the buildings layer on/off
- "Zoom to layer" button to fit the map to the data
- A dropdown to colour buildings by type or by floor count, with a legend
  that updates to match
- Shows the total number of features loaded

## Project structure

```
webgis/
├── index.html
├── style.css
├── app.js
├── process_geojson.py
├── data/
│   ├── buildings.geojson             (input data)
│   └── processed_buildings.geojson   (output of process_geojson.py)
└── README.md
```

## How to run it

One thing that catches people out: Leaflet fetches the GeoJSON file over
`fetch()`, and browsers block that on `file://` (that's just how CORS
works), so opening `index.html` by double-clicking it won't load the data.
It needs to be served from a local web server. Easiest way:

```bash
cd webgis
python3 -m http.server 8000
```

Then open `http://localhost:8000` in a browser.

If you'd rather not use the terminal, the VS Code "Live Server" extension
works too — right-click `index.html` → "Open with Live Server".

No build step, no API keys — it's plain HTML/CSS/JS, and Leaflet is pulled
in from a CDN.

## The Python script — `process_geojson.py`

For the additional task, this reads a GeoJSON (or shapefile), reprojects it
to the appropriate UTM zone so area/length come out in real metres instead
of degrees, calculates area for polygons or length for lines, and writes
the result back out as GeoJSON.

Needs:
```bash
pip install geopandas shapely pyproj
```

Run it like:
```bash
python process_geojson.py data/buildings.geojson data/processed_buildings.geojson
```

Sample output:
```
Loaded 12 features from data/buildings.geojson (CRS: EPSG:4326)
Reprojected to EPSG:32644 for measurement
Calculated polygon area (area_sqm, area_sqkm)
Processed data written to data/processed_buildings.geojson
Total area: 80431.70 sqm (0.0807 sqkm) across 12 features
```

`data/processed_buildings.geojson` is already the output of this run — I've
included it as the processed data deliverable.

## A note on the data

The assessment mentions a building/road GeoJSON would be provided, but I
didn't receive a file with it, so I put together a small sample dataset
(12 buildings around Madurai) to build and test the app end to end. If a
real dataset comes through, swapping it in is a one-line change —
`GEOJSON_URL` in `app.js` — everything else reads attributes dynamically,
so the rest of the app doesn't need to change.
