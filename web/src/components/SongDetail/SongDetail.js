import React, {useState, useEffect} from 'react';
import API_URL from "../../config";


function SongDetail({musicId, key}) {
    const [songLyrics, setSongLyrics] = useState('');
    const [musicName, setMusicName] = useState('');
    const [musicArtist, setMusicArtist] = useState('');

    useEffect(() => {
        const fetchSongDetails = async () => {
            try {
                const response = await fetch(API_URL + `/song/name?id=${musicId}`);
                if (response.ok) {
                    const data = await response.json();
                    const [id, song_name, artist] = data[0]; // 解构数据
                    setMusicName(song_name);
                    setMusicArtist(artist);
                } else {
                    console.error('Error fetching song details');
                }
            } catch (error) {
                console.error('Error fetching song details:', error);
            }
        };

        if (musicId) {
            fetchSongDetails();
        }
    }, [musicId]);

    useEffect(() => {
        const fetchSongLyrics = async () => {
            try {
                const response = await fetch(API_URL + `/api/lrc/${musicId}`);
                if (response.ok) {
                    const data = await response.text();
                    const htmlContent = parseLrcToHtml(data);
                    setSongLyrics(htmlContent);
                } else {
                    console.error('Error fetching song lyrics');
                }
            } catch (error) {
                console.error('Error fetching song lyrics:', error);
            }
        };

        if (musicId) {
            fetchSongLyrics();
        }
    }, [musicId]);

    const parseLrcToHtml = (lrcText) => {
        const lines = lrcText.split('\n');
        const formattedLines = lines.map(line => {
            const parts = line.match(/\[(\d+:\d+\.\d+)\]/);
            const text = line.split(']').pop();
            if (parts && parts.length > 1) {
                return `<p id="time_${parts[1]}">${text}</p>`;
            }
            return `<p>${text}</p>`;
        });
        return formattedLines.join('');
    };


    return (
        <>
            <div key={key}>
                <h1 className="song_title">{musicName}</h1>
                <span className='song_artist'>{musicArtist}</span>
            </div>
            <div className="songDetail">
                <div className="songLyric" id="lyrics" dangerouslySetInnerHTML={{__html: songLyrics}}></div>
            </div>
        </>
    );
}

export default SongDetail;