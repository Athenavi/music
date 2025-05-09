import React, {useState, useEffect} from 'react';
import API_URL from '../../config';
import {Link, useLocation} from "react-router-dom";
import removeFromPlaylist from "../func/removeFromPlaylist";
import addToPlaylist from "../func/addToPlaylist";
import {likeThisSong} from "../func/songMenu";
import {FiPlus, FiMinus, FiHeart, FiMusic, FiUser} from 'react-icons/fi';
import './SingerDetail.scss';

const SingerDetail = () => {
    const [data, setData] = useState(null);
    const [visibleItems, setVisibleItems] = useState(60);
    const [showMore, setShowMore] = useState(true);
    const location = useLocation();
    const searchParams = new URLSearchParams(location.search);
    const name = searchParams.get('name') || "";
    let singerId = searchParams.get("uid") || "0";

    const fetchData = async (singerId) => {
        try {
            const res = await fetch(API_URL + `/api/singer?uid=` + singerId);
            const responseData = await res.json();
            const convertedData = convertData(responseData);
            setData(convertedData);
            localStorage.setItem('singerPlaylist_' + singerId, JSON.stringify(convertedData));
        } catch (error) {
            console.error('Error fetching data:', error);
        }
    };

    useEffect(() => {
        const cachedData = localStorage.getItem('singerPlaylist_' + singerId);
        if (cachedData) {
            setData(JSON.parse(cachedData));
        } else {
            fetchData(singerId);
        }
    }, [location, singerId]);

    const convertData = (data) => {
        return {
            "artists": data["歌手"].map(item => {
                return {
                    id: item[0],
                    artist: item[1] || "Unknown Artist"
                };
            })
        };
    };

    const loadMoreItems = () => {
        setVisibleItems(prev => prev + 40);
    };

    useEffect(() => {
        if (data && data.artists.length <= visibleItems) {
            setShowMore(false);
        } else {
            setShowMore(true);
        }
    }, [visibleItems, data]);


    return (
        <div className="singer-detail-container">
            {data ? (
                <>
                    <div className="detail-header">
                        <h1 className="artist-title">{name}</h1>
                        <div className="stats-badge">
                            <FiMusic className="icon"/>
                            <span>{data.artists.length}首作品</span>
                        </div>
                    </div>

                    <div className="grid-container">
                        {data.artists.slice(0, visibleItems).map((item) => (
                            <div key={item.id} className="grid-item">
                                {singerId === '0' ? (
                                    <Link
                                        to={`/discover/singer?uid=${item.id}&name=${item.artist}`}
                                        className="artist-card"
                                    >
                                        <div className="image-wrapper">
                                            <img
                                                src={`${API_URL}/singer/${item.id}.png`}
                                                alt={item.artist}
                                                className="artist-image"
                                            />
                                            <div className="hover-overlay"/>
                                        </div>
                                        <h3 className="artist-name">{item.artist}</h3>
                                        <p className="artist-type">歌手</p>
                                    </Link>
                                ) : (
                                    <div className="song-card">
                                        <div className="song-image-wrapper">
                                            <img
                                                src={`${API_URL}/music_cover/${item.id}.png`}
                                                alt={item.artist}
                                                className="song-cover"
                                            />
                                            <div className="song-controls">
                                                <button
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        addToPlaylist({
                                                            id: item.id,
                                                            artist: name,
                                                            title: item.artist
                                                        });
                                                    }}
                                                    className="control-button add"
                                                >
                                                    <FiPlus/>
                                                </button>
                                                <Link
                                                    to={`/song?id=${item.id}&name=${item.artist}`}
                                                    className="play-button"
                                                >
                                                    播放
                                                </Link>
                                            </div>
                                        </div>
                                        <div className="song-info">
                                            <Link
                                                to={`/song?id=${item.id}&name=${item.artist}`}
                                                className="song-title"
                                            >
                                                {item.artist}
                                            </Link>
                                            <div className="song-actions">
                                                <button
                                                    onClick={() => removeFromPlaylist(item[0])}
                                                    className="action-button"
                                                >
                                                    <FiMinus/>
                                                </button>
                                                <button
                                                    onClick={() => likeThisSong(item[0])}
                                                    className="action-button like"
                                                >
                                                    <FiHeart/>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    <div className="load-more-container">
                        {showMore ? (
                            <button
                                onClick={loadMoreItems}
                                className="load-more-button"
                            >
                                加载更多
                            </button>
                        ) : (
                            <p className="end-hint">—— 已显示全部内容 ——</p>
                        )}
                    </div>
                </>
            ) : (
                <div className="loading-container">
                    <div className="loading-spinner"/>
                    加载中...
                </div>
            )}
        </div>
    );
};

export default SingerDetail;