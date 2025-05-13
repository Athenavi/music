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

    // 初始化musicId，优先使用URL参数，其次本地存储，最后默认0
    const initialMusicId = () => {
        const urlId = searchParams.get("id");
        if (urlId !== null) return urlId;
        const storedId = localStorage.getItem('currentId');
        return storedId || "0";
    };
    const [musicId, setMusicId] = useState(initialMusicId);
    const [playlistId, setPlaylistId] = useState(searchParams.get("pid") || "0");
    const [coverUrl, setCoverUrl] = useState(`${API_URL}/music_cover/${initialMusicId()}.png`);
    const songElementRef = useRef(null);

    useEffect(() => {
        const urlId = searchParams.get("id");
        const pid = searchParams.get("pid") || "0";
        const storedId = localStorage.getItem('currentId') || "0";
        const newMusicId = urlId !== null ? urlId : storedId;
        setMusicId(newMusicId);
        setPlaylistId(pid);
        setCoverUrl(`${API_URL}/music_cover/${newMusicId}.png`);
        localStorage.setItem('currentId', newMusicId);
    }, [location]); // 依赖location的变化

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
        if (!showLyrics) return;

        const lyricsDiv = document.getElementById('lyrics');
        const audio = audioRef.current;
        if (!lyricsDiv || !audio) return;

        const parseLyricTime = (timeStr) => {
            if (!timeStr) return 0;
            const [main, milliseconds] = timeStr.split('.');
            const [minutes, seconds] = main.split(':');
            return parseFloat(minutes) * 60 + parseFloat(seconds) + parseFloat(`0.${milliseconds || 0}`);
        };

        let lyricLines = [];
        let currentActiveIndex = -1;

        const updateLyricLines = () => {
            lyricLines = Array.from(lyricsDiv.getElementsByTagName('p'));
        };

        const handleTimeUpdate = () => {
            const currentTime = audio.currentTime;

            // 找到当前应高亮的行
            let newActiveIndex = -1;
            for (let i = 0; i < lyricLines.length; i++) {
                const line = lyricLines[i];
                const timeStr = line.id?.split('_')[1];
                if (!timeStr) continue;

                const lineTime = parseLyricTime(timeStr);

                // 当前时间超过本行时间，且下一行时间未到
                if (currentTime >= lineTime) {
                    if (i === lyricLines.length - 1 || currentTime < parseLyricTime(lyricLines[i + 1].id.split('_')[1])) {
                        newActiveIndex = i;
                    }
                } else {
                    break;
                }
            }

            // 只有当需要更新时才操作DOM
            if (newActiveIndex !== currentActiveIndex) {
                // 移除旧的高亮
                if (currentActiveIndex !== -1) {
                    lyricLines[currentActiveIndex].classList.remove('active');
                }

                // 应用新的高亮
                if (newActiveIndex !== -1) {
                    const activeLine = lyricLines[newActiveIndex];
                    activeLine.classList.add('active');

                    // 延迟滚动确保样式应用完成
                    requestAnimationFrame(() => {
                        activeLine.scrollIntoView({
                            behavior: 'smooth',
                            block: 'center'
                        });
                    });
                }

                currentActiveIndex = newActiveIndex;
            }
        };

        updateLyricLines();

        const observer = new MutationObserver((mutations) => {
            updateLyricLines();
            currentActiveIndex = -1; // 重置高亮状态
        });

        audio.addEventListener('timeupdate', handleTimeUpdate);
        observer.observe(lyricsDiv, {childList: true, subtree: true});

        return () => {
            audio.removeEventListener('timeupdate', handleTimeUpdate);
            observer.disconnect();
        };
    }, [musicId, playing, showLyrics, audioRef]);


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