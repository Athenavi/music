import React, { useState, useEffect } from 'react';
import API_URL from "../../config";

interface LyricsLine {
    time: string;
    text: string;
    nextTime?: string;
}

interface SongDetailProps {
    musicId: string;
}

function SongDetail({ musicId }: SongDetailProps) {
    const [lyricsData, setLyricsData] = useState<LyricsLine[]>([]);
    const [musicName, setMusicName] = useState<string>('');
    const [musicArtist, setMusicArtist] = useState<string>('');

    // 获取歌曲基本信息
    useEffect(() => {
        const fetchSongDetails = async () => {
            try {
                const response = await fetch(`${API_URL}/song/name?id=${musicId}`);
                if (response.ok) {
                    const data = await response.json();
                    const [id, song_name, artist] = data[0];
                    setMusicName(song_name);
                    setMusicArtist(artist);
                }
            } catch (error) {
                console.error('Error fetching song details:', error);
            }
        };

        if (musicId) fetchSongDetails();
    }, [musicId]);

    // 获取并解析歌词
    useEffect(() => {
        const fetchAndParseLyrics = async () => {
            try {
                const response = await fetch(`${API_URL}/api/lrc/${musicId}`);
                if (response.ok) {
                    const rawText = await response.text();
                    const parsed = parseLyrics(rawText);
                    setLyricsData(parsed);
                }
            } catch (error) {
                console.error('Error fetching lyrics:', error);
            }
        };

        if (musicId) fetchAndParseLyrics();
    }, [musicId]);

    // 歌词解析函数
    const parseLyrics = (rawText: string): LyricsLine[] => {
        const lines = rawText.split('\n');
        return lines.map((line, index) => {
            const match = line.match(/\[(\d+:\d+\.\d+)\](.*)/);
            if (!match) return null;

            return {
                time: match[1],
                text: match[2].trim(),
                nextTime: lines[index + 1]?.match(/\[(\d+:\d+\.\d+)\]/)?.[1]
            };
        }).filter(Boolean) as LyricsLine[];
    };

    // 时间转换函数
    const toSeconds = (timeStr: string): number => {
        if (!timeStr) return 0;
        const [minutes, rest] = timeStr.split(':');
        const [seconds, milliseconds] = rest.split('.');
        return parseInt(minutes) * 60 + parseInt(seconds) + parseInt(milliseconds) / 1000;
    };

    // 计算持续时间
    const calculateDuration = (currentTime: string, nextTime?: string): number => {
        const duration = toSeconds(nextTime || '') - toSeconds(currentTime);
        return duration > 0 ? duration : 3; // 最小保持1秒
    };

    return (
        <div className="songDetail">
            <div className="song-header">
                <h1 className="song_title">{musicName}</h1>
                <span className="song_artist">{musicArtist}</span>
            </div>

            <div className="songLyric" id="lyrics">
                {lyricsData.map((line, index) => {
                    const duration = calculateDuration(line.time, line.nextTime);
                    const timeId = line.time.replace(/:/g, '-').replace('.', '-');

                    return (
                        <p
                            key={index}
                            id={`time_${timeId}`}
                            data-text={line.text}
                            style={{ '--duration': `${duration}s` } as React.CSSProperties}
                        >
                            {line.text}
                        </p>
                    );
                })}
            </div>
        </div>
    );
}

export default SongDetail;
