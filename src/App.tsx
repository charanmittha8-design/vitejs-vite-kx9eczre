import React, { useState, useRef, useEffect } from 'react';
import './App.css';

function App() {
  const [activeTab, setActiveTab] = useState('home'); // Tracks navigation tabs: 'home' or 'search'
  const [searchQuery, setSearchQuery] = useState('');
  const [trackList, setTrackList] = useState([]);
  const [currentTrack, setCurrentTrack] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  // Quick-load default home layout data cards
  const [featuredAlbums] = useState([
    { id: 'f1', name: 'Pushpa 2 The Rule', query: 'Pushpa 2' },
    { id: 'f2', name: 'RRR Hits', query: 'RRR' },
    { id: 'f3', name: 'Devara', query: 'Devara' },
    { id: 'f4', name: 'Kalki 2898 AD', query: 'Kalki' }
  ]);

  // Persistent History Caching Memory
  const [searchHistory, setSearchHistory] = useState(() => {
    const saved = localStorage.getItem('charan_search_history');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [recentTracks, setRecentTracks] = useState(() => {
    const saved = localStorage.getItem('charan_recent_tracks');
    return saved ? JSON.parse(saved) : [];
  });

  const audioRef = useRef(new Audio());

  useEffect(() => {
    localStorage.setItem('charan_search_history', JSON.stringify(searchHistory));
  }, [searchHistory]);

  useEffect(() => {
    localStorage.setItem('charan_recent_tracks', JSON.stringify(recentTracks));
  }, [recentTracks]);

  const formatTime = (secs) => {
    if (isNaN(secs)) return '0:00';
    const minutes = Math.floor(secs / 60);
    const seconds = Math.floor(secs % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  const executeSearch = async (queryText) => {
    if (!queryText.trim()) return;
    setLoading(true);
    try {
      const response = await fetch(`https://saavn.sumit.co/api/search/songs?query=${encodeURIComponent(queryText)}`);
      const data = await response.json();

      if (data.success && data.data.results && data.data.results.length > 0) {
        const formattedTracks = data.data.results.map((song) => ({
          id: song.id,
          title: song.name,
          artist: song.artists?.primary?.[0]?.name || 'Popular Artist',
          album: song.album?.name || 'Single Track',
          duration: parseFloat(song.duration / 60).toFixed(2).replace('.', ':'),
          coverUrl: song.image?.[2]?.url || song.image?.[1]?.url || 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=150',
          audioUrl: song.downloadUrl?.[4]?.url || song.downloadUrl?.[3]?.url || song.downloadUrl?.[2]?.url
        }));
        
        setTrackList(formattedTracks);
        setSearchHistory(prev => {
          const filtered = prev.filter(item => item.toLowerCase() !== queryText.toLowerCase());
          return [queryText, ...filtered].slice(0, 4);
        });
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const selectTrack = (track) => {
    setCurrentTrack(track);
    setIsPlaying(true);
    setRecentTracks(prev => {
      const filtered = prev.filter(item => item.id !== track.id);
      return [track, ...filtered].slice(0, 6);
    });
  };

  const handleNextTrack = () => {
    if (trackList.length === 0) return;
    const currentIndex = trackList.findIndex(track => track.id === currentTrack?.id);
    if (currentIndex !== -1 && currentIndex < trackList.length - 1) {
      setCurrentTrack(trackList[currentIndex + 1]);
    } else {
      setCurrentTrack(trackList[0]);
    }
    setIsPlaying(true);
  };

  const handlePrevTrack = () => {
    const currentIndex = trackList.findIndex(track => track.id === currentTrack?.id);
    if (currentIndex > 0) {
      setCurrentTrack(trackList[currentIndex - 1]);
      setIsPlaying(true);
    }
  };

  // Audio Processing Hooks
  useEffect(() => {
    const audio = audioRef.current;
    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleLoadedMetadata = () => setDuration(audio.duration);
    
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleNextTrack);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleNextTrack);
    };
  }, [currentTrack, trackList]);

  useEffect(() => {
    if (currentTrack?.audioUrl) {
      audioRef.current.src = currentTrack.audioUrl;
      setCurrentTime(0);
      if (isPlaying) audioRef.current.play().catch(() => {});
    }
  }, [currentTrack]);

  useEffect(() => {
    if (!currentTrack?.audioUrl) return;
    isPlaying ? audioRef.current.play().catch(() => {}) : audioRef.current.pause();
  }, [isPlaying]);

  return (
    <div className="music-app" style={{ display: 'flex', flexDirection: 'column', height: '100vh', backgroundColor: '#070708', overflow: 'hidden' }}>
      
      {/* APP INTERACTIVE VIEWPORT SCROLLER */}
      <main style={{ flexGrow: 1, overflowY: 'auto', padding: '20px 16px', paddingBottom: currentTrack ? '180px' : '90px' }} className="scroll-container">
        
        {/* TAB POSITION 1: DASHBOARD HOME */}
        {activeTab === 'home' && (
          <div>
            <div style={{ marginBottom: '24px' }}>
              <h2 style={{ margin: 0, fontSize: '22px', fontWeight: 'bold', color: '#ffffff' }}>Good Day, Explorer 👋</h2>
              <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#71717a' }}>Welcome to Charan Music Premium</p>
            </div>

            {/* Quick-Play Movie Album Mix Grid */}
            <h4 style={{ fontSize: '13px', color: '#a0a0ab', textTransform: 'uppercase', margin: '0 0 12px 0', letterSpacing: '0.5px' }}>⚡ Quick Mix Hub</h4>
            <div className="grid-container">
              {featuredAlbums.map(album => (
                <div key={album.id} className="grid-card" onClick={() => { setActiveTab('search'); setSearchQuery(album.query); executeSearch(album.query); }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '6px', background: 'linear-gradient(135deg, #1db954, #0d5c2b)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px' }}>🎬</div>
                  <span style={{ fontSize: '13px', fontWeight: 'bold', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{album.name}</span>
                </div>
              ))}
            </div>

            {/* Horizontal Recently Played Rack */}
            {recentTracks.length > 0 && (
              <div style={{ marginTop: '28px' }}>
                <h4 style={{ fontSize: '13px', color: '#a0a0ab', textTransform: 'uppercase', margin: '0 0 12px 0', letterSpacing: '0.5px' }}>⏱️ Jump Back In</h4>
                <div style={{ display: 'flex', gap: '14px', overflowX: 'auto', paddingBottom: '4px' }} className="scroll-container">
                  {recentTracks.map(track => (
                    <div key={`home-recent-${track.id}`} onClick={() => selectTrack(track)} style={{ width: '90px', flexShrink: 0, cursor: 'pointer' }}>
                      <img src={track.coverUrl} alt="" style={{ width: '90px', height: '90px', borderRadius: '10px', objectFit: 'cover', boxShadow: '0 4px 12px rgba(0,0,0,0.3)' }} />
                      <p style={{ margin: '6px 0 0 0', fontSize: '12px', fontWeight: '600', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: '#ffffff' }}>{track.title}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB POSITION 2: MODERN EXPLORE SEARCH ENGINE */}
        {activeTab === 'search' && (
          <div>
            <h2 style={{ margin: '0 0 16px 0', fontSize: '22px', fontWeight: 'bold' }}>Explore</h2>
            
            <form onSubmit={(e) => { e.preventDefault(); executeSearch(searchQuery); }} style={{ display: 'flex', background: '#121216', padding: '4px 8px', borderRadius: '24px', border: '1px solid #27272a', alignItems: 'center', marginBottom: '16px' }}>
              <span style={{ paddingLeft: '8px' }}>🔍</span>
              <input 
                type="text" 
                placeholder="Artists, songs, or movies..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ flexGrow: 1, background: 'none', border: 'none', padding: '10px 12px', color: '#ffffff', outline: 'none', fontSize: '14px' }}
              />
              <button type="submit" style={{ padding: '8px 16px', borderRadius: '18px', border: 'none', backgroundColor: '#1db954', color: '#ffffff', fontWeight: 'bold', cursor: 'pointer', fontSize: '12px' }}>
                {loading ? '...' : 'Search'}
              </button>
            </form>

            {/* History Chips Layout */}
            {searchHistory.length > 0 && (
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '20px', alignItems: 'center' }}>
                <span style={{ fontSize: '11px', color: '#71717a' }}>Recents:</span>
                {searchHistory.map((historyItem, idx) => (
                  <span key={idx} onClick={() => { setSearchQuery(historyItem); executeSearch(historyItem); }} style={{ fontSize: '11px', background: '#1c1c24', padding: '6px 12px', borderRadius: '14px', cursor: 'pointer', color: '#d4d4d8' }}>
                    {historyItem}
                  </span>
                ))}
              </div>
            )}

            {/* Target Search Queue Tracks Rows List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px' }}>
              {trackList.map((track, idx) => (
                <div key={track.id || idx} onClick={() => selectTrack(track)} style={{ display: 'flex', alignItems: 'center', padding: '8px', borderRadius: '10px', backgroundColor: currentTrack?.id === track.id ? 'rgba(29, 185, 84, 0.12)' : 'transparent', cursor: 'pointer' }}>
                  <img src={track.coverUrl} alt="" style={{ width: '44px', height: '44px', borderRadius: '6px', marginRight: '12px' }} />
                  <div style={{ flexGrow: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: '14px', fontWeight: '600', color: currentTrack?.id === track.id ? '#1db954' : '#ffffff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{track.title}</p>
                    <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#a0a0ab', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{track.artist}</p>
                  </div>
                  <span style={{ fontSize: '12px', color: '#71717a' }}>{track.duration}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* FLOATING ACTION DECK CONTROLLER (Only shows up when a track exists) */}
      {currentTrack && (
        <div className="floating-player">
          {/* Seek Progress Range Slider Line */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <span style={{ fontSize: '10px', color: '#a0a0ab', minWidth: '24px' }}>{formatTime(currentTime)}</span>
            <input type="range" min="0" max={duration || 0} value={currentTime} onChange={(e) => { const time = parseFloat(e.target.value); audioRef.current.currentTime = time; setCurrentTime(time); }} style={{ flexGrow: 1, accentColor: '#1db954' }} />
            <span style={{ fontSize: '10px', color: '#a0a0ab', minWidth: '24px' }}>{formatTime(duration)}</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', maxWidth: '55%' }}>
              <img src={currentTrack.coverUrl} alt="" style={{ width: '38px', height: '38px', borderRadius: '6px', objectFit: 'cover' }} />
              <div style={{ minWidth: 0 }}>
                <p style={{ margin: 0, fontSize: '13px', fontWeight: 'bold', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: '#ffffff' }}>{currentTrack.title}</p>
                <p style={{ margin: '2px 0 0 0', fontSize: '11px', color: '#a0a0ab', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{currentTrack.artist}</p>
              </div>
            </div>

            {/* Navigation Media Controls */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <button onClick={handlePrevTrack} style={{ background: 'none', border: 'none', color: '#ffffff', fontSize: '18px', cursor: 'pointer' }}>⏮</button>
              <button onClick={() => setIsPlaying(!isPlaying)} style={{ width: '36px', height: '36px', borderRadius: '50%', border: 'none', backgroundColor: '#ffffff', color: '#000000', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {isPlaying ? "⏸" : "▶"}
              </button>
              <button onClick={handleNextTrack} style={{ background: 'none', border: 'none', color: '#ffffff', fontSize: '18px', cursor: 'pointer' }}>⏭</button>
            </div>
          </div>
        </div>
      )}

      {/* CORE DEVICE STICKY NAVIGATION BAR */}
      <nav className="bottom-nav">
        <button className={`nav-item ${activeTab === 'home' ? 'active' : ''}`} onClick={() => setActiveTab('home')}>
          <span style={{ fontSize: '18px' }}>🏠</span>
          <span>Home</span>
        </button>
        <button className={`nav-item ${activeTab === 'search' ? 'active' : ''}`} onClick={() => setActiveTab('search')}>
          <span style={{ fontSize: '18px' }}>🔍</span>
          <span>Search</span>
        </button>
      </nav>

    </div>
  );
}

export default App;