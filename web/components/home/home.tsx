"use client"

import type React from "react"
import { useEffect, useState } from "react"
import API_URL from "@/lib/config"
import { SkipBack, SkipForward, Play, Pause } from "lucide-react"

interface HomeProps {
  playing: boolean
  setPlaying: React.Dispatch<React.SetStateAction<boolean>>
  handleNextSong: (nextMusicId: string) => void
  audioRef: React.RefObject<HTMLAudioElement>
  musicId: string
  setMusicId: React.Dispatch<React.SetStateAction<string>>
}

function Home({ playing, setPlaying, handleNextSong, audioRef, musicId, setMusicId }: HomeProps) {
  const [songTitle, setSongTitle] = useState<string>("Shattered Reality")
  const [artistName, setArtistName] = useState<string>("Distorsonic")
  const { togglePlay, handleSong, currentTime, formatTime } = useAudioControls(audioRef, playing, setPlaying, musicId)

  useEffect(() => {
    const fetchSongData = async () => {
      try {
        const response = await fetch(`${API_URL}/music_info/${musicId}`)
        if (response.ok) {
          const data = await response.json()
          setSongTitle(data.title || "Shattered Reality")
          setArtistName(data.artist || "Distorsonic")
        }
      } catch (error) {
        console.error("[v0] Failed to fetch song data:", error)
      }
    }
    fetchSongData()
  }, [musicId])

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-[#FFE5E8] via-[#FFD0D8] to-[#FFC0CB]">
      {/* Abstract geometric background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 h-96 w-2 bg-primary/40 animate-float-1 origin-center" />
        <div className="absolute top-1/3 right-1/3 h-[600px] w-3 bg-primary/30 animate-float-2 origin-center" />
        <div className="absolute bottom-1/4 right-1/4 h-80 w-2 bg-primary/50 animate-float-3 origin-center" />
        <div
          className="absolute top-1/2 left-1/2 h-[400px] w-4 bg-primary/20 animate-float-1"
          style={{ animationDelay: "5s" }}
        />
      </div>

      {/* Top info bar */}
      <div className="relative z-10 pt-20 px-6 text-center">
        <p className="text-sm text-foreground/70 max-w-2xl mx-auto leading-relaxed">
          This is Alice's real story. The radio put down by the Italian Police on March 12th 1977
        </p>
      </div>

      {/* Main player content - centered */}
      <div className="relative z-10 flex min-h-[calc(100vh-200px)] flex-col items-center justify-center px-6">
        {/* Song info */}
        <div className="text-center mb-16 space-y-4">
          <h1 className="text-6xl md:text-8xl font-bold text-primary tracking-tight text-balance">{songTitle}</h1>
          <p className="text-2xl md:text-4xl text-primary/70 font-medium">{artistName}</p>
        </div>

        {/* Player controls */}
        <div className="flex items-center gap-8 mb-8">
          <button
            onClick={() => handleSong(-1)}
            className="flex h-12 w-12 items-center justify-center text-primary transition-transform hover:scale-110"
            aria-label="Previous track"
          >
            <SkipBack className="h-8 w-8" />
          </button>

          <button
            onClick={togglePlay}
            className="flex h-16 w-16 items-center justify-center text-primary transition-transform hover:scale-110"
            aria-label={playing ? "Pause" : "Play"}
          >
            {playing ? <Pause className="h-10 w-10" /> : <Play className="h-10 w-10 ml-1" />}
          </button>

          <button
            onClick={() => handleSong(1)}
            className="flex h-12 w-12 items-center justify-center text-primary transition-transform hover:scale-110"
            aria-label="Next track"
          >
            <SkipForward className="h-8 w-8" />
          </button>
        </div>

        {/* Time display */}
        <div className="text-3xl font-bold text-primary tabular-nums">{formatTime(currentTime)}</div>
      </div>

      {/* Progress bar at bottom */}
      <div className="fixed bottom-0 left-0 right-0 h-1 bg-primary/20 z-20">
        <div
          className="h-full bg-primary transition-all duration-300"
          style={{
            width: `${audioRef.current ? (currentTime / (audioRef.current.duration || 1)) * 100 : 0}%`,
          }}
        />
      </div>
    </div>
  )
}

function useAudioControls(
  audioRef: React.RefObject<HTMLAudioElement>,
  playing: boolean,
  setPlaying: React.Dispatch<React.SetStateAction<boolean>>,
  musicId: string,
) {
  const [currentTime, setCurrentTime] = useState<number>(0)

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const updateTime = () => setCurrentTime(audio.currentTime)
    audio.addEventListener("timeupdate", updateTime)
    return () => audio.removeEventListener("timeupdate", updateTime)
  }, [audioRef])

  const togglePlay = () => {
    const audio = audioRef.current
    if (!audio) return
    if (playing) {
      audio.pause()
    } else {
      audio.play()
    }
  }

  const handleSong = (direction: number) => {
    const audio = audioRef.current
    if (!audio) return

    if (typeof window !== "undefined") {
      const currentPlaylist = JSON.parse(localStorage.getItem("currentPlaylist") || '{"播放列表": []}')
      const playlist = currentPlaylist["播放列表"] as Array<{ id: string }>
      const currentIndex = playlist.findIndex((item) => item.id === musicId)

      if (currentIndex !== -1) {
        const newIndex = currentIndex + direction
        if (newIndex >= 0 && newIndex < playlist.length) {
          const newMusicId = playlist[newIndex].id
          audio.pause()
          audio.src = `${API_URL}/music/${newMusicId}.mp3`
          audio.play()
        }
      }
    }
  }

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  return { togglePlay, handleSong, currentTime, formatTime }
}

export default Home
