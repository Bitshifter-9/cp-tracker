import { useState, useEffect } from 'react';
import {
  Code2, Trophy, Users, Calendar, Plus, Search, ExternalLink,
  LogOut, ChevronUp, ChevronDown, Trash2, Settings, Edit2, FileText, BookOpen
} from 'lucide-react';
import * as api from './api';
import type { Problem, UserProgress, CustomSheet, Contest, LeaderboardEntry, ToLearnTopic } from './types';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState('');
  const [teamId, setTeamId] = useState('');
  const [currentView, setCurrentView] = useState(() => {
    // Restore last view from localStorage, default to 'TLE' if not found
    return localStorage.getItem('currentView') || 'TLE';
  });
  const [teamMembers, setTeamMembers] = useState<string[]>([]);
  const [streaks, setStreaks] = useState<Record<string, number>>({});

  useEffect(() => {
    const token = localStorage.getItem('token');
    const savedUsername = localStorage.getItem('username');
    const savedTeamId = localStorage.getItem('teamId');

    if (token && savedUsername && savedTeamId) {
      setIsAuthenticated(true);
      setUsername(savedUsername);
      setTeamId(savedTeamId);
      loadTeamData();
    }
  }, []);

  const loadTeamData = async () => {
    try {
      const members = await api.getTeamMembers();
      setTeamMembers(members);

      // Load streaks for all members
      const streakData: Record<string, number> = {};
      for (const member of members) {
        const streak = await api.getUserStreak(member);
        streakData[member] = streak;
      }
      setStreaks(streakData);
    } catch (error) {
      console.error('Failed to load team data:', error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    localStorage.removeItem('teamId');
    setIsAuthenticated(false);
    setUsername('');
    setTeamId('');
  };

  const handleViewChange = (view: string) => {
    setCurrentView(view);
    localStorage.setItem('currentView', view);
  };

  if (!isAuthenticated) {
    return <LoginPage onLogin={(user, team) => {
      setIsAuthenticated(true);
      setUsername(user);
      setTeamId(team);
      loadTeamData();
    }} />;
  }

  return (
    <div className="app">
      <Sidebar
        currentView={currentView}
        onViewChange={handleViewChange}
        username={username}
        teamId={teamId}
        teamMembers={teamMembers}
        streaks={streaks}
        onLogout={handleLogout}
      />
      <MainContent
        currentView={currentView}
        username={username}
        teamMembers={teamMembers}

      />
    </div>
  );
}

// Login Component
function LoginPage({ onLogin }: { onLogin: (username: string, teamId: string) => void }) {
  const [mode, setMode] = useState<'create' | 'join' | 'login'>('login');
  const [formData, setFormData] = useState({ teamId: '', username: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      let response;
      if (mode === 'create') {
        response = await api.createTeam(formData.username, formData.password);
      } else if (mode === 'join') {
        response = await api.joinTeam(formData.teamId, formData.username, formData.password);
      } else {
        response = await api.login(formData.teamId, formData.username, formData.password);
      }

      localStorage.setItem('token', response.token);
      localStorage.setItem('username', response.username);
      localStorage.setItem('teamId', response.teamId);
      onLogin(response.username, response.teamId);
    } catch (err: any) {
      setError(err.response?.data?.error || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <h1>🔥 CP Tracker</h1>
        <p>Track your competitive programming progress with your team</p>

        <div className="login-tabs">
          <button
            className={`login-tab ${mode === 'login' ? 'active' : ''}`}
            onClick={() => setMode('login')}
          >
            Login
          </button>
          <button
            className={`login-tab ${mode === 'join' ? 'active' : ''}`}
            onClick={() => setMode('join')}
          >
            Join Team
          </button>
          <button
            className={`login-tab ${mode === 'create' ? 'active' : ''}`}
            onClick={() => setMode('create')}
          >
            Create Team
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {mode !== 'create' && (
            <div className="form-group">
              <label>Team ID</label>
              <input
                type="text"
                value={formData.teamId}
                onChange={(e) => setFormData({ ...formData, teamId: e.target.value })}
                required
                placeholder="Enter your team ID"
              />
            </div>
          )}

          <div className="form-group">
            <label>Username</label>
            <input
              type="text"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              required
              placeholder="Enter your username"
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
              placeholder="Enter your password"
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <button type="submit" className="btn" disabled={loading} style={{ width: '100%' }}>
            {loading ? 'Please wait...' : mode === 'create' ? 'Create Team' : mode === 'join' ? 'Join Team' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  );
}

// Sidebar Component
function Sidebar({
  currentView,
  onViewChange,
  username,
  teamId,
  teamMembers,
  streaks,
  onLogout
}: {
  currentView: string;
  onViewChange: (view: string) => void;
  username: string;
  teamId: string;
  teamMembers: string[];
  streaks: Record<string, number>;
  onLogout: () => void;
}) {
  const [customSheets, setCustomSheets] = useState<CustomSheet[]>([]);
  const [showAddProblemModal, setShowAddProblemModal] = useState(false);
  const [showCreateSheetModal, setShowCreateSheetModal] = useState(false);
  const [showTeamIdCopied, setShowTeamIdCopied] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showTeamNameModal, setShowTeamNameModal] = useState(false);
  const [teamName, setTeamName] = useState('');

  useEffect(() => {
    loadCustomSheets();
    loadTeamInfo();
  }, []);

  const loadCustomSheets = async () => {
    try {
      const sheets = await api.getCustomSheets();
      setCustomSheets(sheets);
    } catch (error) {
      console.error('Failed to load custom sheets:', error);
    }
  };

  const loadTeamInfo = async () => {
    try {
      const info = await api.getTeamInfo();
      setTeamName(info.teamName);
    } catch (error) {
      console.error('Failed to load team info:', error);
    }
  };

  const handleCopyTeamId = () => {
    navigator.clipboard.writeText(teamId);
    setShowTeamIdCopied(true);
    setTimeout(() => setShowTeamIdCopied(false), 2000);
  };

  const handleCreateSheet = async (name: string) => {
    try {
      await api.createCustomSheet(name);
      await loadCustomSheets();
      setShowCreateSheetModal(false);
    } catch (error) {
      console.error('Failed to create sheet:', error);
    }
  };

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <h1 style={{ margin: 0 }}>🔥 CP Tracker</h1>
          <button
            className="icon-btn"
            onClick={() => setShowProfileModal(true)}
            title="Edit Profile"
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}
          >
            <Settings size={20} />
          </button>
        </div>
        <div style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
          {username}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
          <span style={{ fontSize: '13px', color: 'var(--text-tertiary)' }}>
            {teamName || `Team ${teamId}`}
          </span>
          <button
            className="icon-btn"
            onClick={() => setShowTeamNameModal(true)}
            title="Edit Team Name"
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)', padding: '2px' }}
          >
            <Edit2 size={14} />
          </button>
        </div>
        <div className="team-id-display" onClick={handleCopyTeamId} style={{ cursor: 'pointer', fontSize: '12px' }}>
          ID: {teamId}
          {showTeamIdCopied && <span style={{ marginLeft: '8px', color: 'var(--accent-success)' }}>✓ Copied!</span>}
        </div>
      </div>

      {/* Global Add Problem Button */}
      <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-color)' }}>
        <button
          className="btn"
          onClick={() => setShowAddProblemModal(true)}
          style={{ width: '100%' }}
        >
          <Plus size={18} />
          Add Problem
        </button>
      </div>

      <div className="sidebar-nav">
        <div className="nav-section">
          <div className="nav-section-title">Master Sheets</div>
          <div
            className={`nav-item ${currentView === 'TLE' ? 'active' : ''}`}
            onClick={() => onViewChange('TLE')}
          >
            <Code2 />
            <span>TLE Eliminators</span>
          </div>
          <div
            className={`nav-item ${currentView === 'USACO' ? 'active' : ''}`}
            onClick={() => onViewChange('USACO')}
          >
            <Code2 />
            <span>USACO Guide</span>
          </div>
          <div
            className={`nav-item ${currentView === 'CSES' ? 'active' : ''}`}
            onClick={() => onViewChange('CSES')}
          >
            <Code2 />
            <span>CSES Problemset</span>
          </div>
        </div>

        {customSheets.length > 0 && (
          <div className="nav-section">
            <div className="nav-section-title">Custom Sheets</div>
            {customSheets.map(sheet => (
              <div
                key={sheet._id}
                className={`nav-item ${currentView === `Custom:${sheet._id}` ? 'active' : ''}`}
                onClick={() => onViewChange(`Custom:${sheet._id}`)}
              >
                <Code2 />
                <span>{sheet.name}</span>
              </div>
            ))}
          </div>
        )}

        <div className="nav-section">
          <div className="nav-section-title">My Progress</div>
          <div
            className={`nav-item ${currentView === 'MySheet' ? 'active' : ''}`}
            onClick={() => onViewChange('MySheet')}
          >
            <Users />
            <span>My Sheet</span>
          </div>
        </div>

        <div className="nav-section">
          <div className="nav-section-title">Teammates</div>
          {teamMembers.filter(m => m !== username).map(member => (
            <div
              key={member}
              className={`nav-item ${currentView === `User:${member}` ? 'active' : ''}`}
              onClick={() => onViewChange(`User:${member}`)}
            >
              <Users />
              <span>{member}</span>
              {streaks[member] > 0 && (
                <span className="streak">
                  {streaks[member]}🔥
                </span>
              )}
            </div>
          ))}
        </div>

        <div className="nav-section">
          <div style={{ padding: '0 20px' }}>
            <button
              className="btn btn-secondary"
              onClick={() => setShowCreateSheetModal(true)}
              style={{ width: '100%', marginBottom: '12px' }}
            >
              <Plus size={18} />
              Create Sheet
            </button>
          </div>
        </div>

        <div className="nav-section">
          <div className="nav-section-title">Other</div>
          <div
            className={`nav-item ${currentView === 'Leaderboard' ? 'active' : ''}`}
            onClick={() => onViewChange('Leaderboard')}
          >
            <Trophy />
            <span>Leaderboard</span>
          </div>
          <div
            className={`nav-item ${currentView === 'ToLearn' ? 'active' : ''}`}
            onClick={() => onViewChange('ToLearn')}
          >
            <BookOpen />
            <span>To Learn</span>
          </div>
          <div
            className={`nav-item ${currentView === 'Contests' ? 'active' : ''}`}
            onClick={() => onViewChange('Contests')}
          >
            <Calendar />
            <span>Contests</span>
          </div>
        </div>
      </div>

      <div style={{ padding: '20px', borderTop: '1px solid var(--border-color)' }}>
        <button className="btn btn-secondary" onClick={onLogout} style={{ width: '100%' }}>
          <LogOut size={18} />
          Logout
        </button>
      </div>

      {showAddProblemModal && (
        <GlobalAddProblemModal
          onClose={() => setShowAddProblemModal(false)}
          onSuccess={() => {
            setShowAddProblemModal(false);
            window.location.reload(); // Refresh to show new problem
          }}
          customSheets={customSheets}
        />
      )}

      {showCreateSheetModal && (
        <CreateSheetModal
          onClose={() => setShowCreateSheetModal(false)}
          onSuccess={handleCreateSheet}
        />
      )}

      {showProfileModal && (
        <ProfileEditModal
          onClose={() => setShowProfileModal(false)}
          onSuccess={() => {
            setShowProfileModal(false);
            window.location.reload(); // Reload to update username display
          }}
          currentUsername={username}
        />
      )}

      {showTeamNameModal && (
        <TeamNameEditModal
          onClose={() => setShowTeamNameModal(false)}
          onSuccess={(newName) => {
            setTeamName(newName);
            setShowTeamNameModal(false);
          }}
          currentTeamName={teamName || `Team ${teamId}`}
        />
      )}
    </div>
  );
}

