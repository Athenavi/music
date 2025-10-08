"use client"

import type React from "react"
import {useState, useEffect, useRef} from "react"
import API_URL from "@/lib/config"

interface LyricsLine {
    time: string
    text: string
    nextTime?: string
    timeInSeconds: number
}

interface SongDetailProps {
    musicId: string
    audioElementId?: string // 可选的audio元素ID
}

function SongDetail({musicId, audioElementId = "audio-player"}: SongDetailProps) {
    const [lyricsData, setLyricsData] = useState<LyricsLine[]>([])
    const [musicName, setMusicName] = useState<string>("")
    const [musicArtist, setMusicArtist] = useState<string>("")
    const [currentTime, setCurrentTime] = useState<number>(0)
    const [isLoading, setIsLoading] = useState(true)
    const [isPlaying, setIsPlaying] = useState(false)

    const animationFrameRef = useRef<number>()
    const audioElementRef = useRef<HTMLAudioElement | null>(null)
    const lyricsContainerRef = useRef<HTMLDivElement>(null)

    // 监听全局音频事件
    useEffect(() => {
        const handleAudioTimeUpdate = (event: CustomEvent) => {
            setCurrentTime(event.detail.currentTime)
            setIsPlaying(event.detail.isPlaying)
        }

        const handleAudioPlayState = (event: CustomEvent) => {
            setIsPlaying(event.detail)
        }

        // 监听自定义事件
        window.addEventListener('audioTimeUpdate', handleAudioTimeUpdate as EventListener)
        window.addEventListener('audioPlayState', handleAudioPlayState as EventListener)

        return () => {
            window.removeEventListener('audioTimeUpdate', handleAudioTimeUpdate as EventListener)
            window.removeEventListener('audioPlayState', handleAudioPlayState as EventListener)
        }
    }, [])

    // 动画循环更新当前时间（更平滑的更新）
    useEffect(() => {
        const updateTime = () => {
            if (audioElementRef.current) {
                setCurrentTime(audioElementRef.current.currentTime)
            }
            animationFrameRef.current = requestAnimationFrame(updateTime)
        }

        if (isPlaying) {
            animationFrameRef.current = requestAnimationFrame(updateTime)
        }

        return () => {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current)
            }
        }
    }, [isPlaying])

    useEffect(() => {
        const fetchSongDetails = async () => {
            try {
                setIsLoading(true)
                const response = await fetch(`${API_URL}/song/name?id=${musicId}`)
                if (response.ok) {
                    const data = await response.json()
                    const [id, song_name, artist] = data[0]
                    setMusicName(song_name)
                    setMusicArtist(artist)
                }
            } catch (error) {
                console.error("Error fetching song details:", error)
            }
        }

        if (musicId) fetchSongDetails()
    }, [musicId])

    useEffect(() => {
        const fetchAndParseLyrics = async () => {
            try {
                const response = await fetch(`${API_URL}/api/lrc/${musicId}`)
                if (response.ok) {
                    const rawText = await response.text()
                    const parsed = parseLyrics(rawText)
                    setLyricsData(parsed)
                }
            } catch (error) {
                console.error("Error fetching lyrics:", error)
            } finally {
                setIsLoading(false)
            }
        }

        if (musicId) fetchAndParseLyrics()
    }, [musicId])

    const parseLyrics = (rawText: string): LyricsLine[] => {
        const lines = rawText.split("\n")
        return lines
            .map((line, index) => {
                const match = line.match(/\[(\d+:\d+\.\d+)\](.*)/)
                if (!match) return null

                const timeInSeconds = toSeconds(match[1])

                return {
                    time: match[1],
                    text: match[2].trim(),
                    nextTime: lines[index + 1]?.match(/\[(\d+:\d+\.\d+)\]/)?.[1],
                    timeInSeconds
                }
            })
            .filter(Boolean) as LyricsLine[]
    }

    const toSeconds = (timeStr: string): number => {
        if (!timeStr) return 0
        const [minutes, rest] = timeStr.split(":")
        const [seconds, milliseconds] = rest.split(".")
        return Number.parseInt(minutes) * 60 + Number.parseInt(seconds) + Number.parseInt(milliseconds) / 1000
    }

    const calculateDuration = (currentTime: string, nextTime?: string): number => {
        const duration = toSeconds(nextTime || "") - toSeconds(currentTime)
        return duration > 0 ? duration : 3
    }

    // 获取当前活跃的歌词行
    const getActiveLineIndex = (): number => {
        for (let i = lyricsData.length - 1; i >= 0; i--) {
            if (currentTime >= lyricsData[i].timeInSeconds) {
                return i
            }
        }
        return -1
    }

    // 自动滚动到当前歌词
    useEffect(() => {
        const activeIndex = getActiveLineIndex()
        if (activeIndex >= 0 && lyricsContainerRef.current) {
            const activeElement = document.getElementById(`lyrics-line-${activeIndex}`)
            if (activeElement) {
                activeElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'center'
                })
            }
        }
    }, [currentTime, lyricsData])

    const isLineActive = (lineIndex: number): boolean => {
        return lineIndex === getActiveLineIndex()
    }

    const isLinePast = (lineIndex: number): boolean => {
        return lineIndex < getActiveLineIndex()
    }

    const renderCharByCharLyrics = (line: LyricsLine, index: number) => {
        const isActive = isLineActive(index)
        const isPast = isLinePast(index)
        const duration = calculateDuration(line.time, line.nextTime)
        const chars = line.text.split('')
        const charDuration = duration / chars.length

        // 计算当前字符的进度（0到1）
        const getCharProgress = (charIndex: number): number => {
            if (!isActive) return 0

            const lineStartTime = line.timeInSeconds
            const elapsedInLine = currentTime - lineStartTime
            const charEndTime = (charIndex + 1) * charDuration

            return Math.min(Math.max(elapsedInLine / charEndTime, 0), 1)
        }

        if (isActive) {
            return (
                <div
                    key={index}
                    id={`lyrics-line-${index}`}
                    className="lyrics-line relative mb-6 transition-all duration-500"
                >
                    {/* 当前行高亮背景 */}
                    <div
                        className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-xl scale-105 -mx-6 px-6 transition-all duration-500 border border-blue-200/30"/>

                    {/* 播放进度指示条 */}
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-200/30 rounded-b-xl overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-100"
                            style={{
                                width: `${((currentTime - line.timeInSeconds) / duration) * 100}%`
                            }}
                        />
                    </div>

                    <p className="relative text-center py-4 transition-all duration-500 transform text-xl">
                        {chars.map((char, charIndex) => {
                            const progress = getCharProgress(charIndex)
                            const isRevealed = progress > 0

                            return (
                                <span
                                    key={charIndex}
                                    className={`inline-block transition-all duration-150 ${
                                        isRevealed
                                            ? 'text-blue-700 font-bold scale-110'
                                            : 'text-blue-400 scale-100'
                                    }`}
                                    style={{
                                        transform: `scale(${isRevealed ? 1.1 : 1}) translateY(${isRevealed ? '-2px' : '0px'})`,
                                        filter: isRevealed ? 'drop-shadow(0 2px 4px rgb(0 0 0 / 0.1))' : 'none'
                                    }}
                                >
                                    {char === ' ' ? '\u00A0' : char}
                                </span>
                            )
                        })}
                    </p>

                    {/* 播放指示器 */}
                    <div className="absolute left-1/2 -bottom-3 transform -translate-x-1/2">
                        <div className="flex space-x-1">
                            {[1, 2, 3].map((dot) => (
                                <div
                                    key={dot}
                                    className={`w-2 h-2 rounded-full transition-all duration-300 ${
                                        isPlaying
                                            ? 'bg-blue-500 animate-pulse'
                                            : 'bg-blue-300'
                                    }`}
                                    style={{
                                        animationDelay: `${dot * 0.2}s`,
                                        opacity: isPlaying ? 1 : 0.6
                                    }}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            )
        }

        return (
            <p
                key={index}
                id={`lyrics-line-${index}`}
                className={`lyrics-line text-center py-3 transition-all duration-300 text-lg ${
                    isPast
                        ? 'text-gray-400'
                        : 'text-gray-600'
                } ${isPast ? 'scale-95' : 'scale-100'}`}
            >
                {line.text}
            </p>
        )
    }

    // 加载状态
    if (isLoading) {
        return (
            <div className="space-y-6 animate-pulse">
                <div className="text-center border-b border-gray-200 pb-4">
                    <div className="h-8 bg-gray-200 rounded w-48 mx-auto mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-32 mx-auto"></div>
                </div>

                <div className="space-y-4">
                    {[...Array(8)].map((_, index) => (
                        <div key={index} className="text-center">
                            <div
                                className={`h-6 bg-gray-200 rounded mx-auto ${
                                    index % 3 === 1 ? 'w-3/4' : index % 3 === 2 ? 'w-1/2' : 'w-full'
                                }`}
                            ></div>
                        </div>
                    ))}
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6 h-full flex flex-col">
            {/* 歌曲信息 */}
            <div className="text-center border-b border-gray-200 pb-4 flex-shrink-0">
                <h1 className="text-2xl font-bold text-gray-900 mb-2">{musicName}</h1>
                <span className="text-sm text-gray-500">{musicArtist}</span>

                {/* 当前时间显示 */}
                <div className="mt-2 text-xs text-gray-400">
                    当前时间: {Math.floor(currentTime / 60)}:{(currentTime % 60).toFixed(2).padStart(5, '0')}
                    {isPlaying && <span className="ml-2 text-green-500">● 播放中</span>}
                </div>
            </div>

            {/* 歌词容器 */}
            <div
                ref={lyricsContainerRef}
                className="lyrics-container flex-1 overflow-y-auto py-4 scroll-smooth"
            >
                <div className="space-y-2">
                    {lyricsData.length > 0 ? (
                        lyricsData.map((line, index) => renderCharByCharLyrics(line, index))
                    ) : (
                        <div className="text-center text-gray-500 py-8">
                            {isLoading ? '加载歌词中...' : '暂无歌词'}
                        </div>
                    )}
                </div>
            </div>

            {/* 音频状态提示 */}
            {!audioElementRef.current && (
                <div className="text-center text-orange-500 text-sm bg-orange-50 py-2 rounded-lg">
                    未检测到音频播放器，歌词将不会自动滚动
                </div>
            )}

            {/* 自定义样式 */}
            <style jsx>{`
                .lyrics-container {
                    scrollbar-width: thin;
                    scrollbar-color: #cbd5e0 #f7fafc;
                }

                .lyrics-container::-webkit-scrollbar {
                    width: 6px;
                }

                .lyrics-container::-webkit-scrollbar-track {
                    background: #f7fafc;
                    border-radius: 3px;
                }

                .lyrics-container::-webkit-scrollbar-thumb {
                    background: #cbd5e0;
                    border-radius: 3px;
                }

                .lyrics-container::-webkit-scrollbar-thumb:hover {
                    background: #a0aec0;
                }
            `}</style>
        </div>
    )
}

export default SongDetail