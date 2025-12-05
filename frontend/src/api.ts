import axios from 'axios';
import type { Problem, UserProgress, CustomSheet, Contest, LeaderboardEntry, AuthResponse, ToLearnTopic } from './types';

// Use environment variable for API URL in production, fallback to localhost for development
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

const api = axios.create({
    baseURL: API_BASE_URL,
});

// Add token to requests
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Auth
export const createTeam = async (username: string, password: string): Promise<AuthResponse> => {
    const { data } = await api.post('/auth/create-team', { username, password });
    return data;
};

export const joinTeam = async (teamId: string, username: string, password: string): Promise<AuthResponse> => {
    const { data } = await api.post('/auth/join-team', { teamId, username, password });
    return data;
};

export const login = async (teamId: string, username: string, password: string): Promise<AuthResponse> => {
    const { data } = await api.post('/auth/login', { teamId, username, password });
    return data;
};

export const getTeamMembers = async (): Promise<string[]> => {
    const { data } = await api.get('/auth/team-members');
    return data.members;
};

// Problems
export const getProblems = async (sheet: string, search?: string): Promise<Problem[]> => {
    const { data } = await api.get(`/problems/${sheet}`, { params: { search } });
    return data.problems;
};

export const addProblem = async (problem: {
    name: string;
    link: string;
    rating?: string;
    sheet: string;
    platform?: string;
}): Promise<Problem> => {
    const { data } = await api.post('/problems', problem);
    return data.problem;
};

export const reorderProblem = async (problemId: string, direction: 'up' | 'down'): Promise<void> => {
    await api.put(`/problems/${problemId}/reorder`, { direction });
};

export const searchProblems = async (query: string): Promise<Problem[]> => {
    const { data } = await api.get('/problems/search/all', { params: { q: query } });
    return data.problems;
};

// Progress
export const getAllProgress = async (): Promise<UserProgress[]> => {
    const { data } = await api.get('/progress');
    return data.progress;
};

export const updateProgress = async (problemId: string, status: string): Promise<UserProgress> => {
    const { data } = await api.put(`/progress/${problemId}`, { status });
    return data.progress;
};

export const getUserProgress = async (username: string): Promise<UserProgress[]> => {
    const { data } = await api.get(`/progress/user/${username}`);
    return data.progress;
};

export const updateNotes = async (problemId: string, notes: string): Promise<void> => {
    await api.put(`/progress/${problemId}/notes`, { notes });
};

export const getUserStreak = async (username: string): Promise<number> => {
    const { data } = await api.get(`/progress/streak/${username}`);
    return data.streak;
};

// Custom Sheets
export const getCustomSheets = async (): Promise<CustomSheet[]> => {
    const { data } = await api.get('/sheets/custom');
    return data.sheets;
};

export const createCustomSheet = async (name: string): Promise<CustomSheet> => {
    const { data } = await api.post('/sheets/custom', { name });
    return data.sheet;
};

export const renameCustomSheet = async (id: string, name: string): Promise<CustomSheet> => {
    const { data } = await api.put(`/sheets/custom/${id}`, { name });
    return data.sheet;
};

export const deleteCustomSheet = async (id: string): Promise<void> => {
    await api.delete(`/sheets/custom/${id}`);
};

// Contests
export const getContests = async (): Promise<Contest[]> => {
    const { data } = await api.get('/contests');
    return data.contests;
};

export const addContest = async (contest: { name: string; platform: string; date: string; link?: string }): Promise<Contest> => {
    const { data } = await api.post('/contests', contest);
    return data.contest;
};

export const deleteContest = async (id: string): Promise<void> => {
    await api.delete(`/contests/${id}`);
};

// Leaderboard
export const getLeaderboard = async (): Promise<LeaderboardEntry[]> => {
    const { data } = await api.get('/leaderboard');
    return data.leaderboard;
};

// Profile Management
export const updateProfile = async (username: string, password?: string) => {
    const response = await api.put('/profile', { username, password });
    return response.data;
};

export const updateTeamName = async (teamName: string) => {
    const response = await api.put('/profile/team-name', { teamName });
    return response.data;
};

export const getTeamInfo = async () => {
    const response = await api.get('/profile/team-info');
    return response.data;
};

// To Learn Topics
export const getToLearnTopics = async (): Promise<ToLearnTopic[]> => {
    const { data } = await api.get('/tolearn');
    return data.topics;
};

export const createToLearnTopic = async (topic: {
    topic: string;
    description?: string;
    priority?: 'low' | 'medium' | 'high';
    resources?: string[];
}): Promise<ToLearnTopic> => {
    const { data } = await api.post('/tolearn', topic);
    return data.topic;
};

export const updateToLearnTopic = async (id: string, updates: {
    topic?: string;
    description?: string;
    priority?: 'low' | 'medium' | 'high';
    resources?: string[];
    status?: 'not-started' | 'learning' | 'completed' | 'on-hold';
}): Promise<ToLearnTopic> => {
    const { data } = await api.put(`/tolearn/${id}`, updates);
    return data.topic;
};

export const updateToLearnStatus = async (id: string, status: string): Promise<ToLearnTopic> => {
    const { data } = await api.put(`/tolearn/${id}/status`, { status });
    return data.topic;
};

export const deleteToLearnTopic = async (id: string): Promise<void> => {
    await api.delete(`/tolearn/${id}`);
};
