import logging
from datetime import datetime, timezone
from typing import Any, Dict, List, Tuple
from collections import defaultdict
import math

import numpy as np

# Set up logging for this module
logger = logging.getLogger(__name__)

# --- Constants for Risk Modeling and Data Processing ---

# Weights for the risk score calculation. These would be tuned based on historical data.
RISK_WEIGHTS = {
    "wind_speed": 0.4,
    "temperature": 0.3,
    "humidity": 0.2,
    "fuel_dryness": 0.1,
}

# Thresholds for various alert levels and risk calculations.
# Values are chosen to be representative for a California-like climate.
RISK_THRESHOLDS = {
    "wind_speed": {"high": 25, "critical": 40},  # mph
    "temperature": {"high": 32, "critical": 38},  # Celsius
    "humidity": {"high": 20, "critical": 15},  # Percent (lower is worse)
    "risk_score": {"high": 70, "critical": 85}, # Overall score out of 100
}

# Mock fuel model data. In a real system, this would come from a geospatial database (e.g., LANDFIRE).
# Key: A tuple representing a region; Value: a tuple of (fuel_model_name, dryness_factor)
MOCK_FUEL_DATABASE = {
    (39, -121): ("Chaparral", 1.2),
    (38, -122): ("Grassland", 0.8),
    (37, -120): ("Sierra Nevada Forest", 1.5),
}

