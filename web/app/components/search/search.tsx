import React, { useState, useCallback, useMemo } from 'react';
import axios from 'axios';
import API_URL from "../../config";
import './SearchPage.css';
import { Link } from 'react-router-dom';
import addToPlaylist from "../func/addToPlaylist";
import { FiSearch, FiMusic, FiAlertCircle, FiLoader } from 'react-icons/fi';

// 定义歌曲的数据结构
interface Song {
    id: number;
    name: string;
    artists: { name: string }[];
    album: { name: string, artist: { name: string } };
    duration: number;
}

function SearchPage() {
    const [keyword, setKeyword] = useState<string>('');
    const [results, setResults] = useState<Song[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string>('');
    const [visibleItems, setVisibleItems] = useState<number>(20); // 初始可见项数

    const handleSearch = useCallback(async () => {
        if (!keyword) return;

        setLoading(true);
        setError('');
        setResults([]); // 清空之前的结果

        try {
            const response = await axios.get<{ code: number, result: { songs: Song[] } }>(`${API_URL}/api/search?keyword=${keyword}`);
            if (response.data.code === 200) {
                setResults(response.data.result.songs);
            } else {
                setError('未找到结果');
            }
        } catch (err) {
            setError('请求失败，请稍后重试');
        } finally {
            setLoading(false);
        }
    }, [keyword]);

    const loadMoreItems = useCallback(() => {
        setVisibleItems(prev => Math.min(prev + 20, results.length)); // 每次加载20个
    }, [results.length]);

    const visibleSongs = useMemo(() => results.slice(0, visibleItems), [results, visibleItems]);

    return (
        <div className="search-container">
            <div className="search-header">
                <h1 className="page-title"><FiMusic /> 音乐搜索</h1>
                <div className="search-bar">
                    <input
                        type="text"
                        value={keyword}
                        onChange={(e) => setKeyword(e.target.value)}
                        placeholder="输入歌曲或艺术家名称"
                        onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                    />
                    <button onClick={handleSearch} className="search-button">
                        <FiSearch /> 搜索
                    </button>
                </div>
            </div>

            <div className="search-results">
                {loading && (
                    <div className="loading-indicator">
                        <FiLoader className="spin" /> 加载中...
                    </div>
                )}

                {error && (
                    <div className="error-message">
                        <FiAlertCircle /> {error}
                    </div>
                )}

                {visibleSongs.length > 0 ? (
                    <>
                        <div className="results-grid">
                            {visibleSongs.map((song) => (
                                <div key={song.id} className="song-card">
                                    <div className="album-art">
                                        <img
                                            src={`${API_URL}/music_cover/${song.id}.png`}
                                            alt={song.album.artist.name}
                                            className="cover-image"
                                        />
                                        <div className="card-overlay">
                                            <button
                                                className="play-button"
                                                onClick={() => addToPlaylist({
                                                    id: song.id,
                                                    artist: song.artists.map(artist => artist.name).join(', '),
                                                    title: song.name
                                                })}
                                            >
                                                添加到播放列表
                                            </button>
                                        </div>
                                    </div>
                                    <div className="song-info">
                                        <Link
                                            to={`/song?id=${song.id}`}
                                            className="song-title"
                                        >
                                            {song.name}
                                        </Link>
                                        <p className="artist-name">
                                            {song.artists.map(artist => artist.name).join(', ')}
                                        </p>
                                        <div className="song-meta">
                                            <span className="album-name">{song.album.name}</span>
                                            <span className="song-duration">
                                                {Math.floor(song.duration / 1000)}秒
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {visibleItems < results.length && (
                            <button
                                onClick={loadMoreItems}
                                className="load-more-button"
                            >
                                加载更多结果
                            </button>
                        )}
                    </>
                ) : (
                    !loading && !error && (
                        <div className="empty-state">
                            <FiMusic className="empty-icon" />
                            <p>没有找到相关歌曲</p>
                        </div>
                    )
                )}
            </div>
        </div>
    );
}

export default React.memo(SearchPage);
