import { useState, useCallback, useEffect } from 'react';
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
  status: 'operational' | 'degraded' | 'healthy'; // Added 'healthy'
  // Add any other properties your API returns
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
  useQuery<SystemStatusResponse, Error>({
    queryKey: ['system-status'],
    queryFn: () => api.getSystemStatus(),
    refetchInterval: 30000,
    onSuccess: (data) => {
      if (data.status === 'healthy' || data.status === 'operational') {
        setSystemStatus('operational');
      } else {
        setSystemStatus('degraded');
      }
    },
    onError: () => {
      setSystemStatus('offline');
    },
  });

  // Get system metrics
  useQuery<any, Error>({
    queryKey: ['system-metrics'],
    queryFn: () => api.getMetrics(),
    refetchInterval: 10000,
    onSuccess: (data) => {
      setMetrics(data);
    },
  });

  // Run fire prediction
  const runPredictionMutation = useMutation<
      PredictionResponse,
      AxiosError<ApiErrorResponse>,
      PredictionRequest
  >({
    mutationFn: (request) => api.runPrediction(request),
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

  // ... (rest of the hook)
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
    // Add other mutations and functions if they exist in your file
  };
}