class DataProcessor:
    """
    Processes raw collected data into a structured and enriched format suitable for
    consumption by the frontend and sophisticated quantum models.

    This class is the analytical core of the data pipeline, responsible for:
    - Cleaning and validating raw data.
    - Calculating composite risk scores.
    - Dynamically generating high-risk zones.
    - Producing context-aware system alerts.
    - Enriching data with simulated fuel models and interpolated values.
    """

    def __init__(self):
        """Initializes the DataProcessor with predefined configurations."""
        logger.info("DataProcessor initialized.")
        # The configurations are now defined as constants at the module level.
        self.risk_thresholds = RISK_THRESHOLDS
        self.risk_weights = RISK_WEIGHTS
        self.fuel_db = MOCK_FUEL_DATABASE

    # --- Primary Processing Method ---

    async def process(self, raw_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        The main processing pipeline. It orchestrates the validation, processing,
        analysis, and alert generation for a given set of raw data.

        Args:
            raw_data: A dictionary where keys are collector names (e.g., 'nasa_firms')
                      and values are the raw data they collected.

        Returns:
            A structured dictionary containing the fully processed and analyzed data,
            ready for API consumption.
        """
        start_time = datetime.now(timezone.utc)
        logger.info("Starting data processing pipeline...")

        # Initialize the structure for our final output
        processed_data = {
            "timestamp": start_time.isoformat(),
            "active_fires": [],
            "weather_stations": [],
            "high_risk_areas": [],
            "alerts": [],
            "current_conditions": {
                "avg_wind_speed": 0,
                "max_temp": 0,
                "avg_humidity": 100,
                "dominant_wind_direction": "N/A",
            },
        }

        # --- Step 1: Process and Validate Core Data Sources ---
        processed_data["active_fires"] = self._process_firms_data(
            raw_data.get("nasa_firms")
        )

        (
            processed_data["weather_stations"],
            processed_data["current_conditions"],
        ) = self._process_weather_data(raw_data.get("openmeteo_weather"))

        # --- Step 2: Risk Analysis and Zone Generation ---
        # Analyze the processed weather data to identify and generate high-risk zones.
        if processed_data["weather_stations"]:
            processed_data["high_risk_areas"] = self._generate_high_risk_zones(
                processed_data["weather_stations"]
            )

        # --- Step 3: Alert Generation ---
        # Generate alerts based on the complete, processed data picture.
        processed_data["alerts"] = self._generate_alerts(processed_data)

        end_time = datetime.now(timezone.utc)
        duration = (end_time - start_time).total_seconds()
        logger.info(f"Data processing pipeline completed in {duration:.4f}s")

        return processed_data

    # --- Data Cleaning and Formatting Methods ---

    def _process_firms_data(self, firms_data: List[Dict[str, Any]] | None) -> List[Dict[str, Any]]:
        """
        Cleans and validates raw fire data from NASA FIRMS.

        Args:
            firms_data: A list of fire incident dictionaries.

        Returns:
            A cleaned list of fire incidents.
        """
        if not firms_data:
            return []

        # Example of a cleaning step: filter out low-confidence fires
        high_confidence_fires = [
            fire for fire in firms_data if isinstance(fire.get("confidence"), (int, float)) and fire["confidence"] >= 60
        ]
        logger.info(f"Filtered FIRMS data from {len(firms_data)} to {len(high_confidence_fires)} high-confidence incidents.")
        return high_confidence_fires

    def _process_weather_data(self, weather_data: Dict[str, Any] | None) -> Tuple[List[Dict[str, Any]], Dict[str, Any]]:
        """
        Processes and enriches raw weather data, calculates overall conditions,
        and computes risk scores for each station.

        Args:
            weather_data: Raw data from the weather collector.

        Returns:
            A tuple containing:
            - A list of processed weather station dictionaries.
            - A dictionary of overall current conditions.
        """
        if not weather_data or "latitude" not in weather_data or not weather_data["latitude"]:
            return [], {"avg_wind_speed": 0, "max_temp": 0, "avg_humidity": 100, "dominant_wind_direction": "N/A"}

        stations = []
        wind_speeds, temperatures, humidities, wind_directions = [], [], [], []
        num_stations = len(weather_data["latitude"])

        for i in range(num_stations):
            # --- Data Enrichment ---
            lat, lon = weather_data["latitude"][i], weather_data["longitude"][i]
            fuel_model, fuel_dryness = self._get_mock_fuel_model(lat, lon)

            # --- Risk Score Calculation ---
            risk_score = self._calculate_risk_score(
                wind_speed=weather_data["wind_speed_10m"][i],
                temperature=weather_data["temperature_2m"][i],
                humidity=weather_data["relative_humidity_2m"][i],
                fuel_dryness=fuel_dryness,
            )

            station_data = {
                "id": f"station_{i}_{lat:.2f}_{lon:.2f}",
                "latitude": lat,
                "longitude": lon,
                "temperature": round(weather_data["temperature_2m"][i], 1),
                "humidity": round(weather_data["relative_humidity_2m"][i], 1),
                "wind_speed": round(weather_data["wind_speed_10m"][i], 1),
                "wind_direction": self._degrees_to_cardinal(weather_data["wind_direction_10m"][i]),
                "fuel_model": fuel_model,
                "risk_score": round(risk_score),
            }
            stations.append(station_data)

            # Collect data for aggregate calculations
            wind_speeds.append(station_data["wind_speed"])
            temperatures.append(station_data["temperature"])
            humidities.append(station_data["humidity"])
            wind_directions.append(station_data["wind_direction"])

        # Calculate overall conditions
        current_conditions = {
            "avg_wind_speed": round(np.mean(wind_speeds), 1) if wind_speeds else 0,
            "max_temp": round(np.max(temperatures), 1) if temperatures else 0,
            "avg_humidity": round(np.mean(humidities), 1) if humidities else 100,
            "dominant_wind_direction": max(set(wind_directions), key=wind_directions.count) if wind_directions else "N/A",
        }

        return stations, current_conditions

    # --- Risk Analysis and Zone Generation ---

    def _calculate_risk_score(
        self, wind_speed: float, temperature: float, humidity: float, fuel_dryness: float
    ) -> float:
        """
        Calculates a normalized risk score (0-100) based on weighted inputs.

        This function normalizes each input parameter to a 0-1 scale before applying weights.
        Higher wind/temp contribute positively; higher humidity contributes negatively.

        Returns:
            A composite risk score from 0 to 100.
        """
        # Normalize each parameter to a 0-1 scale based on plausible ranges
        wind_norm = min(wind_speed / 60, 1.0)  # Max plausible wind 60 mph
        temp_norm = min(temperature / 45, 1.0)  # Max plausible temp 45 C
        humidity_norm = max(1 - (humidity / 100), 0)  # Inverted: low humidity = high score
        fuel_norm = min(fuel_dryness / 2.0, 1.0) # Max plausible dryness factor 2.0

        # Apply weights
        score = (
            wind_norm * self.risk_weights["wind_speed"] +
            temp_norm * self.risk_weights["temperature"] +
            humidity_norm * self.risk_weights["humidity"] +
            fuel_norm * self.risk_weights["fuel_dryness"]
        )

        # Scale to 0-100
        return min(score * 100, 100)

    def _generate_high_risk_zones(self, stations: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Identifies clusters of high-risk stations and generates polygon zones around them.

        This uses a simple clustering algorithm to group nearby high-risk stations.

        Returns:
            A list of high-risk area dictionaries, including a GeoJSON-like polygon.
        """
        high_risk_stations = [
            s for s in stations if s["risk_score"] >= self.risk_thresholds["risk_score"]["high"]
        ]
        if not high_risk_stations:
            return []

        # Simple clustering: group stations that are close to each other
        clusters = self._cluster_stations(high_risk_stations, distance_threshold=50) # 50 km

        risk_zones = []
        for i, cluster in enumerate(clusters):
            if not cluster:
                continue

            # Create a bounding box polygon around the cluster
            lats = [s["latitude"] for s in cluster]
            lons = [s["longitude"] for s in cluster]

            buffer = 0.1 # Add a small buffer in degrees
            min_lon, max_lon = min(lons) - buffer, max(lons) + buffer
            min_lat, max_lat = min(lats) - buffer, max(lats) + buffer

            polygon = [
                [min_lon, min_lat],
                [max_lon, min_lat],
                [max_lon, max_lat],
                [min_lon, max_lat],
                [min_lon, min_lat], # Close the polygon
            ]

            avg_risk = np.mean([s['risk_score'] for s in cluster])

            risk_zones.append({
                "id": f"risk_zone_{i}_{datetime.now().timestamp()}",
                "name": f"High Risk Zone {chr(65+i)}",
                "risk_level": round(avg_risk / 100, 2), # Normalize to 0-1
                "cause": "Extreme Weather & Fuel Conditions",
                "polygon": polygon,
                "centroid": self._get_centroid(cluster)
            })

        return risk_zones

    # --- Alert Generation ---

    def _generate_alerts(self, data: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Generates a list of context-aware alerts based on the processed data.

        Returns:
            A list of alert dictionaries.
        """
        alerts = []
        now = datetime.now(timezone.utc).isoformat()
        conditions = data["current_conditions"]

        # Alert 1: Critical Fire Count
        if len(data["active_fires"]) > 10:
            alerts.append({
                "id": f"alert_fire_count_{now}",
                "title": "High Number of Active Fires",
                "message": f"{len(data['active_fires'])} active fires detected. Monitor for potential mergers.",
                "severity": "high",
                "timestamp": now,
            })

        # Alert 2: Extreme Wind Advisory
        if conditions["avg_wind_speed"] > self.risk_thresholds["wind_speed"]["critical"]:
            alerts.append({
                "id": f"alert_wind_{now}",
                "title": "Extreme Wind Advisory",
                "message": f"Average wind speeds of {conditions['avg_wind_speed']} mph detected. Expect rapid fire spread.",
                "severity": "critical",
                "timestamp": now,
            })

        # Alert 3: Critical Risk Zone Detected
        for zone in data["high_risk_areas"]:
            if zone["risk_level"] * 100 > self.risk_thresholds["risk_score"]["critical"]:
                alerts.append({
                    "id": f"alert_zone_{zone['id']}",
                    "title": f"Critical Fire Potential in Zone {zone['name']}",
                    "message": f"A confluence of critical weather and fuel conditions has been detected.",
                    "severity": "critical",
                    "timestamp": now,
                    "location": { "name": zone["name"], **zone["centroid"] }
                })

        # Sort alerts by severity
        severity_map = {"critical": 0, "high": 1, "moderate": 2}
        alerts.sort(key=lambda x: severity_map.get(x["severity"], 99))

        return alerts

    # --- Geospatial and Data Utilities ---

    def _get_mock_fuel_model(self, lat: float, lon: float) -> Tuple[str, float]:
        """
        Simulates looking up fuel model data from a database based on coordinates.
        Finds the closest region in the mock database.
        """
        # Find the closest matching key in our simple database
        closest_key = min(
            self.fuel_db.keys(),
            key=lambda k: self._haversine_distance(lat, lon, k[0], k[1])
        )
        return self.fuel_db[closest_key]

    def _degrees_to_cardinal(self, d: float) -> str:
        """Converts wind direction in degrees to a cardinal direction string."""
        dirs = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW']
        ix = int(round(d / (360. / len(dirs))))
        return dirs[ix % len(dirs)]

    def _haversine_distance(self, lat1: float, lon1: float, lat2: float, lon2: float) -> float:
        """Calculate the great-circle distance between two points on the earth (in km)."""
        R = 6371  # Radius of earth in kilometers
        dLat = math.radians(lat2 - lat1)
        dLon = math.radians(lon2 - lon1)
        a = (math.sin(dLat / 2) * math.sin(dLat / 2) +
             math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) *
             math.sin(dLon / 2) * math.sin(dLon / 2))
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
        distance = R * c
        return distance

    def _cluster_stations(self, stations: List[Dict], distance_threshold: float) -> List[List[Dict]]:
        """A simple greedy algorithm to cluster stations by distance."""
        if not stations:
            return []

        clusters = []
        unassigned_stations = list(stations)

        while unassigned_stations:
            current_cluster = []
            # Start a new cluster with an arbitrary station
            seed_station = unassigned_stations.pop(0)
            current_cluster.append(seed_station)

            # Find all stations close to any station already in the current cluster
            i = 0
            while i < len(current_cluster):
                anchor_station = current_cluster[i]
                remaining_unassigned = []
                for other_station in unassigned_stations:
                    dist = self._haversine_distance(
                        anchor_station['latitude'], anchor_station['longitude'],
                        other_station['latitude'], other_station['longitude']
                    )
                    if dist <= distance_threshold:
                        current_cluster.append(other_station)
                    else:
                        remaining_unassigned.append(other_station)
                unassigned_stations = remaining_unassigned
                i += 1

            clusters.append(current_cluster)

        return clusters

    def _get_centroid(self, stations: List[Dict]) -> Dict[str, float]:
        """Calculates the geometric center of a list of stations."""
        if not stations:
            return {"latitude": 0, "longitude": 0}

        avg_lat = np.mean([s['latitude'] for s in stations])
        avg_lon = np.mean([s['longitude'] for s in stations])
        return {"latitude": round(avg_lat, 4), "longitude": round(avg_lon, 4)}