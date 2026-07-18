import React, { useState, useMemo, useEffect } from 'react';
import './App.css';
import problemsData from './data/problems.json';

interface Company {
  name: string;
  frequency: number;
  timeframe?: string;
}

interface Problem {
  id: number;
  url: string;
  title: string;
  difficulty: string;
  acceptance: string;
  companies: Company[];
}

const PAGE_SIZE = 50;

function App() {
  const problems = problemsData as Problem[];

  // Get all unique companies for the dropdown
  const allCompanies = useMemo(() => {
    const companySet = new Set<string>();
    problems.forEach(p => p.companies.forEach(c => companySet.add(c.name)));
    return Array.from(companySet).sort();
  }, [problems]);

  // Read initial state from URL query parameters
  const [searchTerm, setSearchTerm] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('q') || '';
  });
  
  const [difficultyFilter, setDifficultyFilter] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('diff') || 'All';
  });

  const [companyFilter, setCompanyFilter] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('company') || 'All';
  });
  
  const [timeframeFilter, setTimeframeFilter] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('timeframe') || 'All Time';
  });
  
  const [currentPage, setCurrentPage] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    const page = parseInt(params.get('page') || '1', 10);
    return isNaN(page) || page < 1 ? 1 : page;
  });

  // Solved status state, initialized from localStorage
  const [solvedMap, setSolvedMap] = useState<Record<number, boolean>>(() => {
    const saved = localStorage.getItem('leetcode-solved');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return {};
      }
    }
    return {};
  });

  // Update URL whenever state changes
  useEffect(() => {
    const params = new URLSearchParams();
    if (searchTerm) params.set('q', searchTerm);
    if (difficultyFilter !== 'All') params.set('diff', difficultyFilter);
    if (companyFilter !== 'All') params.set('company', companyFilter);
    if (timeframeFilter !== 'All Time') params.set('timeframe', timeframeFilter);
    if (currentPage !== 1) params.set('page', currentPage.toString());
    
    const newUrl = `${window.location.pathname}${params.toString() ? '?' + params.toString() : ''}`;
    window.history.replaceState(null, '', newUrl);
  }, [searchTerm, difficultyFilter, companyFilter, timeframeFilter, currentPage]);

  // Save solved map to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('leetcode-solved', JSON.stringify(solvedMap));
  }, [solvedMap]);

  const toggleSolved = (id: number) => {
    setSolvedMap(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const filteredProblems = useMemo(() => {
    return problems.filter((prob) => {
      const matchesSearch = prob.title.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesDifficulty = difficultyFilter === 'All' || prob.difficulty === difficultyFilter;
      
      const ranks: Record<string, number> = { '30 days': 1, '3 months': 2, '6 months': 3, 'Older': 4, 'All': 5 };
      const filterRank = ranks[timeframeFilter] || 5;

      let matchesCompany = false;
      if (companyFilter === 'All') {
        if (timeframeFilter === 'All Time') {
          matchesCompany = true;
        } else {
          matchesCompany = prob.companies.some(c => (ranks[c.timeframe || 'All'] || 5) <= filterRank);
        }
      } else {
        const companyData = prob.companies.find(c => c.name === companyFilter);
        if (companyData) {
          const probRank = ranks[companyData.timeframe || 'All'] || 5;
          matchesCompany = probRank <= filterRank;
        }
      }

      return matchesSearch && matchesDifficulty && matchesCompany;
    }).map(prob => {
      // Filter out company tags that don't match the timeframe filter
      if (timeframeFilter !== 'All Time') {
        const ranks: Record<string, number> = { '30 days': 1, '3 months': 2, '6 months': 3, 'Older': 4, 'All': 5 };
        const filterRank = ranks[timeframeFilter] || 5;
        return {
          ...prob,
          companies: prob.companies.filter(c => (ranks[c.timeframe || 'All'] || 5) <= filterRank)
        };
      }
      return prob;
    });
  }, [searchTerm, difficultyFilter, companyFilter, timeframeFilter, problems]);

  const totalPages = Math.ceil(filteredProblems.length / PAGE_SIZE) || 1;
  
  // Ensure current page is valid after filtering
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(1);
    }
  }, [totalPages, currentPage]);

  const currentData = filteredProblems.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handleDifficulty = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setDifficultyFilter(e.target.value);
    setCurrentPage(1);
  };

  const handleCompany = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setCompanyFilter(e.target.value);
    setCurrentPage(1);
  };

  const handleTimeframe = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setTimeframeFilter(e.target.value);
    setCurrentPage(1);
  };

  return (
    <div className="container">
      <header className="header">
        <h1 className="title">LeetCode Visualizer</h1>
        <p className="subtitle">Explore and conquer the most frequently asked interview questions from top tech companies.</p>
      </header>

      <div className="glass-panel">
        <div className="controls">
          <input 
            type="text" 
            className="search-input" 
            placeholder="Search problems..." 
            value={searchTerm}
            onChange={handleSearch}
          />
          <select className="filter-select" value={difficultyFilter} onChange={handleDifficulty}>
            <option value="All">All Difficulties</option>
            <option value="Easy">Easy</option>
            <option value="Medium">Medium</option>
            <option value="Hard">Hard</option>
          </select>
          <select className="filter-select" value={companyFilter} onChange={handleCompany}>
            <option value="All">All Companies</option>
            {allCompanies.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <select className="filter-select" value={timeframeFilter} onChange={handleTimeframe}>
            <option value="All Time">All Time</option>
            <option value="30 days">Last 30 Days</option>
            <option value="3 months">Last 3 Months</option>
            <option value="6 months">Last 6 Months</option>
          </select>
        </div>

        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th style={{ width: '60px', textAlign: 'center' }}>Done</th>
                <th>ID</th>
                <th>Title</th>
                <th>Difficulty</th>
                <th>Acceptance</th>
                <th>Top Companies</th>
              </tr>
            </thead>
            <tbody>
              {currentData.length > 0 ? (
                currentData.map((prob) => {
                  const isSolved = !!solvedMap[prob.id];
                  return (
                    <tr key={prob.id} className={isSolved ? 'solved-row' : ''}>
                      <td style={{ textAlign: 'center' }}>
                        <label className="checkbox-container">
                          <input 
                            type="checkbox" 
                            checked={isSolved}
                            onChange={() => toggleSolved(prob.id)}
                          />
                          <span className="checkmark"></span>
                        </label>
                      </td>
                      <td>{prob.id}</td>
                      <td>
                        <a 
                          href={prob.url} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="problem-link"
                        >
                          {prob.title}
                        </a>
                      </td>
                      <td>
                        <span className={`difficulty ${prob.difficulty.toLowerCase()}`}>
                          {prob.difficulty}
                        </span>
                      </td>
                      <td>{prob.acceptance}</td>
                      <td>
                        <div className="companies-list">
                          {prob.companies.slice(0, 3).map(c => (
                            <span key={c.name} className="company-tag" title={`Frequency: ${c.frequency} | Asked: ${c.timeframe || 'All Time'}`}>
                              {c.name}
                            </span>
                          ))}
                          {prob.companies.length > 3 && (
                            <span className="company-tag" title={prob.companies.slice(3).map(c => c.name).join(', ')}>
                              +{prob.companies.length - 3} more
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '2rem' }}>
                    No problems found matching your criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="pagination">
            <button 
              className="page-btn" 
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              Previous
            </button>
            
            <div className="page-numbers">
              {/* Show simple numbered pagination around current page */}
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 2)
                .map((p, idx, arr) => (
                  <React.Fragment key={p}>
                    {idx > 0 && arr[idx - 1] !== p - 1 && <span className="ellipsis">...</span>}
                    <button 
                      className={`page-num-btn ${p === currentPage ? 'active' : ''}`}
                      onClick={() => setCurrentPage(p)}
                    >
                      {p}
                    </button>
                  </React.Fragment>
                ))}
            </div>

            <button 
              className="page-btn" 
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
