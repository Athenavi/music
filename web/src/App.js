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

function App() {
    const [token, setToken] = useState(localStorage.getItem('token') || null);
    const audioRef = useRef(null);
    const [playing, setPlaying] = useState(false);
    const [musicId, setMusicId] = useState("0");

    const [isNavExpanded, setIsNavExpanded] = useState(false); // 定义状态

    const toggleNav = () => { // 定义切换函数
        setIsNavExpanded(!isNavExpanded);
    };


    useEffect(() => {
        localStorage.setItem('token', token);
    }, [token]);

    const handleNextSong = (nextMusicId) => {
        setMusicId(nextMusicId);
        audioRef.current?.pause();
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

    return (
        <Router>
            <nav className={isNavExpanded ? "expanded" : "collapsed"}>
                <Link to="/"><img src="https://7trees.cn/zyImg/qks2862/Athenavi.png" alt="Logo"
                                  className="logo"/></Link>
                <Link to="/discover/playlists">发现音乐</Link>
                {token ? (
                    <><Link to="/my">我</Link>
                        <Link to="/discover/singer">歌手</Link>
                        <Link to="/search">搜索</Link></>
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
                    controls
                    onPlay={() => setPlaying(true)}
                    onPause={() => setPlaying(false)}
                    onEnded={handleNextSong}
                    src={API_URL + `/music/` + musicId + '.mp3'}
                >
                    Your browser does not support the audio element.
                </audio>
            </div>
            <Routes>
                <Route path="/" element={<Index token={token}/>}/>
                <Route path="/search" element={<SearchPage/>}/>
                <Route path="/song" element={<Home token={token} playing={playing} setPlaying={setPlaying}
                                                   handleNextSong={handleNextSong} setMusicId={setMusicId}
                                                   audioRef={audioRef}/>}/>
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