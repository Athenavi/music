import React, {useState, useEffect} from 'react';
import API_URL from '../../config';
import './pd.css'
import {Link, useLocation} from "react-router-dom";


const PlaylistDetail = ({setMusicId, pageType}) => {
    const [data, setData] = useState(null);
    const [visibleItems, setVisibleItems] = useState(60);
    const [showMore, setShowMore] = useState(true);
    const [formattedDate, setFormattedDate] = useState("");

    const location = useLocation();
    const searchParams = new URLSearchParams(location.search);
    const pType = searchParams.get('pageType') || "pl";
    const pTitle = searchParams.get('pTitle') || "";
    const pRD = searchParams.get('pRD') || "";
    const dateParts = pRD.match(/(\d{2}) (\w{3}) (\d{4})/);

    useEffect(() => {
        if (dateParts) {
            const months = {
                Jan: '01', Feb: '02', Mar: '03', Apr: '04', May: '05', Jun: '06',
                Jul: '07', Aug: '08', Sep: '09', Oct: '10', Nov: '11', Dec: '12'
            };

            const formattedDateValue = `${dateParts[3]}-${months[dateParts[2]]}-${dateParts[1]}`;
            setFormattedDate(formattedDateValue); // 设置formattedDate的值
            console.log(formattedDateValue); // 输出 '2018-12-03'
        } else {
            console.log('Invalid date format');
        }
    }, [pRD]);

    let playlistId = searchParams.get("pid") || "0";

    const fetchData = async (playlistId) => {
        try {
            const res = await fetch(API_URL + `/api/Detail?pid=` + playlistId + '&pageType=' + pType);
            const responseData = await res.json();
            const convertedData = convertData(responseData);
            setData(convertedData);
            localStorage.setItem('viewPlaylist_' + playlistId + pType, JSON.stringify(convertedData));
        } catch (error) {
            console.error('Error fetching data:', error);
        }
    };

    useEffect(() => {
        const cachedData = localStorage.getItem('viewPlaylist_' + playlistId + pType);
        if (cachedData) {
            setData(JSON.parse(cachedData));
        } else {
            fetchData(playlistId);
        }
    }, [location]);

    const convertData = (data) => {
        return {
            "歌曲列表": data["歌曲列表"].map(item => {
                return {
                    id: item[0],
                    title: item[1] || "Unknown Title",
                    artist: item[2] || "Unknown Artist"
                };
            })
        };
    };

    let pageTitle = "歌单 " + pTitle;
    if (pageType === 'al') {
        pageTitle = "专辑 " + pTitle;
    }

    const loadMoreItems = () => {
        setVisibleItems(prev => prev + 40);
        if (visibleItems >= data["歌曲列表"].length) {
            setShowMore(false);
        }
    };

    return (
        <div className="index-container" id='viewPlaylist'>
            {data ? (
                <>
                    <h1>{pageTitle}</h1>
                    <img
                        className="cover_img"
                        src={`${API_URL}/music_cover/${playlistId}.png`}
                        alt="封面图片"
                    />
                    <span>{formattedDate}</span>
                    <ul>
                        {Object.entries(data).map(([key, value]) => (
                            <li key={key}>
                                <h3>{key}</h3>
                                <ol>
                                    {value.slice(0, visibleItems).map((item) => (
                                        <li key={item.id} className="list_li">
                                            <div className="list-item-content">
                                                <img
                                                    className="cover_img"
                                                    src={`${API_URL}/music_cover/${item.id}.png`}
                                                    alt="封面图片"
                                                />
                                                <Link to={`/song?id=${item.id}`} onClick={() => setMusicId(item.id)}>
                                                    <div className="song-info">
                                                        <h4>{item.title}</h4>
                                                        <p>{item.artist}</p>
                                                    </div>
                                                </Link>
                                            </div>
                                        </li>
                                    ))}
                                </ol>
                            </li>
                        ))}
                    </ul>
                    {showMore && (
                        <button onClick={loadMoreItems} id='btn_load_more'
                                style={{marginBottom: '45px'}}>查看更多</button>
                    )}

                    {!showMore && (
                        <p style={{marginBottom: '45px'}}>已经到底了呢</p>
                    )}
                </>
            ) : (
                <p>Loading...</p>
            )}
        </div>
    );
}

export default PlaylistDetail;
