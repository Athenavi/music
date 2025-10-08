"use client"

import type React from "react"
import {createContext, useContext, useEffect, useRef, useState} from "react"
import API_URL from "@/lib/config"

interface AudioContextType {
    audioRef: React.RefObject<HTMLAudioElement>
    playing: boolean
    setPlaying: (playing: boolean) => void
    musicId: string
    setMusicId: (musicId: string) => void
    currentTime: number
    setCurrentTime: (time: number) => void
    duration: number
    setDuration: (duration: number) => void
    volume: number
    setVolume: (volume: number) => void
    isMuted: boolean
    setIsMuted: (muted: boolean) => void
    togglePlay: () => void
    toggleMute: () => void
    handleNextSong: (nextMusicId: string) => void
    handleSong: (page: number) => void
    formatTime: (seconds: number) => string
    handleProgressChange: (e: React.ChangeEvent<HTMLInputElement>) => void
    handleVolumeChange: (e: React.ChangeEvent<HTMLInputElement>) => void
}

const AudioContext = createContext<AudioContextType | undefined>(undefined)

export function AudioProvider({children}: { children: React.ReactNode }) {
    const audioRef = useRef<HTMLAudioElement>(null)
    const [playing, setPlaying] = useState<boolean>(false)
    const [musicId, setMusicId] = useState<string>("0")
    const [currentTime, setCurrentTime] = useState<number>(0)
    const [duration, setDuration] = useState<number>(0)
    const [volume, setVolume] = useState<number>(1)
    const [isMuted, setIsMuted] = useState<boolean>(false)
    const musicIdRef = useRef<string>(musicId)

    useEffect(() => {
        if (typeof window !== "undefined") {
            setMusicId(localStorage.getItem("currentId") || "0")
            const savedVolume = localStorage.getItem("volume")
            setVolume(savedVolume !== null ? Number.parseFloat(savedVolume) : 1)
        }
    }, [])

    useEffect(() => {
        if (musicIdRef.current !== musicId) {
            musicIdRef.current = musicId
        }
    }, [musicId])

    useEffect(() => {
        if (typeof window !== "undefined") {
            localStorage.setItem("currentId", musicId)
        }
    }, [musicId])

    useEffect(() => {
        const audio = audioRef.current
        if (!audio) return

        const updateTime = () => {
            const currentTime = audio.currentTime
            setCurrentTime(currentTime)
            if (typeof window !== "undefined") {
                const progress = JSON.parse(localStorage.getItem("progress") || "{}")
                progress[musicIdRef.current] = currentTime
                localStorage.setItem("progress", JSON.stringify(progress))
            }
        }

        const updateDuration = () => setDuration(audio.duration)
        const updateVolume = () => {
            const currentVolume = audio.volume
            setVolume(currentVolume)
            setIsMuted(audio.muted)
            if (typeof window !== "undefined") {
                localStorage.setItem("volume", currentVolume.toString())
            }
        }

        audio.addEventListener("timeupdate", updateTime)
        audio.addEventListener("loadedmetadata", updateDuration)
        audio.addEventListener("volumechange", updateVolume)

        return () => {
            audio.removeEventListener("timeupdate", updateTime)
            audio.removeEventListener("loadedmetadata", updateDuration)
            audio.removeEventListener("volumechange", updateVolume)
        }
    }, [])

    useEffect(() => {
        const audio = audioRef.current
        if (!audio) return

        const handleLoadedMetadata = () => {
            if (typeof window !== "undefined") {
                const progress = JSON.parse(localStorage.getItem("progress") || "{}")
                const savedTime = progress[musicId] || 0
                audio.currentTime = savedTime
            }
        }

        audio.addEventListener("loadedmetadata", handleLoadedMetadata)
        return () => audio.removeEventListener("loadedmetadata", handleLoadedMetadata)
    }, [musicId])

    useEffect(() => {
        const audio = audioRef.current
        if (!audio) return

        if (typeof window !== "undefined") {
            const savedVolume = localStorage.getItem("volume")
            const initialVolume = savedVolume !== null ? Math.min(1, Math.max(0, Number.parseFloat(savedVolume))) : 1

            const handleLoadedMetadata = () => {
                audio.volume = initialVolume
                setIsMuted(initialVolume === 0)
            }

            audio.addEventListener("loadedmetadata", handleLoadedMetadata)
            return () => audio.removeEventListener("loadedmetadata", handleLoadedMetadata)
        }
    }, [])

    const handleNextSong = (nextMusicId: string) => {
        const audio = audioRef.current
        if (!audio) return

        setMusicId(nextMusicId)
        audio.pause()

        audio.onerror = () => {
            console.error("[v0] Failed to load audio:", `${API_URL}/music/${nextMusicId}.mp3`)
            alert("无法加载音频文件")
        }

        audio.src = `${API_URL}/music/${nextMusicId}.mp3`

        const handleCanPlay = () => {
            audio
                .play()
                .then(() => {
                    setPlaying(true)
                })
                .catch((error) => {
                    console.error("[v0] Play failed:", error)
                })
            audio.removeEventListener("canplaythrough", handleCanPlay)
        }

        audio.addEventListener("canplaythrough", handleCanPlay)
    }

    useEffect(() => {
        const audio = audioRef.current
        if (!audio) return

        const handleNextSongOnEnded = () => {
            if (typeof window !== "undefined") {
                const currentPlaylist = JSON.parse(localStorage.getItem("currentPlaylist") || '{"播放列表": []}')
                const playlist = currentPlaylist["播放列表"] as Array<{ id: string }>
                const currentIndex = playlist.findIndex((item) => item.id === musicId)

                if (currentIndex !== -1 && currentIndex < playlist.length - 1) {
                    const nextMusicId = playlist[currentIndex + 1].id
                    handleNextSong(nextMusicId)
                } else {
                    alert("已经是最后一首歌曲")
                }
            }
        }

        audio.addEventListener("ended", handleNextSongOnEnded)

        return () => {
            audio.removeEventListener("ended", handleNextSongOnEnded)
        }
    }, [musicId])

    const formatTime = (seconds: number): string => {
        const minutes = Math.floor(seconds / 60)
        const secs = Math.floor(seconds % 60)
        return `${minutes}:${secs.toString().padStart(2, "0")}`
    }

    const handleProgressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const time = Number.parseFloat(e.target.value)
        const audio = audioRef.current
        if (audio) {
            audio.currentTime = time
        }
    }

    const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const vol = Number.parseFloat(e.target.value)
        const audio = audioRef.current
        if (audio) {
            audio.volume = vol
            audio.muted = vol === 0
        }
    }

    const toggleMute = () => {
        const audio = audioRef.current
        if (audio) {
            audio.muted = !audio.muted
        }
    }

    const togglePlay = () => {
        const audio = audioRef.current
        if (!audio) return

        if (playing) {
            audio.pause()
        } else {
            audio.play()
        }
    }

    const handleSong = (page: number) => {
        const audio = audioRef.current
        if (!audio) return

        if (typeof window !== "undefined") {
            const currentPlaylist = JSON.parse(localStorage.getItem("currentPlaylist") || '{"播放列表": []}')
            const playlist = currentPlaylist["播放列表"] as Array<{ id: string }>
            const currentIndex = playlist.findIndex((item) => item.id === musicId)

            // 监听音频时间更新
            useEffect(() => {
                const audio = audioRef.current
                if (!audio) return

                const handleTimeUpdate = () => {
                    setCurrentTime(audio.currentTime)
                    // 派发全局事件
                    window.dispatchEvent(new CustomEvent('audioTimeUpdate', {
                        detail: {currentTime: audio.currentTime, isPlaying: !audio.paused}
                    }))
                }

                const handlePlay = () => {
                    setPlaying(true)
                    window.dispatchEvent(new CustomEvent('audioPlayState', {detail: true}))
                }

                const handlePause = () => {
                    setPlaying(false)
                    window.dispatchEvent(new CustomEvent('audioPlayState', {detail: false}))
                }

                audio.addEventListener('timeupdate', handleTimeUpdate)
                audio.addEventListener('play', handlePlay)
                audio.addEventListener('pause', handlePause)

                return () => {
                    audio.removeEventListener('timeupdate', handleTimeUpdate)
                    audio.removeEventListener('play', handlePlay)
                    audio.removeEventListener('pause', handlePause)
                }
            }, [])


            if (currentIndex !== -1) {
                const newIndex = currentIndex + page

                if (newIndex >= 0 && newIndex < playlist.length) {
                    const newMusicId = playlist[newIndex].id
                    setMusicId(newMusicId)
                    audio.pause()
                    audio.src = `${API_URL}/music/${newMusicId}.mp3`
                    const handleCanPlay = () => {
                        audio.play().then(() => {
                            setPlaying(true)
                        })
                        audio.removeEventListener("canplaythrough", handleCanPlay)
                    }

                    audio.addEventListener("canplaythrough", handleCanPlay)
                } else if (newIndex < 0) {
                    alert("已经是第一首歌曲")
                } else {
                    alert("已经是最后一首歌曲")
                }
            }
        }
    }

    return (
        <AudioContext.Provider
            value={{
                audioRef,
                playing,
                setPlaying,
                musicId,
                setMusicId,
                currentTime,
                setCurrentTime,
                duration,
                setDuration,
                volume,
                setVolume,
                isMuted,
                setIsMuted,
                togglePlay,
                toggleMute,
                handleNextSong,
                handleSong,
                formatTime,
                handleProgressChange,
                handleVolumeChange,
            }}
        >
            {children}
        </AudioContext.Provider>
    )
}

export function useAudio() {
    const context = useContext(AudioContext)
    if (context === undefined) {
        throw new Error("useAudio must be used within an AudioProvider")
    }
    return context
}
