import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';

const API_URL = import.meta.env.VITE_API_URL || 'https://digital-risk-4k8i.onrender.com';

const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const submitTransaction = async (userId: string, amount: number) => {
  const response = await apiClient.post('/transaction', {
    user_id: userId,
    amount,
    idempotency_key: uuidv4(), // Generate unique key on client side to prevent duplicate submissions
  });
  return response.data;
};

export const getUserSummary = async (userId: string) => {
  const response = await apiClient.get(`/summary/${userId}`);
  return response.data;
};

export const getRanking = async () => {
  const response = await apiClient.get('/ranking');
  return response.data;
};

export const getRiskAnalysis = async (userId: string) => {
  const response = await apiClient.get(`/risk-analysis/${userId}`);
  return response.data;
};

export const getAuditLogs = async (userId: string) => {
  const response = await apiClient.get(`/audit-logs/${userId}`);
  return response.data;
};

export const getSystemStats = async () => {
  const response = await apiClient.get('/system-stats');
  return response.data;
};

export const getSystemActivityFeed = async () => {
  const response = await apiClient.get('/activity-feed');
  return response.data;
};
