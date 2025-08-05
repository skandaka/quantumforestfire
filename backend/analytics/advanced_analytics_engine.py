"""
Advanced Analytics Engine for Quantum Forest Fire Prediction
Provides historical analysis, trend prediction, and risk assessment
"""
import asyncio
import logging
import numpy as np
import pandas as pd
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any, Tuple
from dataclasses import dataclass
from enum import Enum
import json
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler
from sklearn.decomposition import PCA
from sklearn.cluster import DBSCAN
import scipy.stats as stats

logger = logging.getLogger(__name__)

class RiskLevel(Enum):
    MINIMAL = "minimal"
    LOW = "low"
    MODERATE = "moderate"
    HIGH = "high"
    EXTREME = "extreme"

class TrendDirection(Enum):
    DECLINING = "declining"
    STABLE = "stable"
    INCREASING = "increasing"
    VOLATILE = "volatile"

@dataclass
class FireEvent:
    """Fire event data structure"""
    id: str
    timestamp: datetime
    latitude: float
    longitude: float
    confidence: float
    severity: str
    area_burned: float
    weather_conditions: Dict[str, Any]
    terrain_features: Dict[str, Any]
    quantum_prediction: Dict[str, Any]

@dataclass
class AnalyticsResult:
    """Analytics computation result"""
    analysis_type: str
    timestamp: datetime
    data: Dict[str, Any]
    confidence: float
    metadata: Dict[str, Any]

@dataclass
class RiskAssessment:
    """Fire risk assessment result"""
    location: Tuple[float, float]
    risk_level: RiskLevel
    risk_score: float
    contributing_factors: List[str]
    probability: float
    time_window: int  # hours
    recommendations: List[str]

