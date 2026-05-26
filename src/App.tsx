import React, { useState, useRef, useEffect } from 'react';
import './App.css';

function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [searchQuery, setSearchQuery] = useState('');
  const [trackList, setTrackList] = useState<any[]>([]);
  const [currentTrack, setCurrentTrack] = useState<any>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [loading, setLoading] = useState(false);

  const [featuredAlbums] = useState([
    { id: 'f1', name: 'Pushpa 2 The Rule', query: 'Pushpa 2' },
    { id: 'f2', name: 'RRR Hits', query: 'RRR' },
    { id: 'f3', name: 'Devara', query: 'Devara' },
    { id: 'f4', name: 'Kalki 2898 AD', query: 'Kalki' }
  ]);

  const audioRef = useRef(new Audio());

  const executeSearch = async (queryText: string) => {
    if (!queryText.trim()) return;
    setLoading(true);
    try {
      // Direct API call to ensure stability
      const response = await fetch(`https://saavn.sumit.co/api/search/songs?query=${encodeURIComponent(queryText)}`);
      
      if (!response.ok) {
        throw new Error('Server unreachable');
      }

      const data = await response.json();

      if (data.success && data.data?.results) {
        const formattedTracks = data.data.results.map((song: any) => ({
          id: song.id,
          title: song.name,
          artist: song.artists?.primary?.[0]?.name || 'Popular Artist',
          album: song.album?.name || 'Single Track',
          coverUrl: song.image?.[2]?.url || 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=150',
          audioUrl: song.downloadUrl?.[4]?.url || song.downloadUrl?.[3]?.url || ''
        }));
        
        setTrackList(formattedTracks);
      } else {
        alert("No songs found for this search.");
      }
    } catch (error) {
      console.error("Search Error:", error);
      alert("Service is currently unavailable. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const selectTrack = (track: any) => {
    setCurrentTrack(track);
    setIsPlaying(true);
  };

  useEffect(() => {
    if (currentTrack?.audioUrl) {
      audioRef.current.src = currentTrack.audioUrl;
      if (isPlaying) audioRef.current.play().catch(() => {});
    }
  }, [currentTrack]);

  useEffect(() => {
    isPlaying ? audioRef.current.play().catch(() => {}) : audioRef.current.pause();
  }, [isPlaying]);

  return (
    <div className="music-app" style={{ display: 'flex', flexDirection: 'column', height: '100vh', backgroundColor: '#070708', color: '#fff' }}>
      <main style={{ flexGrow: 1, overflowY: 'auto', padding: '20px' }}>
        {activeTab === 'home' && (
          <div>
            <h2>Good Day, Explorer 👋</h2>
            <div className="grid-container" style={{ display: 'grid', gap: '10px' }}>
              {featuredAlbums.map((album) => (
                <div key={album.id} className="grid-card" onClick={() => { setActiveTab('search'); setSearchQuery(album.query); executeSearch(album.query); }} style={{ padding: '15px', background: '#121216', cursor: 'pointer' }}>
                  {album.name}
                </div>
              ))}
            </div>
          </div>
        )}
        {activeTab === 'search' && (
          <div>
            <form onSubmit={(e) => { e.preventDefault(); executeSearch(searchQuery); }} style={{ display: 'flex', gap: '10px' }}>
              <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search..." style={{ flex: 1, padding: '10px' }} />
              <button type="submit">{loading ? '...' : 'Search'}</button>
            </form>
            <div style={{ marginTop: '20px' }}>
              {trackList.map((track) => (
                <div key={track.id} onClick={() => selectTrack(track)} style={{ padding: '10px', cursor: 'pointer', borderBottom: '1px solid #333' }}>
                  {track.title} - {track.artist}
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
      <nav className="bottom-nav" style={{ padding: '20px', display: 'flex', justifyContent: 'space-around', background: '#121216' }}>
        <button onClick={() => setActiveTab('home')}>🏠 Home</button>
        <button onClick={() => setActiveTab('search')}>🔍 Search</button>
      </nav>
    </div>
  );
}

export default App;
