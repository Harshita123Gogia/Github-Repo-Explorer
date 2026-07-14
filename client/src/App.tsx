import axios from 'axios';
import React, { useEffect, useState } from 'react';

interface User {
  avatar_url: string;
  name: string | null;
  login: string;
  bio: string | null;
  followers: number;
  following: number;
  public_repos: number;
  html_url: string;
}

interface Repo {
  id: number;
  name: string;
  description: string | null;
  language: string | null;
  stargazers_count: number;
  updated_at: string;
  html_url: string;
  open_issues_count?: number;
  default_branch?: string;
}

const App: React.FC = () => {
  const [username, setUsername] = useState('');
  const [userData, setUserData] = useState<{ user: User; repos: Repo[] } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sortBy, setSortBy] = useState<'stars' | 'name' | 'updated'>('stars');
  const [expandedRepo, setExpandedRepo] = useState<number | null>(null);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem('recentSearches');
    if (saved) setRecentSearches(JSON.parse(saved));
  }, []);

  const saveToRecent = (user: string) => {
    const updated = [user, ...recentSearches.filter(u => u !== user)].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem('recentSearches', JSON.stringify(updated));
  };

  const fetchUserData = async (searchUsername: string) => {
  if (!searchUsername.trim()) return;

  setLoading(true);
  setError('');
  setUserData(null);
  setExpandedRepo(null);

  try {
    // Use environment variable or fallback to Render URL
    const API_BASE = import.meta.env.VITE_API_URL || 'https://github-repo-explorer-q43c.onrender.com';
    
    const response = await axios.get(`${API_BASE}/api/user/${searchUsername}`);
    
    setUserData(response.data);
    saveToRecent(searchUsername);
  } catch (err: any) {
    console.error(err);
    if (err.response?.status === 404) {
      setError('User not found');
    } else if (err.response?.status === 429) {
      setError('Rate limit exceeded. Please try again later.');
    } else {
      setError('Failed to fetch user data. Please try again.');
    }
  } finally {
    setLoading(false);
  }
};

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchUserData(username);
  };

  const handleRecentClick = (search: string) => {
    setUsername(search);
    fetchUserData(search);
  };

  const sortedRepos = userData ? [...userData.repos].sort((a, b) => {
    if (sortBy === 'stars') return b.stargazers_count - a.stargazers_count;
    if (sortBy === 'name') return a.name.localeCompare(b.name);
    return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
  }) : [];

  return (
    <div className="app">
      {/* Navbar */}
      <nav className="navbar">
        <div className="logo">
          <span>🐙</span>
          <span>RepoExplorer</span>
        </div>

        <form onSubmit={handleSearch} className="search-container">
          <input
            type="text"
            className="search-input"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Search GitHub username..."
            disabled={loading}
          />
          <button type="submit" className="search-btn" disabled={loading}>
            {loading ? 'Searching...' : 'Search'}
          </button>
        </form>
      </nav>

      <div className="main-content">
        {!userData && !loading && (
          <div className="hero">
            <div className="hero-icon">🐱</div>
            <h1>Explore GitHub Profiles</h1>
            <p>Search for a developer to instantly view their repositories,<br />
               language breakdown, and profile stats in a dense, precise interface.</p>
          </div>
        )}

        {/* Recent Searches */}
        {recentSearches.length > 0 && !userData && (
          <div className="recent-searches">
            <h3>RECENT SEARCHES</h3>
            <div className="recent-pills">
              {recentSearches.map((search, i) => (
                <div key={i} className="recent-pill" onClick={() => handleRecentClick(search)}>
                  {search}
                </div>
              ))}
            </div>
          </div>
        )}

        {error && <div style={{ color: '#f85149', textAlign: 'center', padding: '20px' }}>{error}</div>}
        {loading && <div style={{ textAlign: 'center', padding: '40px', fontSize: '18px' }}>Loading profile...</div>}

        {userData && (
          <div style={{ padding: '30px 0' }}>
            {/* Profile Card */}
            <div style={{
              display: 'flex',
              gap: '24px',
              backgroundColor: '#161b22',
              padding: '24px',
              borderRadius: '12px',
              border: '1px solid #30363d'
            }}>
              <img
                src={userData.user.avatar_url}
                alt={userData.user.login}
                style={{ width: '120px', height: '120px', borderRadius: '50%', border: '3px solid #30363d' }}
              />
              <div>
                <h1 style={{ fontSize: '32px', marginBottom: '8px' }}>
                  <a href={userData.user.html_url} target="_blank" rel="noopener noreferrer" style={{ color: '#58a6ff', textDecoration: 'none' }}>
                    {userData.user.name || userData.user.login}
                  </a>
                </h1>
                <p style={{ color: '#8b949e', fontSize: '20px' }}>@{userData.user.login}</p>
                {userData.user.bio && <p style={{ marginTop: '12px', fontSize: '16px' }}>{userData.user.bio}</p>}
                
                <div style={{ marginTop: '16px', display: 'flex', gap: '24px', fontSize: '15px' }}>
                  <span>👥 {userData.user.followers} followers</span>
                  <span>👤 {userData.user.following} following</span>
                  <span>📚 {userData.user.public_repos} repositories</span>
                </div>
              </div>
            </div>

            {/* Repositories Section */}
            <div style={{ marginTop: '40px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2>Repositories ({sortedRepos.length})</h2>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {['stars', 'name', 'updated'].map((type) => (
                    <button
                      key={type}
                      onClick={() => setSortBy(type as any)}
                      style={{
                        padding: '6px 14px',
                        background: sortBy === type ? '#238636' : '#21262d',
                        border: '1px solid #30363d',
                        borderRadius: '6px',
                        color: 'white',
                        cursor: 'pointer'
                      }}
                    >
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {sortedRepos.map((repo) => {
                  const isExpanded = expandedRepo === repo.id;
                  return (
                    <div
                      key={repo.id}
                      onClick={() => setExpandedRepo(isExpanded ? null : repo.id)}
                      style={{
                        backgroundColor: '#161b22',
                        padding: '18px',
                        borderRadius: '8px',
                        border: `1px solid ${isExpanded ? '#58a6ff' : '#30363d'}`,
                        cursor: 'pointer'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <div>
                          <a
                            href={repo.html_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ color: '#58a6ff', fontSize: '18px', fontWeight: 600, textDecoration: 'none' }}
                            onClick={e => e.stopPropagation()}
                          >
                            {repo.name}
                          </a>
                          {repo.description && <p style={{ marginTop: '6px', color: '#8b949e' }}>{repo.description}</p>}
                        </div>
                        <div style={{ textAlign: 'right', fontSize: '14px', color: '#8b949e' }}>
                          {repo.language && <div>💻 {repo.language}</div>}
                          <div>⭐ {repo.stargazers_count}</div>
                          <div>Updated {new Date(repo.updated_at).toLocaleDateString()}</div>
                        </div>
                      </div>

                      {isExpanded && (
                        <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid #30363d', fontSize: '15px' }}>
                          <p><strong>Open Issues:</strong> {repo.open_issues_count || 0}</p>
                          <p><strong>Default Branch:</strong> {repo.default_branch}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;