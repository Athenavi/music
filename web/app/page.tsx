'use client';
import React, {useEffect, useRef, useState} from 'react';
import {BrowserRouter as Router, Link, Route, Routes} from 'react-router-dom';
import Home from './components/Home/Home';
import TopList from "./components/TopList/TopList";
import PlayLists from "./components/PlayLists/PlayLists";
import PlaylistDetail from "./components/playlistDetail/playlistDetail";
import API_URL from "./config";
import Singer from "./components/Singer/Singer";
import SearchPage from "./components/search/search";
import {likeThisSong} from "./components/func/songMenu";

// 定义类型
interface TokenState {
    token: string | null;
    setToken: (token: string | null) => void;
}

interface AudioState {
    playing: boolean;
    setPlaying: (playing: boolean) => void;
    musicId: string;
    setMusicId: (musicId: string) => void;
    currentTime: number;
    setCurrentTime: (time: number) => void;
    duration: number;
    setDuration: (duration: number) => void;
    volume: number;
    setVolume: (volume: number) => void;
    isMuted: boolean;
    setIsMuted: (muted: boolean) => void;
}

interface NavigationState {
    isNavExpanded: boolean;
    setIsNavExpanded: (expanded: boolean) => void;
}

// 确定 AppProps 的具体类型，这里假设没有其他属性
type AppProps = object