// Main Content Component
function MainContent({
  currentView,
  username,
  teamMembers
}: {
  currentView: string;
  username: string;
  teamMembers: string[];
}) {
  const [contests, setContests] = useState<Contest[]>([]);

  const loadContests = async () => {
    try {
      const data = await api.getContests();
      setContests(data);
    } catch (error) {
      console.error('Failed to load contests:', error);
    }
  };

  useEffect(() => {
    loadContests();
  }, []);

  const upcomingContest = contests
    .filter(c => new Date(c.date) > new Date())
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0];

  return (
    <div className="main-content">
      {upcomingContest && (
        <div className="contest-banner">
          <div className="contest-banner-content">
            <Calendar size={24} />
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
                <h3 style={{ margin: 0 }}>{upcomingContest.name}</h3>
                <span
                  className="platform-badge"
                  style={{
                    padding: '4px 12px',
                    borderRadius: '12px',
                    fontSize: '11px',
                    fontWeight: 600,
                    background: upcomingContest.platform === 'Codeforces' ? 'linear-gradient(135deg, #1f8ef1, #0f5fc7)' :
                      upcomingContest.platform === 'LeetCode' ? 'linear-gradient(135deg, #ffa116, #f57c00)' :
                        upcomingContest.platform === 'CodeChef' ? 'linear-gradient(135deg, #5b4638, #3e2f24)' :
                          'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))',
                    color: '#fff',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}
                >
                  {upcomingContest.platform}
                </span>
              </div>
              <p>{new Date(upcomingContest.date).toLocaleString()}</p>
            </div>
          </div>
          {upcomingContest.link && (
            <a href={upcomingContest.link} target="_blank" rel="noopener noreferrer" className="btn">
              <ExternalLink size={18} />
              Visit
            </a>
          )}
        </div>
      )}

      <div className="sheet-view">
        {currentView === 'TLE' && <SheetView sheet="TLE" username={username} teamMembers={teamMembers} />}
        {currentView === 'USACO' && <SheetView sheet="USACO" username={username} teamMembers={teamMembers} />}
        {currentView === 'CSES' && <SheetView sheet="CSES" username={username} teamMembers={teamMembers} />}
        {currentView === 'MySheet' && <UserSheetView username={username} teamMembers={teamMembers} />}
        {currentView === 'Leaderboard' && <LeaderboardView />}
        {currentView === 'ToLearn' && <ToLearnView />}
        {currentView === 'Contests' && <ContestsView contests={contests} onRefresh={loadContests} />}
        {currentView.startsWith('User:') && (
          <UserSheetView username={currentView.split(':')[1]} teamMembers={teamMembers} readOnly />
        )}
        {currentView.startsWith('Custom:') && (
          <SheetView sheet={currentView.split(':')[1]} username={username} teamMembers={teamMembers} isCustom />
        )}
      </div>
    </div>
  );
}

