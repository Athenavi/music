import React, {useEffect, useRef, useState} from 'react';
import {useLocation} from "react-router-dom";
import SongDetail from '../SongDetail/SongDetail';
import CurrentList from "../CurrentList/CurrentList";
import API_URL from '../../config';
import './Home.css';
import {FaHeart, FaList, FaMusic} from 'react-icons/fa';

// 定义 Playlist 组件的 props 类型
interface PlaylistProps {
    coverUrl: string;
    toggleVisable: (panel: string) => void;
    likeThisSong: () => void;
    playing: boolean;
}

// Playlist component
const Playlist: React.FC<PlaylistProps> = ({coverUrl, toggleVisable, likeThisSong, playing}) => {
    const imgRef = useRef<HTMLImageElement>(null);

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

// 定义 Home 组件的 props 类型
// 修改 HomeProps 接口：
interface HomeProps {
    playing: boolean;
    setPlaying: React.Dispatch<React.SetStateAction<boolean>>;
    handleNextSong: (nextMusicId: string) => void;  // 修正类型
    audioRef: React.RefObject<HTMLAudioElement>;
    musicId: string;             // 新增
    setMusicId: React.Dispatch<React.SetStateAction<string>>; // 新增
}

function Home({playing, setPlaying, handleNextSong, audioRef, musicId, setMusicId}: HomeProps) {
    const location = useLocation();
    const searchParams = new URLSearchParams(location.search);
    const [playlistId, setPlaylistId] = useState<string>(searchParams.get("pid") || "0");
    const [coverUrl, setCoverUrl] = useState<string>(`${API_URL}/music_cover/${musicId}.png`);

    useEffect(() => {
        const urlId = searchParams.get("id");
        const pid = searchParams.get("pid") || "0";

        if (urlId !== null && urlId !== musicId) {
            setMusicId(urlId);
            localStorage.setItem('currentId', urlId);
        }

        setPlaylistId(pid);
        setCoverUrl(`${API_URL}/music_cover/${musicId}.png`);
    }, [location, musicId, setMusicId]);

    const [showLyrics, setShowLyrics] = useState<boolean>(true);
    const [showPlaylist, setShowPlaylist] = useState<boolean>(true);
    const [panelWidth, setPanelWidth] = useState<string>('75%');  // 新增宽度状态

    // 完全重构的切换函数
    const toggleVisibility = (panel: string): void => {
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

    // 占位函数 - 需要根据实际功能实现
    const likeThisSong = (): void => {
        // TODO: 实现收藏功能
        console.log('Like this song:', musicId);
    };

    // 占位函数 - 需要根据实际功能实现
    const shareThisSong = (): void => {
        // TODO: 实现分享功能
        console.log('Share this song:', musicId);
    };

    useEffect(() => {
        if (!showLyrics) return;

        const lyricsDiv = document.getElementById('lyrics');
        const audio = audioRef.current;
        if (!lyricsDiv || !audio) return;

        // 增强版时间解析函数
        const parseLyricTime = (timeStr: string): number => {
            if (!timeStr) return 0;
            try {
                // 支持多种时间格式：[mm:ss.xx] 或 [mm:ss:xx]
                const cleanStr = timeStr.replace(/(:|\.|-)/g, ':');
                const [minutes, seconds, milliseconds = 0] = cleanStr.split(':').map(Number);
                return minutes * 60 + seconds + milliseconds / 1000;
            } catch {
                return 0;
            }
        };

        // 滚动锁定处理
        const handleScroll = (e: Event): void => {
            if (lyricsDiv.contains(e.target as Node)) {
                e.stopPropagation();
                if (e.cancelable) e.preventDefault();
            }
        };

        // 事件监听优化
        const events = ['wheel', 'touchstart', 'scroll'];
        events.forEach(event =>
            document.addEventListener(event, handleScroll, {passive: false})
        );

        // 歌词处理逻辑
        let lyricLines: HTMLParagraphElement[] = [];
        let currentActiveIndex = -1;
        let animationFrameId: number | null = null;

        const updateLyricLines = (): void => {
            lyricLines = Array.from(lyricsDiv.querySelectorAll('p[id^="time_"]'));
            currentActiveIndex = -1; // 重置高亮状态
        };

        const handleTimeUpdate = (): void => {
            const currentTime = audio.currentTime;
            let newActiveIndex = -1;

            // 逆向查找提高性能（假设歌词按时间顺序排列）
            for (let i = lyricLines.length - 1; i >= 0; i--) {
                const line = lyricLines[i];
                const timeStr = line.id.split('_')[1];
                const lineTime = parseLyricTime(timeStr);

                if (currentTime >= lineTime) {
                    // 检查下一行时间（如果有）
                    const nextLine = lyricLines[i + 1];
                    const nextTime = nextLine ? parseLyricTime(nextLine.id.split('_')[1]) : Infinity;

                    if (currentTime < nextTime) {
                        newActiveIndex = i;
                        break;
                    }
                }
            }

            if (newActiveIndex !== currentActiveIndex) {
                // 使用classList批量操作
                lyricLines.forEach(line => line.classList.remove('active'));

                if (newActiveIndex !== -1) {
                    const activeLine = lyricLines[newActiveIndex];
                    activeLine.classList.add('active');

                    // 优化滚动逻辑
                    if (animationFrameId) cancelAnimationFrame(animationFrameId);
                    animationFrameId = requestAnimationFrame(() => {
                        activeLine.scrollIntoView({
                            behavior: 'smooth',
                            block: 'center',
                            inline: 'nearest'
                        });
                    });
                }

                currentActiveIndex = newActiveIndex;
            }
        };

        // 初始化歌词行
        updateLyricLines();
        const observer = new MutationObserver(updateLyricLines);
        observer.observe(lyricsDiv, {childList: true, subtree: true});

        // 音频事件监听
        audio.addEventListener('timeupdate', handleTimeUpdate);

        return () => {
            // 清理操作
            audio.removeEventListener('timeupdate', handleTimeUpdate);
            observer.disconnect();
            events.forEach(event =>
                document.removeEventListener(event, handleScroll)
            );
            if (animationFrameId) cancelAnimationFrame(animationFrameId);
            lyricLines.forEach(line => line.classList.remove('active'));
        };
    }, [musicId, playing, showLyrics, audioRef]);


    return (
        <div className="music-app">
            <div className="app-container" ref={songElementRef} style={{width: panelWidth}}>
                <Playlist
                    toggleVisable={toggleVisibility}
                    coverUrl={coverUrl}
                    likeThisSong={likeThisSong}
                    playing={playing}
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