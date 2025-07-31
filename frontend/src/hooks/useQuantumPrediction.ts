import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useFirePredictionStore } from '@/lib/store';
import toast from 'react-hot-toast';
import { AxiosError } from 'axios';

// --- Type Definitions ---
interface PredictionRequest {
  location: { latitude: number; longitude: number };
  radius: number;
  timeHorizon: number;
  model: string;
  useQuantumHardware?: boolean;
  includeEmberAnalysis?: boolean;
}

interface PredictionResponse {
  prediction_id: string;
  status: string;
  timestamp: string;
  location: {
    latitude: number;
    longitude: number;
    radius_km: number;
  };
  predictions: any[];
  metadata: {
    model_type: string;
    execution_time: number;
    quantum_backend: string;
    accuracy_estimate: number;
  };
  quantum_metrics?: any;
  warnings: string[];
}

interface SystemStatusResponse {
  status: 'operational' | 'degraded' | 'healthy';
}

interface ApiErrorResponse {
  detail: string;
}

export function useQuantumPrediction() {
  const queryClient = useQueryClient();
  const {
    setCurrentPrediction,
    addPredictionToHistory,
    setQuantumMetrics,
  } = useFirePredictionStore();

  const [systemStatus, setSystemStatus] = useState<'operational' | 'degraded' | 'offline'>('operational');
  const [metrics, setMetrics] = useState<any>(null);

  // Check system status
  const { data: systemStatusData } = useQuery<SystemStatusResponse, Error>({
    queryKey: ['system-status'],
    queryFn: async () => (await api.getSystemStatus()).data,
    refetchInterval: 30000,
  });

  useEffect(() => {
    if (systemStatusData) {
      if (systemStatusData.status === 'healthy' || systemStatusData.status === 'operational') {
        setSystemStatus('operational');
      } else {
        setSystemStatus('degraded');
      }
    }
  }, [systemStatusData]);

  // Get system metrics
  const { data: metricsData } = useQuery<any, Error>({
    queryKey: ['system-metrics'],
    queryFn: async () => (await api.getMetrics()).data,
    refetchInterval: 10000,
  });

  useEffect(() => {
    if (metricsData) {
      setMetrics(metricsData);
    }
  }, [metricsData]);


  // Run fire prediction
  const runPredictionMutation = useMutation<
      PredictionResponse,
      AxiosError<ApiErrorResponse>,
      PredictionRequest
  >({
    mutationFn: async (request: PredictionRequest) => {
      const response = await api.runPrediction(request);
      return response.data;
    },
    onSuccess: (data) => {
      setCurrentPrediction(data);
      addPredictionToHistory(data);
      if (data.quantum_metrics) {
        setQuantumMetrics(data.quantum_metrics);
      }
      toast.success(`Prediction completed in ${data.metadata.execution_time.toFixed(1)}s`);
      queryClient.invalidateQueries({ queryKey: ['predictions'] });
    },
    onError: (error) => {
      toast.error(error.response?.data?.detail || 'Failed to run prediction');
    },
  });


  const { currentPrediction, predictionHistory, quantumMetrics } = useFirePredictionStore();

  return {
    systemStatus,
    metrics,
    currentPrediction,
    predictionHistory,
    quantumMetrics,
    runPrediction: runPredictionMutation.mutate,
    isPending: runPredictionMutation.isPending,
    isRunningPrediction: runPredictionMutation.isPending,
    error: runPredictionMutation.error,
  };
}