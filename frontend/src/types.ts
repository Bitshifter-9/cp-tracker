export interface Problem {
    _id: string;
    name: string;
    link: string;
    rating: string;
    platform: 'TLE' | 'USACO' | 'CSES' | 'Custom';
    sheet: string;
    order: number;
    createdBy: string;
    teamId: string;
}

export interface UserProgress {
    _id: string;
    teamId: string;
    username: string;
    problemId: string | Problem;
    status: 'solved' | 'todo' | 'revision' | 'skipped' | 'none';
    solvedAt?: string;
    notes?: string;
    updatedAt?: string;
}

export interface Team {
    _id: string;
    teamId: string;
    members: { username: string }[];
    createdAt: Date;
}

export interface CustomSheet {
    _id: string;
    name: string;
    createdBy: string;
    teamId: string;
    createdAt: Date;
}

export interface Contest {
    _id: string;
    teamId: string;
    name: string;
    platform: 'Codeforces' | 'LeetCode' | 'CodeChef' | 'Other';
    date: string;
    link?: string;
    createdBy: string;
    createdAt: string;
}

export interface LeaderboardEntry {
    username: string;
    score: number;
    solvedCount: number;
    weightedScore?: number;
}

export interface ToLearnTopic {
    _id: string;
    teamId: string;
    username: string;
    topic: string;
    description: string;
    status: 'not-started' | 'learning' | 'completed' | 'on-hold';
    priority: 'low' | 'medium' | 'high';
    resources: string[];
    createdAt: string;
    updatedAt: string;
}

export interface AuthResponse {
    token: string;
    teamId: string;
    username: string;
}