// Helper function to format relative time
function getRelativeTime(dateString?: string): string {
  if (!dateString) return 'Never';

  const now = new Date();
  const date = new Date(dateString);
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return 'Just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 4) return `${weeks}w ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

// Sheet View Component
function SheetView({ sheet, username, teamMembers, isCustom = false }: { sheet: string; username: string; teamMembers: string[]; isCustom?: boolean }) {
  const [problems, setProblems] = useState<Problem[]>([]);
  const [progress, setProgress] = useState<UserProgress[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  const [sheetName, setSheetName] = useState('');
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [selectedProblem, setSelectedProblem] = useState<Problem | null>(null);
  const [currentNotes, setCurrentNotes] = useState('');

  useEffect(() => {
    if (isCustom) {
      loadCustomSheetName();
    }
    loadData();
  }, [sheet, search, isCustom]);

  const loadCustomSheetName = async () => {
    try {
      const sheets = await api.getCustomSheets();
      const currentSheet = sheets.find(s => s._id === sheet);
      if (currentSheet) {
        setSheetName(currentSheet.name);
      }
    } catch (error) {
      console.error('Failed to load custom sheet name:', error);
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [problemsData, progressData] = await Promise.all([
        api.getProblems(sheet, search),
        api.getAllProgress()
      ]);
      setProblems(problemsData);
      setProgress(progressData);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (problemId: string, status: string) => {
    try {
      await api.updateProgress(problemId, status);
      await loadData();
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  };

  const handleReorder = async (problemId: string, direction: 'up' | 'down') => {
    try {
      await api.reorderProblem(problemId, direction);
      await loadData();
    } catch (error) {
      console.error('Failed to reorder:', error);
    }
  };

  const getExternalLink = () => {
    if (sheet === 'TLE') return 'https://www.tle-eliminators.com/cp-sheet';
    if (sheet === 'USACO') return 'https://usaco.guide/';
    if (sheet === 'CSES') return 'https://cses.fi/problemset/';
    return '';
  };

  const handleOpenNotes = (problem: Problem) => {
    setSelectedProblem(problem);
    const userProgress = progress.find(
      p => (typeof p.problemId === 'object' ? p.problemId._id : p.problemId) === problem._id && p.username === username
    );
    setCurrentNotes(userProgress?.notes || '');
    setShowNotesModal(true);
  };

  const handleSaveNotes = async () => {
    if (!selectedProblem) return;
    try {
      await api.updateNotes(selectedProblem._id, currentNotes);

      // Immediately update local progress state so notes appear when reopening
      setProgress(prevProgress => {
        const updated = prevProgress.map(p =>
          (typeof p.problemId === 'object' ? p.problemId._id : p.problemId) === selectedProblem._id && p.username === username
            ? { ...p, notes: currentNotes, updatedAt: new Date().toISOString() }
            : p
        );
        return updated;
      });

      // Also reload from backend to ensure sync
      await loadData();
      setShowNotesModal(false);
    } catch (error) {
      console.error('Failed to save notes:', error);
      alert('Failed to save notes. Please try again.');
    }
  };

  // Sort problems by rating (numerically for TLE, then by order)
  const sortedProblems = [...problems].sort((a, b) => {
    // For TLE, sort numerically by rating
    if (sheet === 'TLE') {
      const ratingA = parseInt(a.rating) || 0;
      const ratingB = parseInt(b.rating) || 0;
      if (ratingA !== ratingB) return ratingA - ratingB;
    }
    // For USACO, sort by difficulty order
    else if (sheet === 'USACO') {
      const order = { 'Bronze': 1, 'Silver': 2, 'Gold': 3, 'Platinum': 4 };
      const orderA = order[a.rating as keyof typeof order] || 999;
      const orderB = order[b.rating as keyof typeof order] || 999;
      if (orderA !== orderB) return orderA - orderB;
    }
    // For CSES, sort by category order
    else if (sheet === 'CSES') {
      const order = { 'Intro': 1, 'Sorting': 2, 'DP': 3, 'Graph': 4 };
      const orderA = order[a.rating as keyof typeof order] || 999;
      const orderB = order[b.rating as keyof typeof order] || 999;
      if (orderA !== orderB) return orderA - orderB;
    }
    // Then by order field
    return a.order - b.order;
  });

  const filteredProblems = sortedProblems.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return <div className="loading">Loading problems...</div>;
  }

  return (
    <>
      <div className="sheet-header">
        <div className="sheet-title">
          <h2>
            {isCustom
              ? (sheetName || 'Custom Sheet')
              : (sheet === 'TLE' ? 'TLE Eliminators' : sheet === 'USACO' ? 'USACO Guide' : 'CSES Problemset')
            }
          </h2>
          {!isCustom && (
            <a href={getExternalLink()} target="_blank" rel="noopener noreferrer">
              <ExternalLink size={16} />
              Visit Website
            </a>
          )}
        </div>
        <div className="sheet-actions">
          <div className="search-bar">
            <Search />
            <input
              type="text"
              placeholder="Search problems..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button className="btn" onClick={() => setShowAddModal(true)}>
            <Plus size={18} />
            Add Problem
          </button>
        </div>
      </div>

      <div className="problems-table">
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Problem</th>
                <th>Link</th>
                <th>Rating</th>
                {teamMembers.map(member => (
                  <th key={member}>{member}</th>
                ))}
                <th>Last Updated</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProblems.map((problem) => {
                const sameRatingProblems = filteredProblems.filter(p => p.rating === problem.rating);
                const indexInRating = sameRatingProblems.findIndex(p => p._id === problem._id);
                const canMoveUp = indexInRating > 0;
                const canMoveDown = indexInRating < sameRatingProblems.length - 1;

                const currentUserProgress = progress.find(
                  p => (typeof p.problemId === 'object' ? p.problemId._id : p.problemId) === problem._id && p.username === username
                );
                const hasNotes = currentUserProgress?.notes && currentUserProgress.notes.length > 0;

                return (
                  <tr key={problem._id}>
                    <td className="problem-name">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span>{problem.name}</span>
                        <button
                          onClick={() => handleOpenNotes(problem)}
                          className="icon-btn"
                          title={hasNotes ? "View/Edit Notes" : "Add Notes"}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            color: hasNotes ? 'var(--accent-primary)' : 'var(--text-tertiary)',
                            padding: '4px',
                            display: 'flex',
                            alignItems: 'center',
                            transition: 'all 0.2s ease'
                          }}
                        >
                          <FileText size={16} />
                        </button>
                      </div>
                    </td>
                    <td>
                      <a href={problem.link} target="_blank" rel="noopener noreferrer" className="problem-link">
                        View
                      </a>
                    </td>
                    <td>
                      <span className="rating-badge">{problem.rating}</span>
                    </td>
                    {teamMembers.map(member => {
                      const userProgress = progress.find(
                        p => (typeof p.problemId === 'object' ? p.problemId._id : p.problemId) === problem._id && p.username === member
                      );
                      const status = userProgress?.status || 'none';
                      const isCurrentUser = member === username;

                      return (
                        <td key={member}>
                          {isCurrentUser ? (
                            <select
                              className="status-dropdown"
                              value={status}
                              onChange={(e) => handleStatusChange(problem._id, e.target.value)}
                            >
                              <option value="none">-</option>
                              <option value="solved">✓ Solved</option>
                              <option value="todo">📝 Todo</option>
                              <option value="revision">🔄 Revision</option>
                              <option value="skipped">⏭ Skipped</option>
                            </select>
                          ) : (
                            <span className={`status-badge status-${status}`}>
                              {status === 'solved' && '✓ Solved'}
                              {status === 'todo' && '📝 Todo'}
                              {status === 'revision' && '🔄 Revision'}
                              {status === 'skipped' && '⏭ Skipped'}
                              {status === 'none' && '-'}
                            </span>
                          )}
                        </td>
                      );
                    })}
                    <td style={{ fontSize: '12px', color: 'var(--text-tertiary)' }} title={currentUserProgress?.updatedAt ? new Date(currentUserProgress.updatedAt).toLocaleString() : 'Never'}>
                      {getRelativeTime(currentUserProgress?.updatedAt)}
                    </td>
                    <td>
                      <div className="reorder-buttons">
                        <button
                          className="reorder-btn"
                          onClick={() => handleReorder(problem._id, 'up')}
                          disabled={!canMoveUp}
                        >
                          <ChevronUp size={14} />
                        </button>
                        <button
                          className="reorder-btn"
                          onClick={() => handleReorder(problem._id, 'down')}
                          disabled={!canMoveDown}
                        >
                          <ChevronDown size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {showAddModal && (
        <AddProblemModal
          sheet={sheet}
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            setShowAddModal(false);
            loadData();
          }}
        />
      )}

      {showNotesModal && selectedProblem && (
        <NotesModal
          onClose={() => setShowNotesModal(false)}
          onSave={handleSaveNotes}
          problemName={selectedProblem.name}
          notes={currentNotes}
          setNotes={setCurrentNotes}
        />
      )}
    </>
  );
}

// User Sheet View
function UserSheetView({ username, readOnly = false }: { username: string; teamMembers: string[]; readOnly?: boolean }) {
  const [progress, setProgress] = useState<UserProgress[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProgress();
  }, [username]);

  const loadProgress = async () => {
    setLoading(true);
    try {
      const data = await api.getUserProgress(username);
      setProgress(data);
    } catch (error) {
      console.error('Failed to load progress:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading progress...</div>;
  }

  return (
    <>
      <div className="sheet-header">
        <h2>{readOnly ? `${username}'s Sheet` : 'My Sheet'}</h2>
      </div>

      <div className="problems-table">
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Problem</th>
                <th>Status</th>
                <th>Platform</th>
                <th>Rating</th>
                <th>Last Updated</th>
              </tr>
            </thead>
            <tbody>
              {progress
                .sort((a, b) => {
                  // Sort by most recently updated first
                  const timeA = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
                  const timeB = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
                  return timeB - timeA; // Most recent first
                })
                .map(p => {
                  const problem = typeof p.problemId === 'object' ? p.problemId : null;
                  if (!problem) return null;

                  return (
                    <tr key={p._id}>
                      <td className="problem-name">{problem.name}</td>
                      <td>
                        <span className={`status-badge status-${p.status}`}>
                          {p.status === 'solved' && '✓ Solved'}
                          {p.status === 'todo' && '📝 Todo'}
                          {p.status === 'revision' && '🔄 Revision'}
                          {p.status === 'skipped' && '⏭ Skipped'}
                        </span>
                      </td>
                      <td>{problem.platform}</td>
                      <td>
                        <span className="rating-badge">{problem.rating}</span>
                      </td>
                      <td style={{ fontSize: '12px', color: 'var(--text-tertiary)' }} title={p.updatedAt ? new Date(p.updatedAt).toLocaleString() : 'Never'}>
                        {getRelativeTime(p.updatedAt)}
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

// To Learn View
function ToLearnView() {
  const [topics, setTopics] = useState<ToLearnTopic[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTopic, setEditingTopic] = useState<ToLearnTopic | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');

  useEffect(() => {
    loadTopics();
  }, []);

  const loadTopics = async () => {
    try {
      setLoading(true);
      const data = await api.getToLearnTopics();
      setTopics(data);
    } catch (error) {
      console.error('Failed to load topics:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (topicId: string, status: string) => {
    try {
      await api.updateToLearnStatus(topicId, status);
      await loadTopics();
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  };

  const handleDelete = async (topicId: string) => {
    if (!confirm('Are you sure you want to delete this topic?')) return;
    try {
      await api.deleteToLearnTopic(topicId);
      await loadTopics();
    } catch (error) {
      console.error('Failed to delete topic:', error);
    }
  };

  const handleEdit = (topic: ToLearnTopic) => {
    setEditingTopic(topic);
    setShowAddModal(true);
  };

  const filteredTopics = topics.filter(topic => {
    if (statusFilter !== 'all' && topic.status !== statusFilter) return false;
    if (priorityFilter !== 'all' && topic.priority !== priorityFilter) return false;
    return true;
  });

  if (loading) {
    return <div className="sheet-view"><p>Loading topics...</p></div>;
  }

  return (
    <>
      <div className="sheet-header">
        <div>
          <h2>📚 To Learn</h2>
          <p style={{ color: 'var(--text-tertiary)', fontSize: '14px' }}>
            Track topics and concepts you want to learn
          </p>
        </div>
        <button className="btn" onClick={() => { setEditingTopic(null); setShowAddModal(true); }}>
          <Plus size={18} />
          Add Topic
        </button>
      </div>

      <div className="filter-bar" style={{ marginBottom: '20px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
        <div>
          <label style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginRight: '8px' }}>Status:</label>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="status-dropdown" style={{ minWidth: '150px' }}>
            <option value="all">All</option>
            <option value="not-started">Not Started</option>
            <option value="learning">Learning</option>
            <option value="completed">Completed</option>
            <option value="on-hold">On Hold</option>
          </select>
        </div>
        <div>
          <label style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginRight: '8px' }}>Priority:</label>
          <select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)} className="status-dropdown" style={{ minWidth: '120px' }}>
            <option value="all">All</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
        <div style={{ marginLeft: 'auto', fontSize: '14px', color: 'var(--text-tertiary)' }}>
          {filteredTopics.length} topic{filteredTopics.length !== 1 ? 's' : ''}
        </div>
      </div>

      {filteredTopics.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-tertiary)' }}>
          <BookOpen size={48} style={{ opacity: 0.3, marginBottom: '16px' }} />
          <p>No topics found. Add your first topic to get started!</p>
        </div>
      ) : (
        <div className="topics-grid" style={{ display: 'grid', gap: '16px', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))' }}>
          {filteredTopics.map(topic => (
            <div key={topic._id} className="topic-card" style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '16px', transition: 'all 0.2s ease' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
                <h3 style={{ margin: 0, fontSize: '16px', flex: 1 }}>{topic.topic}</h3>
                <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
                  <button onClick={() => handleEdit(topic)} className="icon-btn" title="Edit" style={{ padding: '6px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-primary)' }}>
                    <Edit2 size={14} />
                  </button>
                  <button onClick={() => handleDelete(topic._id)} className="icon-btn" title="Delete" style={{ padding: '6px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444' }}>
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              {topic.description && <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '12px' }}>{topic.description}</p>}
              <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' }}>
                <span className={`priority-badge priority-${topic.priority}`}>{topic.priority.charAt(0).toUpperCase() + topic.priority.slice(1)} Priority</span>
                <select value={topic.status} onChange={(e) => handleStatusChange(topic._id, e.target.value)} className="status-dropdown" style={{ fontSize: '12px', padding: '4px 8px' }}>
                  <option value="not-started">Not Started</option>
                  <option value="learning">Learning</option>
                  <option value="completed">Completed</option>
                  <option value="on-hold">On Hold</option>
                </select>
              </div>
              {topic.resources && topic.resources.length > 0 && (
                <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '12px' }}>
                  <p style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginBottom: '8px' }}>Resources:</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {topic.resources.map((resource, idx) => (
                      <a key={idx} href={resource} target="_blank" rel="noopener noreferrer" className="problem-link" style={{ fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <ExternalLink size={12} />
                        {resource.length > 50 ? resource.substring(0, 50) + '...' : resource}
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showAddModal && (
        <AddTopicModal
          topic={editingTopic}
          onClose={() => { setShowAddModal(false); setEditingTopic(null); }}
          onSuccess={() => { setShowAddModal(false); setEditingTopic(null); loadTopics(); }}
        />
      )}
    </>
  );
}

// Leaderboard View
function LeaderboardView() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLeaderboard();
  }, []);

  const loadLeaderboard = async () => {
    try {
      const data = await api.getLeaderboard();
      setLeaderboard(data);
    } catch (error) {
      console.error('Failed to load leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading leaderboard...</div>;
  }

  return (
    <>
      <div className="sheet-header">
        <h2>🏆 Leaderboard</h2>
      </div>

      <div className="leaderboard">
        {leaderboard.map((entry, index) => (
          <div key={entry.username} className="leaderboard-item">
            <div className="leaderboard-rank">#{index + 1}</div>
            <div className="leaderboard-user">
              <h3>{entry.username}</h3>
            </div>
            <div className="leaderboard-stats">
              <span>
                <strong>{entry.solvedCount}</strong> solved
              </span>
              <span>
                <strong>{entry.weightedScore}</strong> points
              </span>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

// Contests View
function ContestsView({ contests, onRefresh }: { contests: Contest[]; onRefresh: () => void }) {
  const [showAddModal, setShowAddModal] = useState(false);

  const handleDelete = async (id: string) => {
    try {
      await api.deleteContest(id);
      onRefresh();
    } catch (error) {
      console.error('Failed to delete contest:', error);
    }
  };

  return (
    <>
      <div className="sheet-header">
        <h2>📅 Contests</h2>
        <button className="btn" onClick={() => setShowAddModal(true)}>
          <Plus size={18} />
          Add Contest
        </button>
      </div>

      <div className="leaderboard">
        {contests.map(contest => (
          <div key={contest._id} className="leaderboard-item">
            <Calendar size={24} />
            <div className="leaderboard-user">
              <h3>{contest.name}</h3>
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                {new Date(contest.date).toLocaleString()}
              </p>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              {contest.link && (
                <a href={contest.link} target="_blank" rel="noopener noreferrer" className="btn btn-secondary">
                  <ExternalLink size={16} />
                </a>
              )}
              <button className="btn btn-secondary" onClick={() => handleDelete(contest._id)}>
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {showAddModal && (
        <AddContestModal
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            setShowAddModal(false);
            onRefresh();
          }}
        />
      )}
    </>
  );
}

// Add Problem Modal
function AddProblemModal({ sheet, onClose, onSuccess }: { sheet: string; onClose: () => void; onSuccess: () => void }) {
  const [formData, setFormData] = useState({ name: '', link: '', rating: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.addProblem({
        ...formData,
        sheet,
        platform: sheet as any
      });
      onSuccess();
    } catch (error) {
      console.error('Failed to add problem:', error);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>Add Problem to {sheet}</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Problem Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label>Problem Link</label>
            <input
              type="url"
              value={formData.link}
              onChange={(e) => setFormData({ ...formData, link: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label>Rating / Difficulty</label>
            <input
              type="text"
              value={formData.rating}
              onChange={(e) => setFormData({ ...formData, rating: e.target.value })}
              placeholder="e.g., 1200, Gold, Hard"
            />
          </div>
          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn">
              Add Problem
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Add Contest Modal
function AddContestModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [formData, setFormData] = useState({ name: '', platform: 'Codeforces', date: '', link: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.addContest(formData);
      onSuccess();
    } catch (error) {
      console.error('Failed to add contest:', error);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>Add Contest Notification</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Platform</label>
            <select
              className="status-dropdown"
              value={formData.platform}
              onChange={(e) => setFormData({ ...formData, platform: e.target.value })}
              required
              style={{ width: '100%', padding: '12px 16px' }}
            >
              <option value="Codeforces">Codeforces</option>
              <option value="LeetCode">LeetCode</option>
              <option value="CodeChef">CodeChef</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div className="form-group">
            <label>Contest Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              placeholder="e.g., Codeforces Round 920"
            />
          </div>
          <div className="form-group">
            <label>Date & Time</label>
            <input
              type="datetime-local"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label>Contest Link (Optional)</label>
            <input
              type="url"
              value={formData.link}
              onChange={(e) => setFormData({ ...formData, link: e.target.value })}
              placeholder="https://codeforces.com/contest/..."
            />
          </div>
          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn">
              Add Contest
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Global Add Problem Modal - with sheet selection
function GlobalAddProblemModal({
  onClose,
  onSuccess,
  customSheets
}: {
  onClose: () => void;
  onSuccess: () => void;
  customSheets: CustomSheet[];
}) {
  const [formData, setFormData] = useState({ name: '', link: '', rating: '', sheet: 'TLE' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.addProblem({
        ...formData,
        platform: ['TLE', 'USACO', 'CSES'].includes(formData.sheet) ? formData.sheet as 'TLE' | 'USACO' | 'CSES' | 'Custom' : 'Custom'
      });
      onSuccess();
    } catch (error) {
      console.error('Failed to add problem:', error);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>Add Problem</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Select Sheet</label>
            <select
              className="status-dropdown"
              value={formData.sheet}
              onChange={(e) => setFormData({ ...formData, sheet: e.target.value })}
              required
              style={{ width: '100%', padding: '12px 16px' }}
            >
              <option value="TLE">TLE Eliminators</option>
              <option value="USACO">USACO Guide</option>
              <option value="CSES">CSES Problemset</option>
              {customSheets.map(sheet => (
                <option key={sheet._id} value={sheet._id}>{sheet.name}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Problem Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              placeholder="e.g., Watermelon"
            />
          </div>
          <div className="form-group">
            <label>Problem Link</label>
            <input
              type="url"
              value={formData.link}
              onChange={(e) => setFormData({ ...formData, link: e.target.value })}
              required
              placeholder="https://codeforces.com/problemset/problem/..."
            />
          </div>
          <div className="form-group">
            <label>Rating / Difficulty</label>
            <input
              type="text"
              value={formData.rating}
              onChange={(e) => setFormData({ ...formData, rating: e.target.value })}
              placeholder="e.g., 1200, Gold, Hard"
            />
          </div>
          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn">
              Add Problem
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Create Sheet Modal
function CreateSheetModal({
  onClose,
  onSuccess
}: {
  onClose: () => void;
  onSuccess: (name: string) => void;
}) {
  const [sheetName, setSheetName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (sheetName.trim()) {
      onSuccess(sheetName.trim());
      setSheetName('');
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>Create New Sheet</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Sheet Name</label>
            <input
              type="text"
              value={sheetName}
              onChange={(e) => setSheetName(e.target.value)}
              required
              placeholder="e.g., Hard DP Problems"
              autoFocus
            />
          </div>
          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn">
              Create Sheet
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Profile Edit Modal
function ProfileEditModal({
  onClose,
  onSuccess,
  currentUsername
}: {
  onClose: () => void;
  onSuccess: () => void;
  currentUsername: string;
}) {
  const [formData, setFormData] = useState({ username: currentUsername, password: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.password && formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (!formData.username.trim()) {
      setError('Username is required');
      return;
    }

    setLoading(true);
    try {
      const result = await api.updateProfile(
        formData.username.trim(),
        formData.password || undefined
      );

      // Update local storage with new token
      if (result.token) {
        localStorage.setItem('token', result.token);
        localStorage.setItem('username', result.username);
      }

      onSuccess();
    } catch (error: any) {
      setError(error.response?.data?.error || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>Edit Profile</h2>
        {error && <div className="error-message" style={{ color: 'var(--accent-danger)', marginBottom: '12px' }}>{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Username</label>
            <input
              type="text"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              required
              autoFocus
            />
          </div>
          <div className="form-group">
            <label>New Password (leave blank to keep current)</label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="Enter new password"
            />
          </div>
          {formData.password && (
            <div className="form-group">
              <label>Confirm Password</label>
              <input
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                placeholder="Confirm new password"
              />
            </div>
          )}
          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="btn" disabled={loading}>
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Team Name Edit Modal
function TeamNameEditModal({
  onClose,
  onSuccess,
  currentTeamName
}: {
  onClose: () => void;
  onSuccess: (newName: string) => void;
  currentTeamName: string;
}) {
  const [teamName, setTeamName] = useState(currentTeamName);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!teamName.trim()) {
      setError('Team name is required');
      return;
    }

    setLoading(true);
    try {
      await api.updateTeamName(teamName.trim());
      onSuccess(teamName.trim());
    } catch (error: any) {
      setError(error.response?.data?.error || 'Failed to update team name');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>Edit Team Name</h2>
        {error && <div className="error-message" style={{ color: 'var(--accent-danger)', marginBottom: '12px' }}>{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Team Name</label>
            <input
              type="text"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              required
              autoFocus
              placeholder="Enter team name"
            />
          </div>
          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="btn" disabled={loading}>
              {loading ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Notes Modal
function NotesModal({
  onClose,
  onSave,
  problemName,
  notes,
  setNotes
}: {
  onClose: () => void;
  onSave: () => void;
  problemName: string;
  notes: string;
  setNotes: (notes: string) => void;
}) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>📝 Notes: {problemName}</h2>
        <p style={{ color: 'var(--text-tertiary)', fontSize: '12px', marginBottom: '16px' }}>
          Private notes visible only to you
        </p>
        <form onSubmit={(e) => { e.preventDefault(); onSave(); }}>
          <div className="form-group">
            <label>Your Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add your thoughts, approach, hints, or anything else..."
              rows={8}
              style={{ resize: 'vertical', minHeight: '120px' }}
              autoFocus
            />
          </div>
          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn">
              Save Notes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Add Topic Modal
function AddTopicModal({ topic, onClose, onSuccess }: { topic: ToLearnTopic | null; onClose: () => void; onSuccess: () => void; }) {
  const [formData, setFormData] = useState({
    topic: topic?.topic || '',
    description: topic?.description || '',
    priority: topic?.priority || 'medium',
    resources: topic?.resources?.join('\n') || ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const resourcesArray = formData.resources.split('\n').map(r => r.trim()).filter(r => r.length > 0);
      if (topic) {
        await api.updateToLearnTopic(topic._id, {
          topic: formData.topic,
          description: formData.description,
          priority: formData.priority as 'low' | 'medium' | 'high',
          resources: resourcesArray
        });
      } else {
        await api.createToLearnTopic({
          topic: formData.topic,
          description: formData.description,
          priority: formData.priority as 'low' | 'medium' | 'high',
          resources: resourcesArray
        });
      }
      onSuccess();
    } catch (error) {
      console.error('Failed to save topic:', error);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>{topic ? 'Edit Topic' : 'Add New Topic'}</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Topic Name *</label>
            <input type="text" value={formData.topic} onChange={(e) => setFormData({ ...formData, topic: e.target.value })} placeholder="e.g., Dynamic Programming, Graph Algorithms" required autoFocus />
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="What do you want to learn about this topic?"
              rows={3}
              style={{
                resize: 'vertical',
                minHeight: '80px',
                fontFamily: 'inherit',
                fontSize: '14px',
                lineHeight: '1.5'
              }}
            />
          </div>
          <div className="form-group">
            <label>Priority</label>
            <select value={formData.priority} onChange={(e) => setFormData({ ...formData, priority: e.target.value as 'low' | 'medium' | 'high' })}>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
          <div className="form-group">
            <label>Resources (one per line)</label>
            <textarea
              value={formData.resources}
              onChange={(e) => setFormData({ ...formData, resources: e.target.value })}
              placeholder="https://example.com/tutorial&#10;https://youtube.com/watch?v=..."
              rows={4}
              style={{
                resize: 'vertical',
                minHeight: '100px',
                fontFamily: 'monospace',
                fontSize: '13px',
                lineHeight: '1.6'
              }}
            />
          </div>
          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn">{topic ? 'Update' : 'Add'} Topic</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default App;
