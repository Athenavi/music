"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import API_URL from "@/lib/config"
import { useAudio } from "@/app/providers/audio-provider"

interface LyricsLine {
    time: string
    text: string
    nextTime?: string
    timeInSeconds: number
}

interface SongDetailProps {
    musicId: string
}

function SongDetail({ musicId }: SongDetailProps) {
    const [lyricsData, setLyricsData] = useState<LyricsLine[]>([])
    const [musicName, setMusicName] = useState<string>("")
    const [musicArtist, setMusicArtist] = useState<string>("")
    const [isLoading, setIsLoading] = useState(true)
    const [hoveredLine, setHoveredLine] = useState<number | null>(null)

    const {
        currentTime,
        playing: isPlaying,
        audioRef
    } = useAudio()

    const animationFrameRef = useRef<number>()
    const lyricsContainerRef = useRef<HTMLDivElement>(null)

    // 处理歌词行点击事件 - 直接操作 audioRef
    const handleLyricClick = (timeInSeconds: number) => {
        if (audioRef?.current) {
            // 直接设置 audio 元素的 currentTime
            audioRef.current.currentTime = timeInSeconds

            // 如果音频没有在播放，开始播放
            if (!isPlaying && audioRef.current) {
                audioRef.current.play().catch(console.error)
            }
        }
    }

    // 其他代码保持不变...
    useEffect(() => {
        const updateTime = () => {
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

    const getActiveLineIndex = (): number => {
        for (let i = lyricsData.length - 1; i >= 0; i--) {
            if (currentTime >= lyricsData[i].timeInSeconds) {
                return i
            }
        }
        return -1
    }

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

    // 播放图标组件
    const PlayIcon = ({ className = "" }: { className?: string }) => (
        <svg
            className={`w-5 h-5 ${className}`}
            fill="currentColor"
            viewBox="0 0 24 24"
        >
            <path d="M8 5v14l11-7z"/>
        </svg>
    )

    // 格式化时间显示
    const formatTime = (seconds: number): string => {
        const mins = Math.floor(seconds / 60)
        const secs = Math.floor(seconds % 60)
        return `${mins}:${secs.toString().padStart(2, '0')}`
    }

    // 网易云音乐风格的逐字歌词渲染
    const renderNetEaseStyleLyrics = (line: LyricsLine, index: number) => {
        const isActive = isLineActive(index)
        const isPast = isLinePast(index)
        const duration = calculateDuration(line.time, line.nextTime)
        const chars = line.text.split('')
        const charDuration = duration / chars.length

        // 计算当前字符的进度
        const getCharProgress = (charIndex: number): number => {
            if (!isActive) return 0

            const lineStartTime = line.timeInSeconds
            const elapsedInLine = currentTime - lineStartTime
            const charStartTime = charIndex * charDuration
            const charEndTime = (charIndex + 1) * charDuration

            if (elapsedInLine < charStartTime) return 0
            if (elapsedInLine >= charEndTime) return 1

            return (elapsedInLine - charStartTime) / charDuration
        }

        if (isActive) {
            return (
                <div
                    key={index}
                    id={`lyrics-line-${index}`}
                    className="lyrics-line relative mb-8 transition-all duration-500 group"
                    onMouseEnter={() => setHoveredLine(index)}
                    onMouseLeave={() => setHoveredLine(null)}
                    onClick={() => handleLyricClick(line.timeInSeconds)}
                >
                    {/* 播放图标 - 鼠标悬停时显示 */}
                    <div
                        className={`absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-10 transition-all duration-300 cursor-pointer ${
                            hoveredLine === index ? 'opacity-100 scale-110' : 'opacity-0 scale-90'
                        }`}
                        onClick={(e) => {
                            e.stopPropagation()
                            handleLyricClick(line.timeInSeconds)
                        }}
                    >
                        <div className="bg-red-500 rounded-full p-2 shadow-lg hover:bg-red-600 transition-colors">
                            <PlayIcon className="text-white" />
                        </div>
                    </div>

                    {/* 当前行背景 - 网易云风格 */}
                    <div
                        className="absolute inset-0 bg-gradient-to-r from-red-500/10 to-pink-500/10 rounded-2xl scale-105 -mx-8 px-8 transition-all duration-500 border border-red-200/20 backdrop-blur-sm cursor-pointer"/>

                    {/* 播放进度指示器 - 网易云风格 */}
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-red-200/20 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-red-500 to-pink-500 transition-all duration-100"
                            style={{
                                width: `${((currentTime - line.timeInSeconds) / duration) * 100}%`
                            }}
                        />
                    </div>

                    <p className="relative text-center py-5 transition-all duration-500 transform text-2xl font-medium tracking-wide cursor-pointer">
                        {chars.map((char, charIndex) => {
                            const progress = getCharProgress(charIndex)
                            const isCharActive = progress > 0

                            return (
                                <span
                                    key={charIndex}
                                    className="inline-block relative"
                                >
                                    {/* 字符背景 - 网易云逐字效果 */}
                                    <span
                                        className={`absolute inset-0 bg-gradient-to-r from-red-500 to-pink-500 transition-all duration-150 rounded-sm ${
                                            isCharActive ? 'opacity-20' : 'opacity-0'
                                        }`}
                                        style={{
                                            transform: `scaleX(${progress})`,
                                            transformOrigin: 'left center'
                                        }}
                                    />

                                    {/* 字符主体 */}
                                    <span
                                        className={`relative inline-block transition-all duration-150 ${
                                            isCharActive
                                                ? 'text-red-700 font-semibold scale-105'
                                                : 'text-gray-600 scale-100'
                                        } ${
                                            progress === 1 ? 'drop-shadow-[0_2px_4px_rgba(239,68,68,0.3)]' : ''
                                        }`}
                                        style={{
                                            transform: `scale(${isCharActive ? 1.05 : 1}) translateY(${isCharActive ? '-1px' : '0px'})`,
                                            filter: isCharActive ? 'none' : 'none'
                                        }}
                                    >
                                        {char === ' ' ? '\u00A0' : char}
                                    </span>

                                    {/* 字符光标效果 - 网易云风格 */}
                                    {isCharActive && progress > 0 && progress < 1 && (
                                        <span
                                            className="absolute -bottom-1 left-0 w-full h-0.5 bg-red-500 rounded-full"
                                            style={{
                                                transform: `scaleX(${progress})`,
                                                transformOrigin: 'left center'
                                            }}
                                        />
                                    )}
                                </span>
                            )
                        })}
                    </p>

                    {/* 播放指示器 - 网易云风格 */}
                    <div className="absolute left-1/2 -bottom-4 transform -translate-x-1/2">
                        <div className="flex space-x-1">
                            {[1, 2, 3].map((dot) => (
                                <div
                                    key={dot}
                                    className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                                        isPlaying
                                            ? 'bg-red-500 animate-bounce'
                                            : 'bg-red-300'
                                    }`}
                                    style={{
                                        animationDelay: `${dot * 0.1}s`,
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
            <div
                key={index}
                id={`lyrics-line-${index}`}
                className={`lyrics-line relative text-center py-4 transition-all duration-300 text-xl font-normal tracking-normal group cursor-pointer ${
                    isPast
                        ? 'text-gray-400 scale-95'
                        : 'text-gray-500 scale-100'
                } ${isPast ? 'opacity-60' : 'opacity-80'}`}
                onMouseEnter={() => setHoveredLine(index)}
                onMouseLeave={() => setHoveredLine(null)}
                onClick={() => handleLyricClick(line.timeInSeconds)}
            >
                {/* 播放图标 - 鼠标悬停时显示 */}
                <div
                    className={`absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-10 transition-all duration-300 cursor-pointer ${
                        hoveredLine === index ? 'opacity-100 scale-110' : 'opacity-0 scale-90'
                    }`}
                    onClick={(e) => {
                        e.stopPropagation()
                        handleLyricClick(line.timeInSeconds)
                    }}
                >
                    <div className="bg-gray-400 rounded-full p-2 shadow-lg hover:bg-gray-500 transition-colors">
                        <PlayIcon className="text-white" />
                    </div>
                </div>

                <p className="relative">
                    {line.text}
                </p>

                {/* 时间标签 - 鼠标悬停时显示 */}
                <div
                    className={`absolute right-0 top-1/2 transform -translate-y-1/2 translate-x-12 transition-all duration-300 text-xs font-mono ${
                        hoveredLine === index ? 'opacity-100' : 'opacity-0'
                    } text-gray-400 bg-white/80 px-2 py-1 rounded-full border`}
                >
                    {formatTime(line.timeInSeconds)}
                </div>
            </div>
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
            {/* 歌曲信息 - 网易云风格 */}
            <div className="text-center border-b border-gray-100 pb-6 flex-shrink-0">
                <h1 className="text-3xl font-bold text-gray-900 mb-3 tracking-tight">{musicName}</h1>
                <span className="text-base text-gray-600 font-medium">{musicArtist}</span>

                {/* 当前时间显示 */}
                <div className="mt-3 text-sm text-gray-500 font-mono">
                    {formatTime(currentTime)}
                    {isPlaying && (
                        <span className="ml-3 inline-flex items-center">
                            <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse mr-1"></span>
                            播放中
                        </span>
                    )}
                </div>
            </div>

            {/* 歌词容器 */}
            <div
                ref={lyricsContainerRef}
                className="lyrics-container flex-1 overflow-y-auto py-8 scroll-smooth"
                style={{
                    background: 'linear-gradient(180deg, rgba(255,255,255,0) 0%, rgba(249,250,251,0.8) 100%)'
                }}
            >
                <div className="space-y-1 px-12">
                    {lyricsData.length > 0 ? (
                        lyricsData.map((line, index) => renderNetEaseStyleLyrics(line, index))
                    ) : (
                        <div className="text-center text-gray-500 py-12 text-lg">
                            {isLoading ? '加载歌词中...' : '暂无歌词'}
                        </div>
                    )}
                </div>
            </div>

            {/* 自定义样式 */}
            <style jsx>{`
                .lyrics-container {
                    scrollbar-width: thin;
                    scrollbar-color: #e5e7eb #f9fafb;
                }

                .lyrics-container::-webkit-scrollbar {
                    width: 4px;
                }

                .lyrics-container::-webkit-scrollbar-track {
                    background: #f9fafb;
                    border-radius: 2px;
                }

                .lyrics-container::-webkit-scrollbar-thumb {
                    background: #e5e7eb;
                    border-radius: 2px;
                }

                .lyrics-container::-webkit-scrollbar-thumb:hover {
                    background: #d1d5db;
                }

                /* 网易云音乐风格的动画 */
                @keyframes charGlow {
                    0% { text-shadow: 0 0 0px rgba(239, 68, 68, 0); }
                    50% { text-shadow: 0 0 8px rgba(239, 68, 68, 0.3); }
                    100% { text-shadow: 0 0 0px rgba(239, 68, 68, 0); }
                }

                .char-active {
                    animation: charGlow 0.6s ease-in-out;
                }
            `}</style>
        </div>
    )
}

export default SongDetail