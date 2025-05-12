import React, {useEffect, useRef, useState} from 'react';
import {useLocation} from "react-router-dom";
import SongDetail from '../SongDetail/SongDetail';
import CurrentList from "../CurrentList/CurrentList";
import API_URL from '../../config';
import './Home.css';
import {likeThisSong, shareThisSong} from "../func/songMenu";
import {FaHeart, FaList, FaMusic} from 'react-icons/fa';

// Playlist component
const Playlist = ({coverUrl, toggleVisable, likeThisSong, shareThisSong, playing, musicId}) => {
    const imgRef = useRef(null);

    useEffect(() => {
        const img = imgRef.current;
        if (img) {
            img.classList.toggle('rotating', playing);
        }
    }, [playing]);

    return (
        <div className="player-panel">
            <div className="album-art-container">
                <img
                    ref={imgRef}
                    src={coverUrl}
                    alt="专辑封面"
                    className={`album-art ${playing ? 'playing' : ''}`}
                />
                <div className="art-overlay"></div>
            </div>

            <div className="control-buttons">
                <button
                    className="icon-btn"
                    onClick={() => likeThisSong()}
                    title="收藏"
                >
                    <FaHeart className="icon"/>
                </button>
                <button
                    className="icon-btn"
                    onClick={() => toggleVisable('lrc_div')}
                    title="歌词"
                >
                    <FaMusic className="icon"/>
                </button>
                <button
                    className="icon-btn"
                    onClick={() => toggleVisable('other_div')}
                    title="播放列表"
                >
                    <FaList className="icon"/>
                </button>
            </div>
        </div>
    )

};

function Home({playing, setPlaying, handleNextSong, token, audioRef}) {
    const location = useLocation();
    const searchParams = new URLSearchParams(location.search);
    const [musicId, setMusicId] = useState(searchParams.get("id") || "0");
    const [playlistId, setPlaylistId] = useState(searchParams.get("pid") || "0");
    const [coverUrl, setCoverUrl] = useState(`${API_URL}/music_cover/${musicId}.png`);
    const songElementRef = useRef(null);

    useEffect(() => {
        setMusicId(searchParams.get("id") || "0");
        setPlaylistId(searchParams.get("pid") || "0");
        setCoverUrl(`${API_URL}/music_cover/${musicId}.png`);
        localStorage.setItem('currentId', musicId);
    }, [location]);

    useEffect(() => {
        if (playing) {
            setCoverUrl(`${API_URL}/music_cover/${musicId}.png`);
        }
        const initialMusicId = searchParams.get("id") || localStorage.getItem('currentId') || "0";
        if (initialMusicId === musicId) {
            setCoverUrl(`${API_URL}/music_cover/${initialMusicId}.png`);
        }
        if (initialMusicId !== musicId) {
            localStorage.setItem('currentId', musicId);
            setCoverUrl(`${API_URL}/music_cover/${musicId}.png`);
        }
    }, [playing, musicId]);


    const [showLyrics, setShowLyrics] = useState(true);
    const [showPlaylist, setShowPlaylist] = useState(true);
    const [panelWidth, setPanelWidth] = useState('75%');  // 新增宽度状态

    // 完全重构的切换函数
    const toggleVisibility = (panel) => {
        switch (panel) {
            case 'lrc_div':
                setShowLyrics(prev => !prev);
                setPanelWidth(prev => prev === '55vw' ? '75vw' : '55vw');
                break;
            case 'other_div':
                setShowPlaylist(prev => !prev);
                break;
            default:
                break;
        }
    };


    useEffect(() => {
        const audio = audioRef.current;
        let lyricsDiv = document.getElementById('lyrics');
        if (!lyricsDiv) return;  // 如果 lyricsDiv 不存在，直接返回
        let lyricLines = lyricsDiv.getElementsByTagName('p');
        let activeLine = null;

        const handleTimeUpdate = () => {
            const currentTime = audio.currentTime;

            for (let i = 0; i < lyricLines.length; i++) {
                const lineId = lyricLines[i].id;
                if (!lineId) {
                    continue;  // 如果 id 不存在或者为 undefined，跳过当前循环
                }

                const timeStr = lineId.split('_')[1];
                const lineTime = parseLyricTime(timeStr);

                if (currentTime >= lineTime) {
                    if (activeLine) {
                        activeLine.classList.remove('active');
                    }
                    activeLine = lyricLines[i];
                    activeLine.classList.add('active');
                } else {
                    break;
                }
            }

            if (activeLine) {
                activeLine.scrollIntoView({behavior: "smooth", block: "center"});
            }
        };

        function parseLyricTime(timeStr) {
            if (!timeStr) {
                return 0;
            }
            const parts = timeStr.split(':');
            const minutes = parseInt(parts[0], 10);
            const seconds = parseFloat(parts[1]);
            return minutes * 60 + seconds;
        }

        audio.addEventListener('timeupdate', handleTimeUpdate);

        // 在组件卸载时移除事件监听器
        return () => {
            audio.removeEventListener('timeupdate', handleTimeUpdate);
        };
    }, [musicId, playing, audioRef, showLyrics]);

    return (
        <div className="music-app">
            <div className="app-container" ref={songElementRef} style={{width: panelWidth}}>
                <Playlist
                    toggleVisable={toggleVisibility}
                    coverUrl={coverUrl}
                    likeThisSong={likeThisSong}
                    shareThisSong={shareThisSong}
                    playing={playing}
                    musicId={musicId}
                />

                {/* 歌词面板 - 通过状态控制显示 */}
                {showLyrics && (
                    <div className="lyrics-panel" id="lrc_div" key={musicId}>
                        <div className="lyrics-container">
                            <SongDetail musicId={musicId} key={musicId}/>
                        </div>
                        {/* 添加关闭按钮 */}
                        <button
                            className="close-btn"
                            onClick={() => toggleVisibility('lrc_div')}
                        >
                            ×
                        </button>
                    </div>
                )}

                {/* 播放列表面板 - 通过状态控制显示 */}
                {showPlaylist && (
                    <div className="playlist-panel" id="other_div">
                        <div className="playlist-container">
                            <CurrentList
                                pid={playlistId}
                                setMusicId={setMusicId}
                                handleNextSong={handleNextSong}
                                key={musicId}
                                toggleVisable={toggleVisibility}
                            />
                        </div>
                        {/* 添加关闭按钮 */}
                        <button
                            className="close-btn"
                            onClick={() => toggleVisibility('other_div')}
                        >
                            ×
                        </button>
                    </div>
                )}
            </div>

            <footer className="app-footer">
                © {new Date().getFullYear()} 7trees.cn 用音乐感动生活
            </footer>
        </div>
    );
}

export default Home;