const App: React.FC<AppProps> = () => {
    const [token, setToken] = useState<string | null>(localStorage.getItem('token') || null);
    const audioRef = useRef<HTMLAudioElement>(null);
    const [playing, setPlaying] = useState<boolean>(false);
    const [musicId, setMusicId] = useState<string>(localStorage.getItem('currentId') || "0");
    const [currentTime, setCurrentTime] = useState<number>(0);
    const [duration, setDuration] = useState<number>(0);
    const [volume, setVolume] = useState<number>(() => {
        const savedVolume = localStorage.getItem('volume');
        return savedVolume !== null ? parseFloat(savedVolume) : 1;
    });
    const [isMuted, setIsMuted] = useState<boolean>(false);
    const [isNavExpanded, setIsNavExpanded] = useState<boolean>(false);
    const musicIdRef = useRef<string>(musicId);

    // 同步最新musicId到ref
    useEffect(() => {
        musicIdRef.current = musicId;
    }, [musicId]);

    // 保存musicId到本地存储
    useEffect(() => {
        localStorage.setItem('currentId', musicId);
    }, [musicId]);

    // 初始化音频事件监听
    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        const updateTime = () => {
            const currentTime = audio.currentTime;
            setCurrentTime(currentTime);
            const progress = JSON.parse(localStorage.getItem('progress') || '{}');
            progress[musicIdRef.current] = currentTime;
            localStorage.setItem('progress', JSON.stringify(progress));
        };

        const updateDuration = () => setDuration(audio.duration);
        const updateVolume = () => {
            const currentVolume = audio.volume;
            setVolume(currentVolume);
            setIsMuted(audio.muted);
            localStorage.setItem('volume', currentVolume.toString());
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

    // 加载时恢复播放进度
    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        const handleLoadedMetadata = () => {
            const progress = JSON.parse(localStorage.getItem('progress') || '{}');
            const savedTime = progress[musicId] || 0;
            audio.currentTime = savedTime;
        };

        audio.addEventListener('loadedmetadata', handleLoadedMetadata);
        return () => audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
    }, [musicId]);

    // 初始化音量
    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        const savedVolume = localStorage.getItem('volume');
        const initialVolume = savedVolume !== null ?
            Math.min(1, Math.max(0, parseFloat(savedVolume))) : 1;

        const handleLoadedMetadata = () => {
            audio.volume = initialVolume;
            setIsMuted(initialVolume === 0);
        };

        audio.addEventListener('loadedmetadata', handleLoadedMetadata);
        return () => audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
    }, []);

    const handleNextSong = (nextMusicId: string) => {
        const audio = audioRef.current;
        if (!audio) return;

        setMusicId(nextMusicId);
        audio.pause();
        audio.src = `${API_URL}/music/${nextMusicId}.mp3`;

        const handleCanPlay = () => {
            audio.play().then(() => {
                setPlaying(true);
            });
            audio.removeEventListener('canplaythrough', handleCanPlay);
        };

        audio.addEventListener('canplaythrough', handleCanPlay);
    };

    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        const handleNextSongOnEnded = () => {
            const currentPlaylist = JSON.parse(localStorage.getItem('currentPlaylist') || '{"播放列表": []}');
            const playlist = currentPlaylist['播放列表'] as Array<{ id: string }>;
            const currentIndex = playlist.findIndex((item) => item.id === musicId);

            if (currentIndex !== -1 && currentIndex < playlist.length - 1) {
                const nextMusicId = playlist[currentIndex + 1].id;
                handleNextSong(nextMusicId);
            } else {
                alert("已经是最后一首歌曲");
            }
        };

        audio.addEventListener('ended', handleNextSongOnEnded);

        return () => {
            audio.removeEventListener('ended', handleNextSongOnEnded);
        };
    }, [musicId]);

    const formatTime = (seconds: number): string => {
        const minutes = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${minutes}:${secs.toString().padStart(2, '0')}`;
    };

    const handleProgressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const time = parseFloat(e.target.value);
        const audio = audioRef.current;
        if (audio) {
            audio.currentTime = time;
        }
    };

    const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const vol = parseFloat(e.target.value);
        const audio = audioRef.current;
        if (audio) {
            audio.volume = vol;
            audio.muted = vol === 0;
        }
    };

    const toggleMute = () => {
        const audio = audioRef.current;
        if (audio) {
            audio.muted = !audio.muted;
        }
    };

    const togglePlay = () => {
        const audio = audioRef.current;
        if (!audio) return;

        if (playing) {
            audio.pause();
        } else {
            audio.play();
        }
    };

    const toggleNav = () => {
        setIsNavExpanded(!isNavExpanded);
    };

    const handleSong = (page: number) => {
        const audio = audioRef.current;
        if (!audio) return;

        const currentPlaylist = JSON.parse(localStorage.getItem('currentPlaylist') || '{"播放列表": []}');
        const playlist = currentPlaylist['播放列表'] as Array<{ id: string }>;
        const currentIndex = playlist.findIndex((item) => item.id === musicId);

        if (currentIndex !== -1) {
            const newIndex = currentIndex + page;

            if (newIndex >= 0 && newIndex < playlist.length) {
                const newMusicId = playlist[newIndex].id;
                setMusicId(newMusicId);
                audio.pause();
                audio.src = `${API_URL}/music/${newMusicId}.mp3`;

                const handleCanPlay = () => {
                    audio.play().then(() => {
                        setPlaying(true);
                    });
                    audio.removeEventListener('canplaythrough', handleCanPlay);
                };

                audio.addEventListener('canplaythrough', handleCanPlay);
            } else if (newIndex < 0) {
                alert("已经是第一首歌曲");
            } else {
                alert("已经是最后一首歌曲");
            }
        }
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
                    src={`${API_URL}/music/${musicId}.mp3`}
                    className="hidden-audio"
                />

                <div className="custom-player">
                    {/* 左侧歌曲信息 */}
                    <div className="song-info">
                        <Link to="/song">
                            <img
                                src={`${API_URL}/music_cover/${musicId}.png` || 'default-cover.jpg'}
                                className="album-cover"
                                alt="专辑封面"
                            />
                        </Link>
                    </div>

                    <div className="controls">
                        <button className="icon-button" onClick={() => handleSong(-1)}>◀◁</button>
                        <button
                            className="play-pause"
                            onClick={togglePlay}
                        >
                            {playing ? '⏸' : '▶'}
                        </button>
                        <button className="icon-button" onClick={() => handleSong(1)}>▷▶</button>
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
                        <button className="icon-button" id="likeButton" onClick={() => likeThisSong(musicId)}>♥</button>
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
                <Route path="/search" element={<SearchPage/>}/>
                <Route path="/song" element={
                    <Home
                        playing={playing}
                        setPlaying={setPlaying}
                        handleNextSong={handleNextSong}
                        audioRef={audioRef}
                    />
                }/>
                <Route path="/toplist" element={<TopList/>}/>
                <Route path="/discover/singer" element={<Singer/>}/>
                <Route path="/discover/playlists"
                       element={<PlayLists setMusicId={setMusicId} pageType="pl" token={null}/>}/>
                <Route path="/discover/album"
                       element={<PlayLists setMusicId={setMusicId} pageType="al" token={null}/>}/>
                <Route path="/playlist"
                       element={<PlaylistDetail token={token} setMusicId={setMusicId} pageType="pl"/>}/>
                <Route path="/album" element={<PlaylistDetail token={token} setMusicId={setMusicId} pageType="al"/>}/>
            </Routes>
        </Router>
    );
};

export default App;
