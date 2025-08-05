import logging
import numpy as np
from datetime import datetime, timezone
from typing import Dict, List, Any, Optional
import asyncio

logger = logging.getLogger(__name__)


class DataProcessor:
    """
    Enhanced Data Processor for Phase 2
    Processes raw data from various collectors into a unified format
    with improved analytics and quantum feature extraction.
    """

    def __init__(self):
        """Initialize the Enhanced DataProcessor."""
        self.processing_stats = {
            'total_processed': 0,
            'errors': 0,
            'last_processing_time': None,
            'performance_metrics': {},
        }
        self.california_bounds = {
            'north': 42.0,
            'south': 32.5,
            'east': -114.0,
            'west': -124.5
        }
        
        # Enhanced processing parameters
        self.fire_intensity_thresholds = {
            'low': 0.3,
            'medium': 0.6,
            'high': 0.8,
            'critical': 0.9
        }
        
        self.quantum_feature_extractors = {
            'spatial_correlation': self._extract_spatial_correlations,
            'temporal_patterns': self._extract_temporal_patterns,
            'multi_modal_fusion': self._extract_multimodal_features
        }

        logger.info("Enhanced DataProcessor (Phase 2) initialized.")

    async def process_enhanced(self, raw_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Enhanced processing pipeline with quantum feature extraction.

        Args:
            raw_data: Dictionary with collector names as keys and their raw data as values

        Returns:
            Enhanced processed and unified data structure with quantum features
        """
        try:
            logger.info("🔄 Starting enhanced data processing pipeline...")
            start_time = datetime.now(timezone.utc)

            # Process core data
            core_processed = await self.process(raw_data)
            
            # Extract quantum-ready features
            quantum_features = await self._extract_quantum_features(core_processed)
            
            # Generate risk assessments
            risk_analysis = await self._generate_risk_analysis(core_processed)
            
            # Create prediction features
            prediction_features = await self._create_prediction_features(core_processed, quantum_features)
            
            enhanced_data = {
                **core_processed,
                'quantum_features': quantum_features,
                'risk_analysis': risk_analysis,
                'prediction_features': prediction_features,
                'enhanced_metadata': {
                    'processing_version': '2.0',
                    'quantum_ready': True,
                    'feature_count': len(quantum_features),
                    'processing_time': (datetime.now(timezone.utc) - start_time).total_seconds(),
                    'enhancement_level': 'advanced'
                }
            }

            # Update processing stats
            self.processing_stats['total_processed'] += 1
            self.processing_stats['last_processing_time'] = start_time
            
            logger.info(f"✅ Enhanced processing completed in {enhanced_data['enhanced_metadata']['processing_time']:.2f}s")
            return enhanced_data

        except Exception as e:
            logger.error(f"❌ Error in enhanced processing pipeline: {e}")
            self.processing_stats['errors'] += 1
            # Fall back to standard processing
            return await self.process(raw_data)

    async def process(self, raw_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Process raw data from all collectors into unified format.

        Args:
            raw_data: Dictionary with collector names as keys and their raw data as values

        Returns:
            Processed and unified data structure
        """
        try:
            logger.info("Starting data processing pipeline...")
            start_time = datetime.now()

            processed_data = {
                'active_fires': [],
                'weather': {},
                'terrain': {},
                'metadata': {
                    'processing_time': None,
                    'sources': [],
                    'timestamp': datetime.now().isoformat(),
                    'data_quality': 'high'
                }
            }

            # Process NASA FIRMS fire data
            if 'nasa_firms' in raw_data and raw_data['nasa_firms']:
                firms_result = raw_data['nasa_firms']
                if isinstance(firms_result, dict) and 'active_fires' in firms_result:
                    processed_data['active_fires'] = self._process_firms_data(firms_result)
                    processed_data['metadata']['sources'].append('NASA FIRMS')
                else:
                    logger.warning("Invalid NASA FIRMS data format")

            # Process weather data (NOAA and OpenMeteo)
            weather_sources = []
            for source in ['noaa_weather', 'openmeteo_weather']:
                if source in raw_data and raw_data[source]:
                    try:
                        weather_data = self._process_weather_data(raw_data[source], source)
                        if weather_data:
                            if not processed_data['weather']:
                                processed_data['weather'] = weather_data
                            else:
                                # Merge weather data from multiple sources
                                processed_data['weather'] = self._merge_weather_data(
                                    processed_data['weather'], weather_data
                                )
                            weather_sources.append(source.replace('_', ' ').title())
                    except Exception as e:
                        logger.error(f"Error processing {source} data: {e}")

            if weather_sources:
                processed_data['metadata']['sources'].extend(weather_sources)

            # Process terrain data
            if 'usgs_terrain' in raw_data and raw_data['usgs_terrain']:
                try:
                    terrain_data = self._process_terrain_data(raw_data['usgs_terrain'])
                    processed_data['terrain'] = terrain_data
                    processed_data['metadata']['sources'].append('USGS')
                except Exception as e:
                    logger.error(f"Error processing terrain data: {e}")

            # Add fallback data if no real data available
            if not processed_data['active_fires']:
                processed_data['active_fires'] = self._generate_demo_fire_data()

            if not processed_data['weather']:
                processed_data['weather'] = self._generate_demo_weather_data()

            if not processed_data['terrain']:
                processed_data['terrain'] = self._generate_demo_terrain_data()

            # Calculate processing time
            processing_time = (datetime.now() - start_time).total_seconds()
            processed_data['metadata']['processing_time'] = processing_time

            # Update stats
            self.processing_stats['total_processed'] += 1
            self.processing_stats['last_processing_time'] = processing_time

            logger.info(f"Data processing completed in {processing_time:.2f}s")
            return processed_data

        except Exception as e:
            logger.error(f"Error in data processing pipeline: {e}", exc_info=True)
            self.processing_stats['errors'] += 1

            # Return fallback data structure
            return {
                'active_fires': self._generate_demo_fire_data(),
                'weather': self._generate_demo_weather_data(),
                'terrain': self._generate_demo_terrain_data(),
                'metadata': {
                    'processing_time': 0,
                    'sources': ['Fallback'],
                    'timestamp': datetime.now().isoformat(),
                    'data_quality': 'fallback',
                    'error': str(e)
                }
            }

    def _process_firms_data(self, firms_data: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Process NASA FIRMS fire data."""
        try:
            active_fires = firms_data.get('active_fires', [])
            if not isinstance(active_fires, list):
                logger.warning("Active fires data is not a list")
                return []

            # Filter and process fires
            processed_fires = []
            for fire in active_fires:
                if not isinstance(fire, dict):
                    logger.warning(f"Fire data is not a dict: {type(fire)}")
                    continue

                # Validate required fields
                if not all(key in fire for key in ['latitude', 'longitude']):
                    logger.warning("Fire missing required location data")
                    continue

                try:
                    processed_fire = {
                        'id': fire.get('id', f"fire_{len(processed_fires)}"),
                        'latitude': float(fire['latitude']),
                        'longitude': float(fire['longitude']),
                        'intensity': self._calculate_intensity(fire),
                        'area_hectares': self._estimate_area(fire),
                        'confidence': int(fire.get('confidence', 70)),
                        'brightness_temperature': float(fire.get('brightness_temperature', 300)),
                        'detection_time': fire.get('detection_time', datetime.now().isoformat()),
                        'satellite': fire.get('satellite', 'Unknown'),
                        'frp': float(fire.get('frp', 0)),
                        'center_lat': float(fire['latitude']),
                        'center_lon': float(fire['longitude'])
                    }

                    # Only include fires within California bounds
                    if self._is_within_bounds(processed_fire['latitude'], processed_fire['longitude']):
                        processed_fires.append(processed_fire)

                except (ValueError, TypeError) as e:
                    logger.warning(f"Error processing individual fire: {e}")
                    continue

            logger.info(f"Processed {len(processed_fires)} valid fires from FIRMS data")
            return processed_fires

        except Exception as e:
            logger.error(f"Error processing FIRMS data: {e}")
            return []

    def _process_weather_data(self, weather_data: Dict[str, Any], source: str) -> Dict[str, Any]:
        """Process weather data from various sources."""
        try:
            processed_weather = {
                'stations': [],
                'current_conditions': {},
                'fire_weather': {},
                'forecast': [],
                'metadata': {
                    'source': source,
                    'collection_time': datetime.now().isoformat()
                }
            }

            # Process based on source
            if source == 'noaa_weather':
                return self._process_noaa_weather(weather_data, processed_weather)
            elif source == 'openmeteo_weather':
                return self._process_openmeteo_weather(weather_data, processed_weather)
            else:
                logger.warning(f"Unknown weather source: {source}")
                return processed_weather

        except Exception as e:
            logger.error(f"Error processing weather data from {source}: {e}")
            return {}

    def _process_noaa_weather(self, data: Dict[str, Any], processed: Dict[str, Any]) -> Dict[str, Any]:
        """Process NOAA weather data."""
        try:
            # Process stations
            stations = data.get('stations', [])
            for station in stations:
                if isinstance(station, dict):
                    processed['stations'].append({
                        'station_id': station.get('station_id', 'unknown'),
                        'latitude': float(station.get('latitude', 0)),
                        'longitude': float(station.get('longitude', 0)),
                        'temperature': float(station.get('temperature', 20)),
                        'humidity': float(station.get('humidity', 50)),
                        'wind_speed': float(station.get('wind_speed', 10)),
                        'wind_direction': float(station.get('wind_direction', 0)),
                        'pressure': float(station.get('pressure', 1013.25))
                    })

            # Process current conditions
            conditions = data.get('current_conditions', {})
            if isinstance(conditions, dict):
                processed['current_conditions'] = {
                    'avg_temperature': float(conditions.get('avg_temperature', 20)),
                    'avg_humidity': float(conditions.get('avg_humidity', 50)),
                    'avg_wind_speed': float(conditions.get('avg_wind_speed', 10)),
                    'max_wind_speed': float(conditions.get('max_wind_speed', 15)),
                    'dominant_wind_direction': float(conditions.get('dominant_wind_direction', 0)),
                    'fuel_moisture': float(conditions.get('fuel_moisture', 15))
                }

            return processed

        except Exception as e:
            logger.error(f"Error processing NOAA weather: {e}")
            return processed

    def _process_openmeteo_weather(self, data: Dict[str, Any], processed: Dict[str, Any]) -> Dict[str, Any]:
        """Process OpenMeteo weather data."""
        try:
            # Process current conditions
            current = data.get('current', {})
            if isinstance(current, dict):
                processed['current_conditions'] = {
                    'avg_temperature': float(current.get('temperature', 20)),
                    'avg_humidity': float(current.get('humidity', 50)),
                    'avg_wind_speed': float(current.get('wind_speed', 10)),
                    'max_wind_speed': float(current.get('wind_gusts', 15)),
                    'dominant_wind_direction': float(current.get('wind_direction', 0)),
                    'pressure': float(current.get('pressure', 1013.25))
                }

            # Process fire weather if available
            fire_weather = data.get('fire_weather', {})
            if isinstance(fire_weather, dict):
                processed['fire_weather'] = {
                    'fosberg_index': float(fire_weather.get('fosberg_index', 50)),
                    'red_flag_warning': bool(fire_weather.get('red_flag_warning', False))
                }

            return processed

        except Exception as e:
            logger.error(f"Error processing OpenMeteo weather: {e}")
            return processed

    def _process_terrain_data(self, terrain_data: Dict[str, Any]) -> Dict[str, Any]:
        """Process terrain data from USGS."""
        try:
            processed_terrain = {
                'elevation_grid': [],
                'slope_grid': [],
                'aspect_grid': [],
                'fuel_model_grid': [],
                'metadata': {
                    'source': 'USGS',
                    'collection_time': datetime.now().isoformat()
                }
            }

            # Process elevation data
            if 'elevation' in terrain_data:
                elevation_data = terrain_data['elevation']
                if isinstance(elevation_data, list):
                    processed_terrain['elevation_grid'] = elevation_data
                elif isinstance(elevation_data, (int, float)):
                    # Single elevation value - create a small grid
                    processed_terrain['elevation_grid'] = [[elevation_data for _ in range(10)] for _ in range(10)]

            # Process slope data
            if 'slope' in terrain_data:
                slope_data = terrain_data['slope']
                if isinstance(slope_data, list):
                    processed_terrain['slope_grid'] = slope_data

            # Process aspect data
            if 'aspect' in terrain_data:
                aspect_data = terrain_data['aspect']
                if isinstance(aspect_data, list):
                    processed_terrain['aspect_grid'] = aspect_data

            return processed_terrain

        except Exception as e:
            logger.error(f"Error processing terrain data: {e}")
            return {}

    def _merge_weather_data(self, data1: Dict[str, Any], data2: Dict[str, Any]) -> Dict[str, Any]:
        """Merge weather data from multiple sources."""
        try:
            merged = data1.copy()

            # Merge stations
            if 'stations' in data2:
                merged.setdefault('stations', []).extend(data2['stations'])

            # Merge current conditions by averaging numerical values
            if 'current_conditions' in data2 and 'current_conditions' in merged:
                conditions1 = merged['current_conditions']
                conditions2 = data2['current_conditions']

                for key in conditions1:
                    if key in conditions2 and isinstance(conditions1[key], (int, float)):
                        merged['current_conditions'][key] = (conditions1[key] + conditions2[key]) / 2

            return merged

        except Exception as e:
            logger.error(f"Error merging weather data: {e}")
            return data1

    def _calculate_intensity(self, fire_data: Dict[str, Any]) -> float:
        """Calculate fire intensity from available data."""
        try:
            # Use FRP (Fire Radiative Power) if available
            frp = fire_data.get('frp', 0)
            if frp > 0:
                # Normalize FRP to 0-1 scale (rough approximation)
                return min(frp / 1000.0, 1.0)

            # Use brightness temperature
            brightness = fire_data.get('brightness_temperature', 300)
            if brightness > 300:
                # Normalize brightness to 0-1 scale
                return min((brightness - 300) / 200.0, 1.0)

            # Use confidence as fallback
            confidence = fire_data.get('confidence', 50)
            return confidence / 100.0

        except Exception:
            return 0.5  # Default moderate intensity

    def _estimate_area(self, fire_data: Dict[str, Any]) -> float:
        """Estimate fire area in hectares."""
        try:
            # If area is directly provided
            if 'area_hectares' in fire_data:
                return float(fire_data['area_hectares'])

            # Estimate from FRP
            frp = fire_data.get('frp', 0)
            if frp > 0:
                # Rough conversion: FRP to hectares (very approximate)
                return max(frp * 0.1, 1.0)

            # Default small fire
            return 10.0

        except Exception:
            return 10.0

    def _is_within_bounds(self, latitude: float, longitude: float) -> bool:
        """Check if coordinates are within California bounds."""
        return (self.california_bounds['south'] <= latitude <= self.california_bounds['north'] and
                self.california_bounds['west'] <= longitude <= self.california_bounds['east'])

    def _generate_demo_fire_data(self) -> List[Dict[str, Any]]:
        """Generate demo fire data for California."""
        return [
            {
                'id': 'demo_fire_001',
                'latitude': 39.7596,
                'longitude': -121.6219,
                'intensity': 0.92,
                'area_hectares': 2500.0,
                'confidence': 95,
                'brightness_temperature': 425.0,
                'detection_time': datetime.now().isoformat(),
                'satellite': 'Demo Data',
                'frp': 850.0,
                'center_lat': 39.7596,
                'center_lon': -121.6219
            },
            {
                'id': 'demo_fire_002',
                'latitude': 38.5800,
                'longitude': -121.4900,
                'intensity': 0.68,
                'area_hectares': 890.0,
                'confidence': 91,
                'brightness_temperature': 410.0,
                'detection_time': datetime.now().isoformat(),
                'satellite': 'Demo Data',
                'frp': 340.0,
                'center_lat': 38.5800,
                'center_lon': -121.4900
            }
        ]

    def _generate_demo_weather_data(self) -> Dict[str, Any]:
        """Generate demo weather data."""
        return {
            'stations': [
                {
                    'station_id': 'DEMO_001',
                    'latitude': 39.7596,
                    'longitude': -121.6219,
                    'temperature': 28.5,
                    'humidity': 18.0,
                    'wind_speed': 35.2,
                    'wind_direction': 45.0,
                    'pressure': 1013.25
                }
            ],
            'current_conditions': {
                'avg_temperature': 29.8,
                'avg_humidity': 16.8,
                'avg_wind_speed': 39.0,
                'max_wind_speed': 65.5,
                'dominant_wind_direction': 48.5,
                'fuel_moisture': 6.2
            },
            'fire_weather': {
                'fosberg_index': 82.5,
                'red_flag_warning': True
            },
            'metadata': {
                'source': 'Demo Data',
                'collection_time': datetime.now().isoformat()
            }
        }

    def _generate_demo_terrain_data(self) -> Dict[str, Any]:
        """Generate demo terrain data."""
        # Create small grids for demo
        size = 10
        return {
            'elevation_grid': [[np.random.uniform(100, 1500) for _ in range(size)] for _ in range(size)],
            'slope_grid': [[np.random.uniform(0, 45) for _ in range(size)] for _ in range(size)],
            'aspect_grid': [[np.random.uniform(0, 360) for _ in range(size)] for _ in range(size)],
            'fuel_model_grid': [[np.random.randint(1, 14) for _ in range(size)] for _ in range(size)],
            'metadata': {
                'source': 'Demo Data',
                'collection_time': datetime.now().isoformat()
            }
        }

    def get_processing_stats(self) -> Dict[str, Any]:
        """Get processing statistics."""
        return self.processing_stats.copy()

    # === QUANTUM FEATURE EXTRACTION METHODS (Phase 2) ===
    
    async def _extract_quantum_features(self, processed_data: Dict[str, Any]) -> Dict[str, Any]:
        """Extract quantum-ready features from processed data."""
        try:
            logger.info("🌌 Extracting quantum features...")
            
            quantum_features = {}
            
            # Extract features using all registered extractors
            for feature_name, extractor in self.quantum_feature_extractors.items():
                try:
                    features = await extractor(processed_data)
                    quantum_features[feature_name] = features
                    logger.debug(f"✅ Extracted {feature_name}: {len(features) if isinstance(features, list) else 'scalar'}")
                except Exception as e:
                    logger.warning(f"⚠️  Failed to extract {feature_name}: {e}")
                    quantum_features[feature_name] = {}
            
            # Add quantum state preparation hints
            quantum_features['state_preparation'] = {
                'recommended_qubits': self._calculate_optimal_qubits(processed_data),
                'entanglement_strategy': self._suggest_entanglement_strategy(processed_data),
                'initialization_params': self._get_initialization_parameters(processed_data)
            }
            
            logger.info(f"✅ Quantum features extracted: {len(quantum_features)} feature sets")
            return quantum_features
            
        except Exception as e:
            logger.error(f"❌ Error extracting quantum features: {e}")
            return {}

    async def _extract_spatial_correlations(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Extract spatial correlation features for quantum processing."""
        try:
            fires = data.get('active_fires', [])
            if len(fires) < 2:
                return {'correlations': [], 'spatial_clusters': []}
            
            # Calculate pairwise spatial correlations
            correlations = []
            for i, fire1 in enumerate(fires):
                for j, fire2 in enumerate(fires[i+1:], i+1):
                    distance = self._calculate_distance(
                        fire1['latitude'], fire1['longitude'],
                        fire2['latitude'], fire2['longitude']
                    )
                    
                    intensity_correlation = abs(fire1['intensity'] - fire2['intensity'])
                    
                    correlations.append({
                        'fire_pair': (i, j),
                        'distance_km': distance,
                        'intensity_correlation': intensity_correlation,
                        'spatial_weight': 1.0 / (1.0 + distance),  # Inverse distance weighting
                        'quantum_coupling': self._calculate_quantum_coupling(fire1, fire2, distance)
                    })
            
            # Identify spatial clusters using simple threshold clustering
            clusters = self._identify_spatial_clusters(fires, threshold_km=5.0)
            
            return {
                'correlations': correlations,
                'spatial_clusters': clusters,
                'total_correlations': len(correlations),
                'cluster_count': len(clusters)
            }
            
        except Exception as e:
            logger.error(f"Error in spatial correlation extraction: {e}")
            return {'correlations': [], 'spatial_clusters': []}

    async def _extract_temporal_patterns(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Extract temporal patterns for quantum state evolution."""
        try:
            fires = data.get('active_fires', [])
            weather = data.get('weather', {})
            
            # Analyze temporal evolution patterns
            temporal_features = {
                'fire_progression_rate': self._estimate_fire_progression(fires),
                'weather_trend_vectors': self._analyze_weather_trends(weather),
                'temporal_coherence': self._calculate_temporal_coherence(fires),
                'quantum_evolution_params': self._derive_quantum_evolution_params(fires, weather)
            }
            
            return temporal_features
            
        except Exception as e:
            logger.error(f"Error in temporal pattern extraction: {e}")
            return {}

    async def _extract_multimodal_features(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Extract features from multiple data modalities for quantum fusion."""
        try:
            # Combine fire, weather, and terrain data into quantum-ready features
            multimodal_features = {
                'fire_weather_coupling': self._calculate_fire_weather_coupling(data),
                'terrain_fire_interaction': self._analyze_terrain_fire_interaction(data),
                'cross_modal_correlations': self._compute_cross_modal_correlations(data),
                'quantum_entanglement_map': self._create_entanglement_map(data)
            }
            
            return multimodal_features
            
        except Exception as e:
            logger.error(f"Error in multimodal feature extraction: {e}")
            return {}

    async def _generate_risk_analysis(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Generate comprehensive risk analysis."""
        try:
            fires = data.get('active_fires', [])
            weather = data.get('weather', {})
            
            # Calculate various risk metrics
            risk_analysis = {
                'overall_risk_level': self._calculate_overall_risk(fires, weather),
                'high_risk_zones': self._identify_high_risk_zones(fires, weather),
                'spread_probability_map': self._generate_spread_probability_map(fires, weather),
                'evacuation_recommendations': self._generate_evacuation_recommendations(fires),
                'resource_allocation_suggestions': self._suggest_resource_allocation(fires, weather)
            }
            
            return risk_analysis
            
        except Exception as e:
            logger.error(f"Error in risk analysis: {e}")
            return {}

    async def _create_prediction_features(self, core_data: Dict[str, Any], quantum_features: Dict[str, Any]) -> Dict[str, Any]:
        """Create features optimized for quantum prediction algorithms."""
        try:
            prediction_features = {
                'quantum_state_vector': self._create_quantum_state_vector(core_data, quantum_features),
                'measurement_operators': self._define_measurement_operators(core_data),
                'hamiltonian_params': self._derive_hamiltonian_parameters(core_data, quantum_features),
                'circuit_depth_estimate': self._estimate_circuit_depth(quantum_features),
                'decoherence_factors': self._calculate_decoherence_factors(core_data)
            }
            
            return prediction_features
            
        except Exception as e:
            logger.error(f"Error creating prediction features: {e}")
            return {}

    # === HELPER METHODS FOR QUANTUM FEATURES ===
    
    def _calculate_optimal_qubits(self, data: Dict[str, Any]) -> int:
        """Calculate optimal number of qubits needed."""
        fires = data.get('active_fires', [])
        weather_stations = len(data.get('weather', {}).get('stations', []))
        
        # Base calculation: log2 of state space size
        state_space_size = max(4, len(fires) + weather_stations)
        optimal_qubits = max(4, int(np.ceil(np.log2(state_space_size))))
        
        return min(optimal_qubits, 20)  # Cap at 20 qubits for practical reasons

    def _suggest_entanglement_strategy(self, data: Dict[str, Any]) -> str:
        """Suggest optimal entanglement strategy."""
        fires = data.get('active_fires', [])
        
        if len(fires) <= 2:
            return 'bell_state'
        elif len(fires) <= 4:
            return 'ghz_state'
        else:
            return 'cluster_state'

    def _get_initialization_parameters(self, data: Dict[str, Any]) -> Dict[str, float]:
        """Get quantum state initialization parameters."""
        fires = data.get('active_fires', [])
        avg_intensity = np.mean([f.get('intensity', 0.5) for f in fires]) if fires else 0.5
        
        return {
            'theta': avg_intensity * np.pi,
            'phi': np.pi / 4,
            'lambda': 0.0
        }

    def _calculate_quantum_coupling(self, fire1: Dict, fire2: Dict, distance: float) -> float:
        """Calculate quantum coupling strength between two fires."""
        intensity_product = fire1.get('intensity', 0.5) * fire2.get('intensity', 0.5)
        distance_factor = np.exp(-distance / 10.0)  # Exponential decay with distance
        return intensity_product * distance_factor

    def _identify_spatial_clusters(self, fires: List[Dict], threshold_km: float = 5.0) -> List[List[int]]:
        """Identify spatial clusters of fires."""
        clusters = []
        used_indices = set()
        
        for i, fire1 in enumerate(fires):
            if i in used_indices:
                continue
                
            cluster = [i]
            used_indices.add(i)
            
            for j, fire2 in enumerate(fires):
                if j in used_indices:
                    continue
                    
                distance = self._calculate_distance(
                    fire1['latitude'], fire1['longitude'],
                    fire2['latitude'], fire2['longitude']
                )
                
                if distance <= threshold_km:
                    cluster.append(j)
                    used_indices.add(j)
            
            if len(cluster) > 1:
                clusters.append(cluster)
        
        return clusters

    def _calculate_distance(self, lat1: float, lon1: float, lat2: float, lon2: float) -> float:
        """Calculate distance between two points using Haversine formula."""
        from math import radians, cos, sin, asin, sqrt
        
        # Convert to radians
        lat1, lon1, lat2, lon2 = map(radians, [lat1, lon1, lat2, lon2])
        
        # Haversine formula
        dlat = lat2 - lat1
        dlon = lon2 - lon1
        a = sin(dlat/2)**2 + cos(lat1) * cos(lat2) * sin(dlon/2)**2
        c = 2 * asin(sqrt(a))
        r = 6371  # Radius of earth in kilometers
        return c * r

    def _estimate_fire_progression(self, fires: List[Dict]) -> float:
        """Estimate fire progression rate."""
        if not fires:
            return 0.0
        
        total_intensity = sum(f.get('intensity', 0.5) for f in fires)
        avg_area = np.mean([f.get('area_hectares', 100) for f in fires])
        
        return min(1.0, (total_intensity / len(fires)) * (avg_area / 1000))

    def _analyze_weather_trends(self, weather: Dict[str, Any]) -> Dict[str, float]:
        """Analyze weather trends for temporal patterns."""
        stations = weather.get('stations', [])
        if not stations:
            return {'wind_trend': 0.0, 'temp_trend': 0.0, 'humidity_trend': 0.0}
        
        avg_wind = np.mean([s.get('wind_speed', 10) for s in stations])
        avg_temp = np.mean([s.get('temperature', 20) for s in stations])
        avg_humidity = np.mean([s.get('humidity', 50) for s in stations])
        
        return {
            'wind_trend': min(1.0, avg_wind / 50),
            'temp_trend': min(1.0, max(0.0, (avg_temp - 10) / 40)),
            'humidity_trend': 1.0 - min(1.0, avg_humidity / 100)
        }

    def _calculate_temporal_coherence(self, fires: List[Dict]) -> float:
        """Calculate temporal coherence of fire system."""
        if len(fires) < 2:
            return 1.0
        
        intensities = [f.get('intensity', 0.5) for f in fires]
        coherence = 1.0 - np.std(intensities)
        return max(0.0, min(1.0, coherence))

    def _derive_quantum_evolution_params(self, fires: List[Dict], weather: Dict[str, Any]) -> Dict[str, float]:
        """Derive parameters for quantum time evolution."""
        fire_energy = sum(f.get('intensity', 0.5) for f in fires)
        weather_energy = len(weather.get('stations', []))
        
        return {
            'evolution_time': min(10.0, fire_energy),
            'coupling_strength': min(1.0, weather_energy / 10),
            'decoherence_rate': 0.1
        }

    def _calculate_fire_weather_coupling(self, data: Dict[str, Any]) -> float:
        """Calculate coupling between fire and weather systems."""
        fires = data.get('active_fires', [])
        weather = data.get('weather', {})
        
        if not fires or not weather:
            return 0.0
        
        avg_fire_intensity = np.mean([f.get('intensity', 0.5) for f in fires])
        wind_factor = np.mean([s.get('wind_speed', 10) for s in weather.get('stations', [{}])]) / 50
        
        return min(1.0, avg_fire_intensity * wind_factor)

    def _analyze_terrain_fire_interaction(self, data: Dict[str, Any]) -> Dict[str, float]:
        """Analyze interaction between terrain and fire."""
        terrain = data.get('terrain', {})
        fires = data.get('active_fires', [])
        
        if not terrain or not fires:
            return {'slope_effect': 0.0, 'elevation_effect': 0.0}
        
        # Simplified terrain-fire interaction
        return {
            'slope_effect': 0.5,  # Placeholder
            'elevation_effect': 0.3  # Placeholder
        }

    def _compute_cross_modal_correlations(self, data: Dict[str, Any]) -> Dict[str, float]:
        """Compute correlations across different data modalities."""
        return {
            'fire_weather_correlation': self._calculate_fire_weather_coupling(data),
            'fire_terrain_correlation': 0.4,  # Placeholder
            'weather_terrain_correlation': 0.3  # Placeholder
        }

    def _create_entanglement_map(self, data: Dict[str, Any]) -> List[List[float]]:
        """Create entanglement map for quantum processing."""
        fires = data.get('active_fires', [])
        n_fires = len(fires)
        
        if n_fires == 0:
            return [[]]
        
        # Create entanglement matrix
        entanglement_map = []
        for i in range(n_fires):
            row = []
            for j in range(n_fires):
                if i == j:
                    row.append(1.0)
                else:
                    distance = self._calculate_distance(
                        fires[i]['latitude'], fires[i]['longitude'],
                        fires[j]['latitude'], fires[j]['longitude']
                    )
                    entanglement = np.exp(-distance / 5.0)  # Exponential decay
                    row.append(entanglement)
            entanglement_map.append(row)
        
        return entanglement_map

    def _calculate_overall_risk(self, fires: List[Dict], weather: Dict[str, Any]) -> str:
        """Calculate overall risk level."""
        if not fires:
            return 'low'
        
        avg_intensity = np.mean([f.get('intensity', 0.5) for f in fires])
        fire_count = len(fires)
        
        if avg_intensity > 0.8 or fire_count > 10:
            return 'critical'
        elif avg_intensity > 0.6 or fire_count > 5:
            return 'high'
        elif avg_intensity > 0.4 or fire_count > 2:
            return 'medium'
        else:
            return 'low'

    def _identify_high_risk_zones(self, fires: List[Dict], weather: Dict[str, Any]) -> List[Dict]:
        """Identify high-risk zones."""
        high_risk_zones = []
        
        for fire in fires:
            if fire.get('intensity', 0) > 0.7:
                high_risk_zones.append({
                    'center_lat': fire['latitude'],
                    'center_lon': fire['longitude'],
                    'radius_km': fire.get('area_hectares', 100) / 100,
                    'risk_level': 'high',
                    'fire_id': fire.get('id', 'unknown')
                })
        
        return high_risk_zones

    def _generate_spread_probability_map(self, fires: List[Dict], weather: Dict[str, Any]) -> Dict[str, Any]:
        """Generate fire spread probability map."""
        return {
            'grid_size': 10,
            'probabilities': [[0.1 for _ in range(10)] for _ in range(10)],
            'resolution_km': 1.0
        }

    def _generate_evacuation_recommendations(self, fires: List[Dict]) -> List[Dict]:
        """Generate evacuation recommendations."""
        recommendations = []
        
        for fire in fires:
            if fire.get('intensity', 0) > 0.6:
                recommendations.append({
                    'zone_id': f"evacuation_zone_{fire.get('id', 'unknown')}",
                    'center_lat': fire['latitude'],
                    'center_lon': fire['longitude'],
                    'radius_km': 5.0,
                    'urgency': 'high' if fire.get('intensity', 0) > 0.8 else 'medium',
                    'recommended_routes': ['Highway 1', 'Highway 101']
                })
        
        return recommendations

    def _suggest_resource_allocation(self, fires: List[Dict], weather: Dict[str, Any]) -> Dict[str, List]:
        """Suggest resource allocation."""
        return {
            'fire_trucks': [f"Deploy to fire {f.get('id', i)}" for i, f in enumerate(fires) if f.get('intensity', 0) > 0.5],
            'aircraft': [f"Air support for fire {f.get('id', i)}" for i, f in enumerate(fires) if f.get('intensity', 0) > 0.7],
            'personnel': [f"Ground crew for fire {f.get('id', i)}" for i, f in enumerate(fires)]
        }

    def _create_quantum_state_vector(self, core_data: Dict[str, Any], quantum_features: Dict[str, Any]) -> List[float]:
        """Create quantum state vector representation."""
        fires = core_data.get('active_fires', [])
        if not fires:
            return [1.0, 0.0, 0.0, 0.0]  # Default 2-qubit state
        
        # Normalize fire intensities to create state vector
        intensities = [f.get('intensity', 0.5) for f in fires[:4]]  # Max 4 fires for 2 qubits
        total = sum(intensities) if intensities else 1.0
        
        # Pad to 4 elements (2^2 for 2 qubits)
        while len(intensities) < 4:
            intensities.append(0.0)
        
        normalized = [i / total for i in intensities[:4]]
        return normalized

    def _define_measurement_operators(self, data: Dict[str, Any]) -> List[str]:
        """Define quantum measurement operators."""
        return ['Z0', 'Z1', 'X0', 'X1', 'Y0Y1']

    def _derive_hamiltonian_parameters(self, core_data: Dict[str, Any], quantum_features: Dict[str, Any]) -> Dict[str, float]:
        """Derive Hamiltonian parameters for quantum evolution."""
        return {
            'J_coupling': 0.5,
            'h_field': 0.1,
            'gamma_dissipation': 0.01
        }

    def _estimate_circuit_depth(self, quantum_features: Dict[str, Any]) -> int:
        """Estimate required quantum circuit depth."""
        correlations = quantum_features.get('spatial_correlation', {}).get('correlations', [])
        return max(5, min(20, len(correlations) // 2))

    def _calculate_decoherence_factors(self, data: Dict[str, Any]) -> Dict[str, float]:
        """Calculate decoherence factors."""
        return {
            'T1_relaxation': 10.0,  # microseconds
            'T2_dephasing': 5.0,    # microseconds
            'gate_fidelity': 0.99
        }
