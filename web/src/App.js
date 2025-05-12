import React, {useEffect, useRef, useState} from 'react';
import {BrowserRouter as Router, Link, Route, Routes} from 'react-router-dom';
import Home from './components/Home/Home';
import Login from './components/Login/Login';
import Register from './components/Register/Register';
import TopList from "./components/TopList/TopList";
import Index from "./components/Index/Index";
import PlayLists from "./components/PlayLists/PlayLists";
import './App.css';
import PlaylistDetail from "./components/playlistDetail/playlistDetail";
import API_URL from "./config";
import Logout from "./components/Login/Logout";
import Singer from "./components/Singer/Singer";
import SearchPage from "./components/search/search";
import {likeThisSong, shareThisSong} from "./components/func/songMenu";
import CurrentList from "./components/CurrentList/CurrentList";

function App() {
    const [token, setToken] = useState(localStorage.getItem('token') || null);
    const audioRef = useRef(null);
    const [playing, setPlaying] = useState(false);
    const [musicId, setMusicId] = useState("0");
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [volume, setVolume] = useState(1);
    const [isMuted, setIsMuted] = useState(false);
    const [isNavExpanded, setIsNavExpanded] = useState(false);

    useEffect(() => {
        localStorage.setItem('token', token);
    }, [token]);

    useEffect(() => {
        const audio = audioRef.current;

        const updateTime = () => setCurrentTime(audio.currentTime);
        const updateDuration = () => setDuration(audio.duration);
        const updateVolume = () => {
            setVolume(audio.volume);
            setIsMuted(audio.muted);
        };

        audio.addEventListener('timeupdate', updateTime);
        audio.addEventListener('loadedmetadata', updateDuration);
        audio.addEventListener('volumechange', updateVolume);

        return () => {
            audio.removeEventListener('timeupdate', updateTime);
            audio.removeEventListener('loadedmetadata', updateDuration);
            audio.removeEventListener('volumechange', updateVolume);
        };
    }, []);

    const handleNextSong = (nextMusicId) => {
        setMusicId(nextMusicId);
        audioRef.current.pause();
        audioRef.current.src = API_URL + `/music/${nextMusicId}.mp3`;

        audioRef.current.addEventListener('canplaythrough', () => {
            audioRef.current.play().then(() => {
                setPlaying(true);
            });
        });
    };

    useEffect(() => {
        const handleNextSongOnEnded = () => {
            const currentPlaylist = JSON.parse(localStorage.getItem('currentPlaylist')) || {播放列表: []};
            const playlist = currentPlaylist['播放列表'];
            const currentIndex = playlist.findIndex(item => item.id === musicId);

            if (currentIndex !== -1 && currentIndex < playlist.length - 1) {
                const nextMusicId = playlist[currentIndex + 1].id;
                handleNextSong(nextMusicId);
            } else {
                alert("已经是最后一首歌曲");
            }
        };

        audioRef.current.addEventListener('ended', handleNextSongOnEnded);

        return () => {
            audioRef.current.removeEventListener('ended', handleNextSongOnEnded);
        };
    }, [musicId]);

    const formatTime = (seconds) => {
        const minutes = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${minutes}:${secs.toString().padStart(2, '0')}`;
    };

    const handleProgressChange = (e) => {
        const time = parseFloat(e.target.value);
        audioRef.current.currentTime = time;
    };

    const handleVolumeChange = (e) => {
        const vol = parseFloat(e.target.value);
        audioRef.current.volume = vol;
        audioRef.current.muted = vol === 0;
    };

    const toggleMute = () => {
        audioRef.current.muted = !audioRef.current.muted;
    };

    const togglePlay = () => {
        if (playing) {
            audioRef.current.pause();
        } else {
            audioRef.current.play();
        }
    };

    const toggleNav = () => {
        setIsNavExpanded(!isNavExpanded);
    };

    return (
        <Router>
            <nav className={isNavExpanded ? "expanded" : "collapsed"}>
                <Link to="/">
                    <img src="https://7trees.cn/favicon.ico" alt="Logo" className="logo"/>
                </Link>
                <Link to="/discover/playlists">发现音乐</Link>
                {token ? (
                    <>
                        <Link to="/my">我</Link>
                        <Link to="/discover/singer">歌手</Link>
                        <Link to="/search">搜索</Link>
                    </>
                ) : (
                    <Link to="/login">登录</Link>
                )}
            </nav>

            <header>
                <div className="secondMenu">
                    <Link to="/toplist">排行榜</Link>
                    <Link to="/discover/album">专辑</Link>
                    <Link to="/song">播放</Link>
                    <button onClick={toggleNav} className="toggle-button">☰</button>
                </div>
            </header>

            <div className='player'>
                <audio
                    ref={audioRef}
                    onPlay={() => setPlaying(true)}
                    onPause={() => setPlaying(false)}
                    src={API_URL + `/music/${musicId}.mp3`}
                    className="hidden-audio"
                />

                <div className="custom-player">
                    {/* 左侧歌曲信息 */}
                    <div className="song-info">
                        <img
                            src={`${API_URL}/music_cover/${musicId}.png` || 'default-cover.jpg'}
                            className="album-cover"
                            alt="专辑封面"
                        />
                    </div>

                    <div className="controls">
                        <button className="icon-button">◀◁</button>
                        <button
                            className="play-pause"
                            onClick={togglePlay}
                        >
                            {playing ? '⏸' : '▶'}
                        </button>
                        <button className="icon-button" onClick={handleNextSong}>▷▶</button>
                        <div className="progress-container">
                            <span className="time">{formatTime(currentTime)}</span>
                            <input
                                type="range"
                                className="progress"
                                min="0"
                                max={duration || 0}
                                value={currentTime}
                                onChange={handleProgressChange}
                            />
                            <span className="time">{formatTime(duration)}</span>
                        </div>
                    </div>

                    <div className="extra-controls">
                        <button className="icon-button" onClick={likeThisSong}>♥</button>
                        <div className="volume-control">
                            <button className="mute" onClick={toggleMute}>
                                {isMuted ? '🔇' : volume > 0.5 ? '🔊' : '🔉'}
                            </button>
                            <input
                                type="range"
                                min="0"
                                max="1"
                                step="0.1"
                                value={volume}
                                onChange={handleVolumeChange}
                                className="volume"
                            />
                        </div>
                        <button className="icon-button">≡</button>
                    </div>
                </div>
            </div>

            <Routes>
                <Route path="/" element={<Index token={token}/>}/>
                <Route path="/search" element={<SearchPage/>}/>
                <Route path="/song" element={
                    <Home
                        token={token}
                        playing={playing}
                        setPlaying={setPlaying}
                        handleNextSong={handleNextSong}
                        setMusicId={setMusicId}
                        audioRef={audioRef}
                    />
                }/>
                <Route path="/toplist" element={<TopList token={token}/>}/>
                <Route path="/discover/singer" element={<Singer setMusicId={setMusicId}/>}/>
                <Route path="/discover/playlists" element={<PlayLists token={token} pageType="pl"/>}/>
                <Route path="/discover/album" element={<PlayLists token={token} pageType="al"/>}/>
                <Route path="/playlist"
                       element={<PlaylistDetail token={token} setMusicId={setMusicId} pageType="pl"/>}/>
                <Route path="/album" element={<PlaylistDetail token={token} setMusicId={setMusicId} pageType="al"/>}/>
                <Route path="/login" element={<Login/>}/>
                <Route path="/register" element={<Register/>}/>
                <Route path="/logout" element={<Logout/>}/>
            </Routes>
        </Router>
    );
}

export default App;