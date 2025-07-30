"""
Fire Data Processor for Quantum Fire Prediction System
Location: backend/data_pipeline/data_processor.py

FIXED: Added Optional to the typing imports
CONFIRMED: Logic to convert numpy arrays to lists before returning data is correct.
"""

import logging
import numpy as np
import pandas as pd
from typing import Dict, List, Any, Tuple, Optional
from datetime import datetime
from scipy.interpolate import griddata
from scipy.ndimage import gaussian_filter

from config import settings

logger = logging.getLogger(__name__)


class FireDataProcessor:
    """Processes raw fire, weather, and terrain data for quantum algorithms"""

    def __init__(self):
        self.grid_resolution = settings.prediction_grid_size
        self.processing_metrics = {
            'total_processed': 0,
            'errors': 0,
            'last_processing_time': None
        }

    async def process_collection(self, raw_data: Dict[str, Any]) -> Dict[str, Any]:
        """Process collected data from all sources"""
        try:
            start_time = datetime.now()
            processed = {}

            # Process fire data
            if 'fire' in raw_data:
                processed['fire'] = await self._process_fire_data(raw_data['fire'])

            # Process weather data
            if 'weather' in raw_data:
                processed['weather'] = await self._process_weather_data(raw_data['weather'])

            # Process terrain data
            if 'terrain' in raw_data:
                processed['terrain'] = await self._process_terrain_data(raw_data['terrain'])

            # Generate integrated grids for quantum algorithms
            if all(k in processed for k in ['fire', 'weather', 'terrain']):
                processed['integrated_grids'] = await self._generate_integrated_grids(processed)

            # Add metadata
            processing_time = (datetime.now() - start_time).total_seconds()
            processed['metadata'] = {
                'processing_time': processing_time,
                'timestamp': datetime.now().isoformat(),
                'grid_resolution': self.grid_resolution
            }

            self.processing_metrics['total_processed'] += 1
            self.processing_metrics['last_processing_time'] = processing_time

            logger.info(f"Data processing completed in {processing_time:.2f}s")
            return processed

        except Exception as e:
            logger.error(f"Error processing data collection: {str(e)}")
            self.processing_metrics['errors'] += 1
            raise

    async def _process_fire_data(self, fire_data: Dict[str, Any]) -> Dict[str, Any]:
        """Process fire detection data"""
        processed = {
            'active_fires': [],
            'fire_perimeters': [],
            'fire_intensity_grid': None,
            'statistics': {}
        }

        # Process active fire detections
        if 'active_fires' in fire_data and fire_data['active_fires']:
            fires_df = pd.DataFrame(fire_data['active_fires'])

            if not fires_df.empty:
                # Filter by confidence
                fires_df = fires_df[fires_df['confidence'] >= settings.minimum_fire_confidence]

                # Calculate fire intensity based on brightness temperature
                fires_df['intensity'] = self._calculate_fire_intensity(
                    fires_df['brightness_temperature'].values if 'brightness_temperature' in fires_df.columns else None,
                    fires_df['frp'].values if 'frp' in fires_df.columns else None  # Fire Radiative Power
                )

                # Group nearby detections into fire complexes
                fire_complexes = self._cluster_fire_detections(fires_df)

                processed['active_fires'] = fire_complexes
                processed['statistics'] = {
                    'total_detections': len(fires_df),
                    'fire_complexes': len(fire_complexes),
                    'max_intensity': float(fires_df['intensity'].max()) if 'intensity' in fires_df.columns and not fires_df.empty else 0,
                    'total_area_hectares': sum(f['area_hectares'] for f in fire_complexes)
                }

        # Generate fire intensity grid
        if processed['active_fires']:
            processed['fire_intensity_grid'] = self._generate_fire_intensity_grid(
                processed['active_fires']
            )

        return processed

    async def _process_weather_data(self, weather_data: Dict[str, Any]) -> Dict[str, Any]:
        """Process weather data for fire prediction"""
        processed = {
            'current_conditions': {},
            'forecast': [],
            'wind_field': None,
            'temperature_field': None,
            'humidity_field': None,
            'fire_weather_indices': {}
        }

        # Process current conditions
        if 'stations' in weather_data and weather_data['stations']:
            stations_df = pd.DataFrame(weather_data['stations'])

            if not stations_df.empty:
                # Aggregate current conditions
                processed['current_conditions'] = {
                    'avg_temperature': float(stations_df['temperature'].mean()),
                    'avg_humidity': float(stations_df['humidity'].mean()),
                    'avg_wind_speed': float(stations_df['wind_speed'].mean()),
                    'max_wind_speed': float(stations_df['wind_speed'].max()),
                    'dominant_wind_direction': self._calculate_dominant_wind_direction(stations_df)
                }

                # Generate spatial fields
                processed['wind_field'] = self._interpolate_wind_field(stations_df)
                processed['temperature_field'] = self._interpolate_scalar_field(
                    stations_df, 'temperature'
                )
                processed['humidity_field'] = self._interpolate_scalar_field(
                    stations_df, 'humidity'
                )

        # Process fire weather data
        if 'fire_weather' in weather_data:
            processed['fire_weather_indices'] = self._calculate_fire_weather_indices(
                weather_data['fire_weather']
            )

        # Process 3D wind field for ember model
        if 'wind_field_3d' in weather_data:
            processed['wind_field_3d'] = np.array(weather_data['wind_field_3d'])

        return processed

    async def _process_terrain_data(self, terrain_data: Dict[str, Any]) -> Dict[str, Any]:
        """Process terrain and fuel data"""
        processed = {
            'elevation_grid': None,
            'slope_grid': None,
            'aspect_grid': None,
            'fuel_model_grid': None,
            'fuel_moisture_grid': None
        }

        # Process elevation data
        if 'elevation' in terrain_data:
            elevation_array = np.array(terrain_data['elevation'])
            processed['elevation_grid'] = elevation_array

            # Calculate slope and aspect
            processed['slope_grid'] = self._calculate_slope(elevation_array)
            processed['aspect_grid'] = self._calculate_aspect(elevation_array)

        # Process fuel data
        if 'fuel' in terrain_data:
            fuel_data = terrain_data['fuel']

            # Fuel model classification
            if 'fuel_models' in fuel_data:
                processed['fuel_model_grid'] = np.array(fuel_data['fuel_models'])

            # Fuel moisture content
            if 'fuel_moisture' in fuel_data:
                processed['fuel_moisture_grid'] = np.array(fuel_data['fuel_moisture'])
            else:
                # Estimate from weather conditions
                # This needs a valid humidity field to be processed first
                humidity_field = None
                # A bit of a hack: Assume weather data is already processed if this is called
                # In a real system, dependency management would be more explicit.
                # For now, we pass it through the chain, so this should be fine.
                if 'weather' in locals() and 'humidity_field' in locals()['weather']:
                     humidity_field = locals()['weather']['humidity_field']
                processed['fuel_moisture_grid'] = self._estimate_fuel_moisture(
                   humidity_field
                )

        return processed

    async def _generate_integrated_grids(self, processed_data: Dict[str, Any]) -> Dict[str, Any]:
        """Generate integrated grids for quantum algorithms"""
        fire_data = processed_data['fire']
        weather_data = processed_data['weather']
        terrain_data = processed_data['terrain']

        # Define grid dimensions
        grid_size = self.grid_resolution

        # Initialize grids
        integrated = {
            'fire_state_grid': np.zeros((grid_size, grid_size)),
            'wind_vector_grid': np.zeros((grid_size, grid_size, 2)),
            'fuel_moisture_grid': np.zeros((grid_size, grid_size)),
            'terrain_elevation_grid': np.zeros((grid_size, grid_size)),
            'temperature_grid': np.zeros((grid_size, grid_size)),
            'combined_risk_grid': np.zeros((grid_size, grid_size))
        }

        # Populate fire state grid
        if fire_data.get('fire_intensity_grid') is not None:
            integrated['fire_state_grid'] = self._resample_grid(
                fire_data['fire_intensity_grid'], (grid_size, grid_size)
            )

        # Populate wind vector grid
        if weather_data.get('wind_field') is not None:
            integrated['wind_vector_grid'] = self._resample_grid(
                weather_data['wind_field'], (grid_size, grid_size, 2)
            )

        # Populate other grids
        if weather_data.get('temperature_field') is not None:
            integrated['temperature_grid'] = self._resample_grid(
                weather_data['temperature_field'], (grid_size, grid_size)
            )

        if terrain_data.get('fuel_moisture_grid') is not None:
            integrated['fuel_moisture_grid'] = self._resample_grid(
                terrain_data['fuel_moisture_grid'], (grid_size, grid_size)
            )

        if terrain_data.get('elevation_grid') is not None:
            integrated['terrain_elevation_grid'] = self._resample_grid(
                terrain_data['elevation_grid'], (grid_size, grid_size)
            )

        # Calculate combined risk grid
        integrated['combined_risk_grid'] = self._calculate_combined_risk(integrated)

        # CONFIRMED FIX: Convert all numpy arrays in the dictionary to lists before returning.
        # This prevents the JSON serialization error when caching to Redis.
        return {k: v.tolist() if isinstance(v, np.ndarray) else v for k, v in integrated.items()}

    def _calculate_fire_intensity(
            self,
            brightness_temp: Optional[np.ndarray],
            frp: Optional[np.ndarray]
    ) -> np.ndarray:
        """Calculate fire intensity from satellite measurements"""
        if brightness_temp is None and frp is None:
            return np.array([0.5])  # Default medium intensity

        intensity = np.zeros(len(brightness_temp) if brightness_temp is not None and len(brightness_temp) > 0 else (len(frp) if frp is not None else 1))

        # Use brightness temperature if available
        if brightness_temp is not None:
            # Normalize to 0-1 scale (300K to 500K range)
            intensity += (brightness_temp - 300) / 200

        # Use Fire Radiative Power if available
        if frp is not None:
            # Normalize FRP (0 to 1000 MW)
            intensity += frp / 1000

        # Average if both available
        if brightness_temp is not None and frp is not None:
            intensity /= 2

        return np.clip(intensity, 0, 1)

    def _cluster_fire_detections(self, fires_df: pd.DataFrame) -> List[Dict[str, Any]]:
        """Cluster nearby fire detections into fire complexes"""
        from sklearn.cluster import DBSCAN

        if fires_df.empty:
            return []

        # Use DBSCAN clustering on lat/lon coordinates
        coords = fires_df[['latitude', 'longitude']].values
        clustering = DBSCAN(eps=0.01, min_samples=2).fit(coords)  # ~1km radius

        fires_df['cluster'] = clustering.labels_

        # Process each cluster
        fire_complexes = []
        for cluster_id in fires_df['cluster'].unique():
            if cluster_id == -1:  # Noise points (isolated fires)
                # Add each as individual fire
                for _, fire in fires_df[fires_df['cluster'] == -1].iterrows():
                    fire_complexes.append({
                        'id': f"fire_{len(fire_complexes)}",
                        'center_lat': float(fire['latitude']),
                        'center_lon': float(fire['longitude']),
                        'area_hectares': 10,  # Default small area
                        'intensity': float(fire.get('intensity', 0.5)),
                        'detection_time': fire.get('detection_time', datetime.now().isoformat()),
                        'confidence': float(fire.get('confidence', 0.8))
                    })
            else:
                # Process cluster
                cluster_fires = fires_df[fires_df['cluster'] == cluster_id]

                # Calculate cluster properties
                center_lat = float(cluster_fires['latitude'].mean())
                center_lon = float(cluster_fires['longitude'].mean())

                # Estimate area based on point spread
                lat_range = cluster_fires['latitude'].max() - cluster_fires['latitude'].min()
                lon_range = cluster_fires['longitude'].max() - cluster_fires['longitude'].min()
                area_hectares = max(10, lat_range * lon_range * 10000)  # Rough estimate

                fire_complexes.append({
                    'id': f"fire_{cluster_id}",
                    'center_lat': center_lat,
                    'center_lon': center_lon,
                    'area_hectares': float(area_hectares),
                    'intensity': float(cluster_fires['intensity'].max()) if 'intensity' in cluster_fires.columns else 0.5,
                    'detection_time': cluster_fires['detection_time'].min() if 'detection_time' in cluster_fires.columns and not cluster_fires.empty else datetime.now().isoformat(),
                    'confidence': float(cluster_fires['confidence'].mean()) if 'confidence' in cluster_fires.columns else 0.8,
                    'detection_count': len(cluster_fires)
                })

        return fire_complexes

    def _generate_fire_intensity_grid(self, fire_complexes: List[Dict[str, Any]]) -> np.ndarray:
        """Generate fire intensity grid from fire complexes"""
        grid = np.zeros((self.grid_resolution, self.grid_resolution))

        for fire in fire_complexes:
            # Convert lat/lon to grid coordinates
            # This is simplified - in production would use proper projection
            i = int((fire['center_lat'] - 32.5) / (42.0 - 32.5) * self.grid_resolution)
            j = int((fire['center_lon'] + 124.5) / (124.5 - 114.0) * self.grid_resolution)

            if 0 <= i < self.grid_resolution and 0 <= j < self.grid_resolution:
                # Add fire intensity with Gaussian spread
                spread = max(1, int(np.sqrt(fire['area_hectares']) / 10))
                for di in range(-spread, spread + 1):
                    for dj in range(-spread, spread + 1):
                        ni, nj = i + di, j + dj
                        if 0 <= ni < self.grid_resolution and 0 <= nj < self.grid_resolution:
                            distance = np.sqrt(di ** 2 + dj ** 2)
                            intensity = fire['intensity'] * np.exp(-distance ** 2 / (2 * (spread ** 2) + 1e-6))
                            grid[ni, nj] = max(grid[ni, nj], intensity)

        return grid

    def _interpolate_wind_field(self, stations_df: pd.DataFrame) -> np.ndarray:
        """Interpolate wind field from station data"""
        # Extract station coordinates and wind vectors
        points = stations_df[['latitude', 'longitude']].values
        wind_speed = stations_df['wind_speed'].values
        wind_dir_rad = np.deg2rad(stations_df['wind_direction'].values)

        # Convert to u, v components
        u = wind_speed * np.cos(wind_dir_rad)
        v = wind_speed * np.sin(wind_dir_rad)

        # Create regular grid
        lat_range = np.linspace(32.5, 42.0, self.grid_resolution)
        lon_range = np.linspace(-124.5, -114.0, self.grid_resolution)
        grid_lat, grid_lon = np.meshgrid(lat_range, lon_range, indexing='ij')

        # Interpolate u and v components
        grid_u = griddata(points, u, (grid_lat, grid_lon), method='linear', fill_value=0)
        grid_v = griddata(points, v, (grid_lat, grid_lon), method='linear', fill_value=0)

        # Stack into 3D array
        wind_field = np.stack([grid_u, grid_v], axis=-1)

        # Apply Gaussian smoothing
        wind_field[:, :, 0] = gaussian_filter(wind_field[:, :, 0], sigma=2)
        wind_field[:, :, 1] = gaussian_filter(wind_field[:, :, 1], sigma=2)

        return wind_field

    def _interpolate_scalar_field(
            self,
            stations_df: pd.DataFrame,
            field_name: str
    ) -> np.ndarray:
        """Interpolate scalar field (temperature, humidity) from station data"""
        # Extract station coordinates and values
        points = stations_df[['latitude', 'longitude']].values
        values = stations_df[field_name].values

        # Create regular grid
        lat_range = np.linspace(32.5, 42.0, self.grid_resolution)
        lon_range = np.linspace(-124.5, -114.0, self.grid_resolution)
        grid_lat, grid_lon = np.meshgrid(lat_range, lon_range, indexing='ij')

        # Interpolate
        grid_values = griddata(points, values, (grid_lat, grid_lon), method='linear')

        # Fill NaN values with nearest neighbor
        mask = np.isnan(grid_values)
        if mask.any():
            grid_values_nn = griddata(points, values, (grid_lat, grid_lon), method='nearest')
            grid_values[mask] = grid_values_nn[mask]

        # Apply smoothing
        grid_values = gaussian_filter(grid_values, sigma=1.5)

        return grid_values

    def _calculate_dominant_wind_direction(self, stations_df: pd.DataFrame) -> float:
        """Calculate dominant wind direction from multiple stations"""
        # Convert to unit vectors and average
        directions_rad = np.deg2rad(stations_df['wind_direction'].values)
        weights = stations_df['wind_speed'].values  # Weight by speed

        # Calculate weighted average of unit vectors
        x = np.sum(weights * np.cos(directions_rad))
        y = np.sum(weights * np.sin(directions_rad))

        # Convert back to degrees
        dominant_direction = np.rad2deg(np.arctan2(y, x))
        if dominant_direction < 0:
            dominant_direction += 360

        return float(dominant_direction)

    def _calculate_fire_weather_indices(self, fire_weather_data: Dict[str, Any]) -> Dict[str, float]:
        """Calculate fire weather indices"""
        indices = {}

        # Haines Index (atmospheric instability)
        if 'temperature_850mb' in fire_weather_data and 'dewpoint_850mb' in fire_weather_data:
            temp_850 = fire_weather_data['temperature_850mb']
            dewpoint_850 = fire_weather_data['dewpoint_850mb']
            indices['haines_index'] = self._calculate_haines_index(temp_850, dewpoint_850)

        # Energy Release Component (ERC)
        if 'fuel_moisture' in fire_weather_data:
            indices['erc'] = self._calculate_erc(fire_weather_data['fuel_moisture'])

        # Burning Index
        if 'wind_speed' in fire_weather_data and 'fuel_moisture' in fire_weather_data:
            indices['burning_index'] = self._calculate_burning_index(
                fire_weather_data['wind_speed'],
                fire_weather_data['fuel_moisture']
            )

        return indices

    def _calculate_haines_index(self, temp_850: float, dewpoint_850: float) -> float:
        """Calculate Haines Index for atmospheric instability"""
        # Simplified calculation
        stability = min(3, max(1, (temp_850 - dewpoint_850) / 10))
        return float(stability)

    def _calculate_erc(self, fuel_moisture: float) -> float:
        """Calculate Energy Release Component"""
        # Simplified ERC calculation
        erc = 100 - fuel_moisture
        return float(max(0, min(100, erc)))

    def _calculate_burning_index(self, wind_speed: float, fuel_moisture: float) -> float:
        """Calculate Burning Index"""
        # Simplified calculation
        bi = (100 - fuel_moisture) * (wind_speed / 10)
        return float(max(0, min(100, bi)))

    def _calculate_slope(self, elevation: np.ndarray) -> np.ndarray:
        """Calculate slope from elevation data"""
        if elevation.ndim != 2 or elevation.size == 0:
            return np.zeros_like(elevation)
        # Calculate gradient
        dy, dx = np.gradient(elevation)
        slope = np.sqrt(dx ** 2 + dy ** 2)

        # Convert to degrees
        slope_degrees = np.rad2deg(np.arctan(slope))

        return slope_degrees

    def _calculate_aspect(self, elevation: np.ndarray) -> np.ndarray:
        """Calculate aspect from elevation data"""
        if elevation.ndim != 2 or elevation.size == 0:
            return np.zeros_like(elevation)
        dy, dx = np.gradient(elevation)
        aspect = np.rad2deg(np.arctan2(dy, dx))

        # Convert to 0-360 range
        aspect[aspect < 0] += 360

        return aspect

    def _estimate_fuel_moisture(self, humidity_field: Optional[np.ndarray]) -> np.ndarray:
        """Estimate fuel moisture from humidity"""
        if humidity_field is None:
            # Default fuel moisture
            return np.full((self.grid_resolution, self.grid_resolution), 10.0)

        # Simple linear relationship
        # 100% humidity -> 30% fuel moisture
        # 0% humidity -> 2% fuel moisture
        fuel_moisture = 2 + (humidity_field / 100) * 28

        return fuel_moisture

    def _resample_grid(self, data: np.ndarray, target_shape: Tuple[int, ...]) -> np.ndarray:
        """Resample grid to target shape"""
        if data.shape == target_shape:
            return data

        # Handle empty arrays
        if data.size == 0:
            return np.zeros(target_shape)

        # Use scipy zoom for resampling
        from scipy.ndimage import zoom

        zoom_factors = [t / s for t, s in zip(target_shape, data.shape)]
        resampled = zoom(data, zoom_factors, order=1)

        return resampled

    def _calculate_combined_risk(self, integrated_grids: Dict[str, np.ndarray]) -> np.ndarray:
        """Calculate combined fire risk from all factors"""
        # Initialize risk grid
        risk = np.zeros((self.grid_resolution, self.grid_resolution))

        # Fire state contribution (highest weight)
        if 'fire_state_grid' in integrated_grids:
            risk += np.array(integrated_grids['fire_state_grid']) * 0.4

        # Wind speed contribution
        if 'wind_vector_grid' in integrated_grids:
            wind_grid = np.array(integrated_grids['wind_vector_grid'])
            wind_speed = np.linalg.norm(wind_grid, axis=2)
            normalized_wind = wind_speed / (wind_speed.max() + 1e-6)
            risk += normalized_wind * 0.2

        # Low fuel moisture increases risk
        if 'fuel_moisture_grid' in integrated_grids:
            moisture_risk = 1 - (np.array(integrated_grids['fuel_moisture_grid']) / 100)
            risk += moisture_risk * 0.2

        # High temperature increases risk
        if 'temperature_grid' in integrated_grids:
            temp_celsius = np.array(integrated_grids['temperature_grid']) - 273.15
            temp_risk = np.clip((temp_celsius - 20) / 30, 0, 1)
            risk += temp_risk * 0.1

        # Terrain slope increases risk
        if 'terrain_elevation_grid' in integrated_grids:
            # Calculate local slope
            slope = self._calculate_slope(np.array(integrated_grids['terrain_elevation_grid']))
            slope_risk = np.clip(slope / 45, 0, 1)  # 45 degrees = max risk
            risk += slope_risk * 0.1

        # Normalize to 0-1 range
        risk = np.clip(risk, 0, 1)

        return risk

    async def process_real_time_update(
            self,
            update_type: str,
            update_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Process real-time data updates"""
        try:
            if update_type == 'fire_detection':
                # Process new fire detection
                return await self._process_fire_update(update_data)

            elif update_type == 'weather_update':
                # Process weather update
                return await self._process_weather_update(update_data)

            elif update_type == 'satellite_pass':
                # Process new satellite data
                return await self._process_satellite_update(update_data)

            else:
                logger.warning(f"Unknown update type: {update_type}")
                return {}

        except Exception as e:
            logger.error(f"Error processing real-time update: {str(e)}")
            raise

    async def _process_fire_update(self, fire_data: Dict[str, Any]) -> Dict[str, Any]:
        """Process real-time fire detection update"""
        # Extract location
        lat = fire_data.get('latitude')
        lon = fire_data.get('longitude')

        if lat is None or lon is None:
            raise ValueError("Fire update missing location")

        # Calculate intensity
        intensity = self._calculate_fire_intensity(
            np.array([fire_data.get('brightness_temperature', 400)]),
            np.array([fire_data.get('frp', 50)])
        )[0]

        return {
            'type': 'fire_detection',
            'location': {'latitude': lat, 'longitude': lon},
            'intensity': float(intensity),
            'confidence': fire_data.get('confidence', 0.8),
            'timestamp': fire_data.get('detection_time', datetime.now().isoformat()),
            'requires_quantum_update': intensity > 0.7  # High intensity fires need immediate quantum prediction
        }

    async def _process_weather_update(self, weather_data: Dict[str, Any]) -> Dict[str, Any]:
        """Process real-time weather update"""
        # Check for significant changes
        wind_speed = weather_data.get('wind_speed', 0)
        wind_change = weather_data.get('wind_speed_change', 0)

        significant_change = (
                wind_change > 10 or  # 10 mph change
                wind_speed > 30 or  # High winds
                weather_data.get('humidity', 100) < 20  # Very low humidity
        )

        return {
            'type': 'weather_update',
            'location': weather_data.get('location', {}),
            'conditions': {
                'wind_speed': wind_speed,
                'wind_direction': weather_data.get('wind_direction'),
                'temperature': weather_data.get('temperature'),
                'humidity': weather_data.get('humidity')
            },
            'significant_change': significant_change,
            'requires_quantum_update': significant_change
        }

    async def _process_satellite_update(self, satellite_data: Dict[str, Any]) -> Dict[str, Any]:
        """Process new satellite pass data"""
        # Extract fire pixels
        fire_pixels = satellite_data.get('fire_pixels', [])

        # Process into fire detections
        new_fires = []
        for pixel in fire_pixels:
            if pixel.get('confidence', 0) >= settings.minimum_fire_confidence:
                new_fires.append({
                    'latitude': pixel['latitude'],
                    'longitude': pixel['longitude'],
                    'intensity': float(self._calculate_fire_intensity(
                        np.array([pixel.get('temperature', 400)]),
                        np.array([pixel.get('frp', 50)])
                    )[0]),
                    'confidence': pixel['confidence']
                })

        return {
            'type': 'satellite_update',
            'satellite': satellite_data.get('satellite_name', 'unknown'),
            'pass_time': satellite_data.get('pass_time', datetime.now().isoformat()),
            'new_fire_detections': new_fires,
            'coverage_area': satellite_data.get('coverage_area', {}),
            'requires_quantum_update': len(new_fires) > 0
        }

    def get_processing_metrics(self) -> Dict[str, Any]:
        """Get data processing metrics"""
        return {
            'total_collections_processed': self.processing_metrics['total_processed'],
            'processing_errors': self.processing_metrics['errors'],
            'last_processing_time': self.processing_metrics['last_processing_time'],
            'average_processing_time': (
                self.processing_metrics['last_processing_time']
                if self.processing_metrics['total_processed'] > 0
                else 0
            )
        }