class AdvancedAnalyticsEngine:
    """Advanced analytics engine for fire prediction and analysis"""
    
    def __init__(self):
        self.historical_data = []
        self.fire_events = []
        self.weather_patterns = []
        self.terrain_data = []
        self.analytics_cache = {}
        self.models = {}
        self.scaler = StandardScaler()
        self.anomaly_detector = IsolationForest(contamination=0.1, random_state=42)
        
    async def initialize(self):
        """Initialize the analytics engine"""
        try:
            logger.info("Initializing Advanced Analytics Engine...")
            
            # Load historical data
            await self._load_historical_data()
            
            # Initialize ML models
            await self._initialize_models()
            
            # Setup anomaly detection
            await self._setup_anomaly_detection()
            
            # Start periodic analysis tasks
            asyncio.create_task(self._periodic_analysis_loop())
            
            logger.info("Advanced Analytics Engine initialized successfully")
            
        except Exception as e:
            logger.error(f"Failed to initialize Advanced Analytics Engine: {e}")
            raise
    
    async def _load_historical_data(self):
        """Load and preprocess historical fire data"""
        try:
            # Simulate loading historical data
            # In production, this would load from database
            current_time = datetime.utcnow()
            
            for i in range(1000):  # Generate 1000 historical events
                event_time = current_time - timedelta(days=np.random.randint(1, 365))
                
                fire_event = FireEvent(
                    id=f"fire_{i:04d}",
                    timestamp=event_time,
                    latitude=37.0 + np.random.normal(0, 0.5),
                    longitude=-122.0 + np.random.normal(0, 0.5),
                    confidence=np.random.uniform(0.6, 0.95),
                    severity=np.random.choice(['low', 'medium', 'high'], p=[0.4, 0.4, 0.2]),
                    area_burned=np.random.exponential(100),
                    weather_conditions={
                        'temperature': np.random.uniform(15, 45),
                        'humidity': np.random.uniform(10, 80),
                        'wind_speed': np.random.uniform(0, 25),
                        'precipitation': np.random.exponential(5)
                    },
                    terrain_features={
                        'elevation': np.random.uniform(0, 2000),
                        'slope': np.random.uniform(0, 45),
                        'vegetation_density': np.random.uniform(0, 1),
                        'fuel_moisture': np.random.uniform(5, 25)
                    },
                    quantum_prediction={
                        'quantum_risk_score': np.random.uniform(0, 1),
                        'classical_risk_score': np.random.uniform(0, 1),
                        'ensemble_score': np.random.uniform(0, 1)
                    }
                )
                
                self.fire_events.append(fire_event)
            
            logger.info(f"Loaded {len(self.fire_events)} historical fire events")
            
        except Exception as e:
            logger.error(f"Failed to load historical data: {e}")
            raise
    
    async def _initialize_models(self):
        """Initialize analytics models"""
        try:
            # Prepare feature matrix for model training
            features = []
            for event in self.fire_events:
                feature_vector = [
                    event.latitude,
                    event.longitude,
                    event.weather_conditions['temperature'],
                    event.weather_conditions['humidity'],
                    event.weather_conditions['wind_speed'],
                    event.weather_conditions['precipitation'],
                    event.terrain_features['elevation'],
                    event.terrain_features['slope'],
                    event.terrain_features['vegetation_density'],
                    event.terrain_features['fuel_moisture'],
                    event.quantum_prediction['quantum_risk_score'],
                    event.quantum_prediction['classical_risk_score'],
                    event.quantum_prediction['ensemble_score'],
                    event.area_burned
                ]
                features.append(feature_vector)
            
            self.feature_matrix = np.array(features)
            self.scaler.fit(self.feature_matrix)
            
            # Initialize clustering for pattern detection
            scaled_features = self.scaler.transform(self.feature_matrix)
            self.models['clustering'] = DBSCAN(eps=0.5, min_samples=5)
            self.models['clustering'].fit(scaled_features)
            
            # Initialize PCA for dimensionality reduction
            self.models['pca'] = PCA(n_components=5)
            self.models['pca'].fit(scaled_features)
            
            logger.info("Analytics models initialized successfully")
            
        except Exception as e:
            logger.error(f"Failed to initialize models: {e}")
            raise
    
    async def _setup_anomaly_detection(self):
        """Setup anomaly detection system"""
        try:
            scaled_features = self.scaler.transform(self.feature_matrix)
            self.anomaly_detector.fit(scaled_features)
            
            logger.info("Anomaly detection system configured")
            
        except Exception as e:
            logger.error(f"Failed to setup anomaly detection: {e}")
            raise
    
    async def _periodic_analysis_loop(self):
        """Periodic analysis execution loop"""
        while True:
            try:
                # Run periodic analytics every hour
                await self.run_periodic_analytics()
                await asyncio.sleep(3600)  # 1 hour
                
            except Exception as e:
                logger.error(f"Error in periodic analysis: {e}")
                await asyncio.sleep(300)  # Retry in 5 minutes
    
    async def analyze_historical_trends(self, 
                                      time_window_days: int = 90,
                                      location_bounds: Optional[Dict] = None) -> AnalyticsResult:
        """Analyze historical fire trends"""
        try:
            end_time = datetime.utcnow()
            start_time = end_time - timedelta(days=time_window_days)
            
            # Filter events by time and location
            filtered_events = [
                event for event in self.fire_events
                if start_time <= event.timestamp <= end_time
            ]
            
            if location_bounds:
                filtered_events = [
                    event for event in filtered_events
                    if (location_bounds['min_lat'] <= event.latitude <= location_bounds['max_lat'] and
                        location_bounds['min_lon'] <= event.longitude <= location_bounds['max_lon'])
                ]
            
            # Calculate trend metrics
            daily_counts = {}
            severity_distribution = {'low': 0, 'medium': 0, 'high': 0}
            total_area_burned = 0
            
            for event in filtered_events:
                day_key = event.timestamp.date()
                daily_counts[day_key] = daily_counts.get(day_key, 0) + 1
                severity_distribution[event.severity] += 1
                total_area_burned += event.area_burned
            
            # Calculate trend direction
            counts = list(daily_counts.values())
            if len(counts) > 1:
                correlation, p_value = stats.pearsonr(range(len(counts)), counts)
                if p_value < 0.05:
                    if correlation > 0.1:
                        trend_direction = TrendDirection.INCREASING
                    elif correlation < -0.1:
                        trend_direction = TrendDirection.DECLINING
                    else:
                        trend_direction = TrendDirection.STABLE
                else:
                    trend_direction = TrendDirection.VOLATILE
            else:
                trend_direction = TrendDirection.STABLE
            
            result = AnalyticsResult(
                analysis_type="historical_trends",
                timestamp=datetime.utcnow(),
                data={
                    "time_window_days": time_window_days,
                    "total_events": len(filtered_events),
                    "trend_direction": trend_direction.value,
                    "daily_average": len(filtered_events) / max(time_window_days, 1),
                    "severity_distribution": severity_distribution,
                    "total_area_burned": total_area_burned,
                    "average_area_per_fire": total_area_burned / max(len(filtered_events), 1),
                    "peak_activity_periods": self._identify_peak_periods(daily_counts)
                },
                confidence=0.85 if len(filtered_events) > 10 else 0.6,
                metadata={
                    "location_bounds": location_bounds,
                    "correlation_p_value": p_value if len(counts) > 1 else None
                }
            )
            
            return result
            
        except Exception as e:
            logger.error(f"Error in historical trend analysis: {e}")
            raise
    
    async def predict_future_risk(self, 
                                prediction_horizon_hours: int = 72,
                                location: Optional[Tuple[float, float]] = None) -> List[RiskAssessment]:
        """Predict future fire risk"""
        try:
            current_time = datetime.utcnow()
            predictions = []
            
            # Generate predictions for multiple time windows
            for hours_ahead in [24, 48, 72]:
                if hours_ahead > prediction_horizon_hours:
                    break
                
                prediction_time = current_time + timedelta(hours=hours_ahead)
                
                # Calculate base risk from historical patterns
                base_risk = self._calculate_base_risk(prediction_time, location)
                
                # Apply seasonal adjustments
                seasonal_factor = self._get_seasonal_factor(prediction_time)
                
                # Apply weather influence (simulated)
                weather_factor = np.random.uniform(0.8, 1.2)
                
                # Calculate final risk score
                risk_score = base_risk * seasonal_factor * weather_factor
                risk_score = min(max(risk_score, 0.0), 1.0)
                
                # Determine risk level
                if risk_score < 0.2:
                    risk_level = RiskLevel.MINIMAL
                elif risk_score < 0.4:
                    risk_level = RiskLevel.LOW
                elif risk_score < 0.6:
                    risk_level = RiskLevel.MODERATE
                elif risk_score < 0.8:
                    risk_level = RiskLevel.HIGH
                else:
                    risk_level = RiskLevel.EXTREME
                
                # Generate recommendations
                recommendations = self._generate_recommendations(risk_level, risk_score)
                
                # Identify contributing factors
                contributing_factors = self._identify_risk_factors(risk_score, seasonal_factor, weather_factor)
                
                assessment = RiskAssessment(
                    location=location or (37.0, -122.0),
                    risk_level=risk_level,
                    risk_score=risk_score,
                    contributing_factors=contributing_factors,
                    probability=risk_score * 0.8,  # Convert to probability
                    time_window=hours_ahead,
                    recommendations=recommendations
                )
                
                predictions.append(assessment)
            
            return predictions
            
        except Exception as e:
            logger.error(f"Error in future risk prediction: {e}")
            raise
    
    async def detect_anomalies(self, recent_data: List[Dict]) -> List[Dict]:
        """Detect anomalous patterns in recent data"""
        try:
            if not recent_data:
                return []
            
            # Convert recent data to feature matrix
            features = []
            for data_point in recent_data:
                feature_vector = [
                    data_point.get('latitude', 0),
                    data_point.get('longitude', 0),
                    data_point.get('temperature', 20),
                    data_point.get('humidity', 50),
                    data_point.get('wind_speed', 5),
                    data_point.get('precipitation', 0),
                    data_point.get('elevation', 100),
                    data_point.get('slope', 10),
                    data_point.get('vegetation_density', 0.5),
                    data_point.get('fuel_moisture', 15),
                    data_point.get('quantum_risk_score', 0.5),
                    data_point.get('classical_risk_score', 0.5),
                    data_point.get('ensemble_score', 0.5),
                    data_point.get('area_burned', 0)
                ]
                features.append(feature_vector)
            
            # Scale features
            scaled_features = self.scaler.transform(features)
            
            # Detect anomalies
            anomaly_scores = self.anomaly_detector.decision_function(scaled_features)
            is_anomaly = self.anomaly_detector.predict(scaled_features)
            
            anomalies = []
            for i, (data_point, score, is_anom) in enumerate(zip(recent_data, anomaly_scores, is_anomaly)):
                if is_anom == -1:  # Anomaly detected
                    anomaly = {
                        'index': i,
                        'data': data_point,
                        'anomaly_score': float(score),
                        'severity': 'high' if score < -0.5 else 'medium',
                        'timestamp': datetime.utcnow().isoformat(),
                        'description': self._describe_anomaly(data_point, score)
                    }
                    anomalies.append(anomaly)
            
            return anomalies
            
        except Exception as e:
            logger.error(f"Error in anomaly detection: {e}")
            return []
    
    async def cluster_fire_patterns(self) -> Dict[str, Any]:
        """Identify fire pattern clusters"""
        try:
            scaled_features = self.scaler.transform(self.feature_matrix)
            cluster_labels = self.models['clustering'].labels_
            
            # Analyze clusters
            unique_labels = set(cluster_labels)
            cluster_analysis = {}
            
            for label in unique_labels:
                if label == -1:  # Noise points
                    continue
                
                cluster_mask = cluster_labels == label
                cluster_events = [event for i, event in enumerate(self.fire_events) if cluster_mask[i]]
                
                # Calculate cluster characteristics
                cluster_analysis[f"cluster_{label}"] = {
                    'size': int(np.sum(cluster_mask)),
                    'avg_severity': np.mean([1 if e.severity == 'low' else 2 if e.severity == 'medium' else 3 
                                           for e in cluster_events]),
                    'avg_area_burned': float(np.mean([e.area_burned for e in cluster_events])),
                    'geographic_center': {
                        'latitude': float(np.mean([e.latitude for e in cluster_events])),
                        'longitude': float(np.mean([e.longitude for e in cluster_events]))
                    },
                    'temporal_pattern': self._analyze_temporal_pattern(cluster_events),
                    'weather_characteristics': self._analyze_weather_pattern(cluster_events),
                    'terrain_characteristics': self._analyze_terrain_pattern(cluster_events)
                }
            
            return {
                'total_clusters': len(unique_labels) - (1 if -1 in unique_labels else 0),
                'noise_points': int(np.sum(cluster_labels == -1)),
                'cluster_details': cluster_analysis,
                'analysis_timestamp': datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error in cluster analysis: {e}")
            return {}
    
    async def generate_risk_map(self, 
                               grid_resolution: float = 0.01,
                               bounds: Dict[str, float] = None) -> Dict[str, Any]:
        """Generate a risk map for the specified area"""
        try:
            if not bounds:
                bounds = {
                    'min_lat': 36.5, 'max_lat': 37.5,
                    'min_lon': -122.5, 'max_lon': -121.5
                }
            
            # Create grid
            lat_range = np.arange(bounds['min_lat'], bounds['max_lat'], grid_resolution)
            lon_range = np.arange(bounds['min_lon'], bounds['max_lon'], grid_resolution)
            
            risk_grid = []
            
            for lat in lat_range:
                row = []
                for lon in lon_range:
                    # Calculate risk for this grid point
                    risk_score = await self._calculate_point_risk(lat, lon)
                    row.append(risk_score)
                risk_grid.append(row)
            
            return {
                'bounds': bounds,
                'resolution': grid_resolution,
                'grid_dimensions': {'rows': len(risk_grid), 'cols': len(risk_grid[0])},
                'risk_grid': risk_grid,
                'lat_range': lat_range.tolist(),
                'lon_range': lon_range.tolist(),
                'max_risk': float(np.max(risk_grid)),
                'min_risk': float(np.min(risk_grid)),
                'avg_risk': float(np.mean(risk_grid)),
                'generated_at': datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error generating risk map: {e}")
            return {}
    
    async def run_periodic_analytics(self):
        """Run periodic analytics tasks"""
        try:
            logger.info("Running periodic analytics...")
            
            # Update analytics cache
            self.analytics_cache['last_run'] = datetime.utcnow().isoformat()
            
            # Run trend analysis
            trends = await self.analyze_historical_trends(time_window_days=30)
            self.analytics_cache['recent_trends'] = trends.data
            
            # Run risk predictions
            risk_predictions = await self.predict_future_risk(prediction_horizon_hours=72)
            self.analytics_cache['risk_predictions'] = [
                {
                    'risk_level': pred.risk_level.value,
                    'risk_score': pred.risk_score,
                    'time_window': pred.time_window,
                    'probability': pred.probability
                }
                for pred in risk_predictions
            ]
            
            # Run cluster analysis
            clusters = await self.cluster_fire_patterns()
            self.analytics_cache['pattern_clusters'] = clusters
            
            logger.info("Periodic analytics completed successfully")
            
        except Exception as e:
            logger.error(f"Error in periodic analytics: {e}")
    
    def _calculate_base_risk(self, prediction_time: datetime, location: Optional[Tuple[float, float]]) -> float:
        """Calculate base risk from historical patterns"""
        # Find similar historical conditions
        similar_events = []
        month = prediction_time.month
        hour = prediction_time.hour
        
        for event in self.fire_events:
            if abs(event.timestamp.month - month) <= 1:
                if location:
                    distance = np.sqrt((event.latitude - location[0])**2 + (event.longitude - location[1])**2)
                    if distance < 0.5:  # Within 0.5 degree
                        similar_events.append(event)
                else:
                    similar_events.append(event)
        
        if not similar_events:
            return 0.3  # Default moderate risk
        
        # Calculate average risk from similar events
        avg_confidence = np.mean([event.confidence for event in similar_events])
        severity_weights = {'low': 0.3, 'medium': 0.6, 'high': 0.9}
        avg_severity = np.mean([severity_weights[event.severity] for event in similar_events])
        
        return (avg_confidence + avg_severity) / 2
    
    def _get_seasonal_factor(self, prediction_time: datetime) -> float:
        """Get seasonal adjustment factor"""
        month = prediction_time.month
        
        # Fire season typically peaks in summer/fall
        seasonal_factors = {
            1: 0.4, 2: 0.3, 3: 0.5, 4: 0.7, 5: 0.8, 6: 1.0,
            7: 1.2, 8: 1.3, 9: 1.2, 10: 1.0, 11: 0.6, 12: 0.4
        }
        
        return seasonal_factors.get(month, 0.7)
    
    def _generate_recommendations(self, risk_level: RiskLevel, risk_score: float) -> List[str]:
        """Generate risk-based recommendations"""
        recommendations = []
        
        if risk_level in [RiskLevel.HIGH, RiskLevel.EXTREME]:
            recommendations.extend([
                "Increase fire patrol frequency",
                "Prepare evacuation routes",
                "Alert emergency services",
                "Monitor weather conditions closely"
            ])
        
        if risk_level in [RiskLevel.MODERATE, RiskLevel.HIGH, RiskLevel.EXTREME]:
            recommendations.extend([
                "Restrict outdoor burning",
                "Increase public awareness campaigns",
                "Check and maintain firefighting equipment"
            ])
        
        if risk_score > 0.7:
            recommendations.append("Consider pre-positioning firefighting resources")
        
        return recommendations
    
    def _identify_risk_factors(self, risk_score: float, seasonal_factor: float, weather_factor: float) -> List[str]:
        """Identify contributing risk factors"""
        factors = []
        
        if seasonal_factor > 1.0:
            factors.append("High fire season")
        
        if weather_factor > 1.1:
            factors.append("Adverse weather conditions")
        
        if risk_score > 0.6:
            factors.append("Historical fire activity in area")
        
        return factors
    
    def _identify_peak_periods(self, daily_counts: Dict) -> List[str]:
        """Identify peak activity periods"""
        if not daily_counts:
            return []
        
        max_count = max(daily_counts.values())
        peak_days = [day.isoformat() for day, count in daily_counts.items() if count >= max_count * 0.8]
        
        return peak_days[:5]  # Return top 5 peak days
    
    def _describe_anomaly(self, data_point: Dict, score: float) -> str:
        """Generate anomaly description"""
        if score < -0.7:
            return "Highly unusual fire conditions detected"
        elif score < -0.5:
            return "Moderate anomaly in fire risk patterns"
        else:
            return "Minor deviation from normal patterns"
    
    def _analyze_temporal_pattern(self, events: List[FireEvent]) -> Dict[str, Any]:
        """Analyze temporal patterns in event cluster"""
        hours = [event.timestamp.hour for event in events]
        months = [event.timestamp.month for event in events]
        
        return {
            'peak_hour': int(np.bincount(hours).argmax()),
            'peak_month': int(np.bincount(months).argmax()),
            'temporal_spread': float(np.std(hours))
        }
    
    def _analyze_weather_pattern(self, events: List[FireEvent]) -> Dict[str, Any]:
        """Analyze weather patterns in event cluster"""
        temps = [event.weather_conditions['temperature'] for event in events]
        humidity = [event.weather_conditions['humidity'] for event in events]
        wind = [event.weather_conditions['wind_speed'] for event in events]
        
        return {
            'avg_temperature': float(np.mean(temps)),
            'avg_humidity': float(np.mean(humidity)),
            'avg_wind_speed': float(np.mean(wind))
        }
    
    def _analyze_terrain_pattern(self, events: List[FireEvent]) -> Dict[str, Any]:
        """Analyze terrain patterns in event cluster"""
        elevations = [event.terrain_features['elevation'] for event in events]
        slopes = [event.terrain_features['slope'] for event in events]
        vegetation = [event.terrain_features['vegetation_density'] for event in events]
        
        return {
            'avg_elevation': float(np.mean(elevations)),
            'avg_slope': float(np.mean(slopes)),
            'avg_vegetation_density': float(np.mean(vegetation))
        }
    
    async def _calculate_point_risk(self, lat: float, lon: float) -> float:
        """Calculate fire risk for a specific geographic point"""
        # Find nearby historical events
        nearby_events = []
        for event in self.fire_events:
            distance = np.sqrt((event.latitude - lat)**2 + (event.longitude - lon)**2)
            if distance < 0.1:  # Within 0.1 degree
                nearby_events.append(event)
        
        if not nearby_events:
            return 0.2  # Low base risk
        
        # Calculate risk based on nearby events
        total_area = sum(event.area_burned for event in nearby_events)
        avg_confidence = np.mean([event.confidence for event in nearby_events])
        
        # Normalize and combine factors
        area_factor = min(total_area / 1000, 1.0)  # Normalize by 1000 acres
        
        return (area_factor + avg_confidence) / 2

# Global analytics engine instance
analytics_engine = AdvancedAnalyticsEngine()
