"""
process_geojson.py
-------------------
Simple GIS processing script for the assessment's "Additional Task".

What it does:
  1. Reads a GeoJSON or Shapefile (polygons or lines).
  2. Reprojects to an appropriate UTM zone so area/length are in metres,
     not degrees (the input is assumed to be in WGS84 / EPSG:4326).
  3. Calculates:
       - area_sqm / area_sqkm   for polygon features
       - length_m / length_km   for line features
  4. Exports the processed data (original attributes + new fields) as GeoJSON.

Usage:
    python process_geojson.py data/buildings.geojson processed_buildings.geojson

Requirements:
    pip install geopandas shapely pyproj
"""

import sys
import geopandas as gpd


def get_utm_crs(gdf):
    """Pick a suitable UTM CRS automatically based on the data's location."""
    return gdf.estimate_utm_crs()


def process(input_path: str, output_path: str) -> None:
    gdf = gpd.read_file(input_path)

    if gdf.empty:
        raise ValueError("Input file has no features.")

    original_crs = gdf.crs
    print(f"Loaded {len(gdf)} features from {input_path} (CRS: {original_crs})")

    # Reproject to a metric UTM CRS for accurate measurements
    utm_crs = get_utm_crs(gdf)
    gdf_metric = gdf.to_crs(utm_crs)
    print(f"Reprojected to {utm_crs} for measurement")

    geom_type = gdf_metric.geom_type.iloc[0]

    if "Polygon" in geom_type:
        gdf["area_sqm"] = gdf_metric.geometry.area.round(2)
        gdf["area_sqkm"] = (gdf_metric.geometry.area / 1_000_000).round(4)
        print("Calculated polygon area (area_sqm, area_sqkm)")

    elif "LineString" in geom_type:
        gdf["length_m"] = gdf_metric.geometry.length.round(2)
        gdf["length_km"] = (gdf_metric.geometry.length / 1000).round(4)
        print("Calculated line length (length_m, length_km)")

    else:
        print(f"Geometry type '{geom_type}' not polygon or line — no measurement added.")

    # Export back in the original (geographic) CRS as GeoJSON
    gdf.to_crs(original_crs).to_file(output_path, driver="GeoJSON")
    print(f"Processed data written to {output_path}")

    # Quick summary
    if "area_sqm" in gdf.columns:
        print(f"Total area: {gdf['area_sqm'].sum():.2f} sqm "
              f"({gdf['area_sqkm'].sum():.4f} sqkm) across {len(gdf)} features")
    if "length_m" in gdf.columns:
        print(f"Total length: {gdf['length_m'].sum():.2f} m "
              f"({gdf['length_km'].sum():.4f} km) across {len(gdf)} features")


if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Usage: python process_geojson.py <input.geojson|input.shp> <output.geojson>")
        sys.exit(1)

    process(sys.argv[1], sys.argv[2])
