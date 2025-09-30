"use client"

import Home from "@/components/home/home"
import {useAudio} from "@/app/providers/audio-provider"
import CurrentList from "@/components/CurrentList/CurrentList";
import {useState} from "react";
import SongDetail from "@/components/SongDetail/SongDetail";

export default function HomePage() {
    const {playing, setPlaying, handleNextSong, audioRef, musicId, setMusicId} = useAudio();
    const [isHidden, setIsHidden] = useState(false); // 状态用于控制CurrentList的显示与隐藏

    return (
        <div style={{display: 'flex', width: '100%', height: '100vh'}}>
            <div
                style={{
                    flex: isHidden ? 0 : 3,
                    width: isHidden ? '100%' : '75%',
                    overflow: 'hidden',
                    transition: 'width 0.3s ease' // 添加过渡效果
                }}> {/* Home组件根据isHidden状态调整样式 */}
                <Home
                    playing={playing}
                    setPlaying={setPlaying}
                    handleNextSong={handleNextSong}
                    audioRef={audioRef}
                    musicId={musicId}
                    setMusicId={setMusicId}
                />
            </div>
            <div style={{flex: 1, height: '100vh'}}><SongDetail musicId={musicId}/></div>
            <button
                style={{
                    position: 'absolute',
                    right: '120px',
                    zIndex: '99999',
                    cursor: 'pointer',
                    transition: 'right 0.3s ease' // 添加过渡效果
                }}
                onClick={() => setIsHidden(!isHidden)}> {/* 切换显示与隐藏 */}
                {isHidden ? '显示' : '隐藏'}
            </button>
            <div
                style={{
                    paddingTop: '66px',
                    flex: isHidden ? 0 : 1,
                    width: isHidden ? '0%' : '25%',
                    overflow: 'auto',
                    position: 'relative',
                    transition: 'width 0.3s ease' // 添加过渡效果
                }}> {/* CurrentList组件根据isHidden状态调整样式 */}
                {!isHidden && <CurrentList pid={1} setMusicId={setMusicId} handleNextSong={handleNextSong}/>}
            </div>
        </div>
    )
}
