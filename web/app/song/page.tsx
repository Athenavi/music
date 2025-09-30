"use client"

import { useEffect, useState, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { useAudio } from "@/app/providers/audio-provider"
import API_URL from "@/lib/config"
import { FaPlay, FaPause, FaHeart, FaShareAlt } from "react-icons/fa"

function SongPageContent() {
  const searchParams = useSearchParams()
  const songId = searchParams.get("id")
  const { musicId, setMusicId, handleNextSong, playing, togglePlay } = useAudio()

  const [songName, setSongName] = useState<string>("")
  const [artist, setArtist] = useState<string>("")
  const [lyricsData, setLyricsData] = useState<Array<{ time: string; text: string }>>([])
  const [isLoading, setIsLoading] = useState(true)

  const currentSongId = songId || musicId

  useEffect(() => {
    const fetchSongDetails = async () => {
      if (!currentSongId) return

      setIsLoading(true)
      try {
        const response = await fetch(`${API_URL}/song/name?id=${currentSongId}`)
        if (response.ok) {
          const data = await response.json()
          const [id, song_name, artist_name] = data[0]
          setSongName(song_name)
          setArtist(artist_name)
        }
      } catch (error) {
        console.error("Error fetching song details:", error)
      }
    }

    const fetchLyrics = async () => {
      if (!currentSongId) return

      try {
        const response = await fetch(`${API_URL}/api/lrc/${currentSongId}`)
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

    fetchSongDetails()
    fetchLyrics()
  }, [currentSongId])

  const parseLyrics = (rawText: string) => {
    const lines = rawText.split("\n")
    return lines
      .map((line) => {
        const match = line.match(/\[(\d+:\d+\.\d+)\](.*)/)
        if (!match) return null
        return {
          time: match[1],
          text: match[2].trim(),
        }
      })
      .filter(Boolean) as Array<{ time: string; text: string }>
  }

  const handlePlaySong = () => {
    if (currentSongId !== musicId) {
      setMusicId(currentSongId)
      handleNextSong(currentSongId)
    } else {
      togglePlay()
    }
  }

  const isCurrentSong = currentSongId === musicId

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">加载中...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background pb-32">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Song Header */}
        <div className="flex flex-col md:flex-row gap-8 mb-12">
          <div className="flex-shrink-0">
            <img
              src={`${API_URL}/music_cover/${currentSongId}.png`}
              alt={songName}
              className="w-64 h-64 rounded-lg shadow-2xl object-cover"
            />
          </div>

          <div className="flex flex-col justify-center space-y-4">
            <div>
              <h1 className="text-4xl font-bold text-foreground mb-2">{songName}</h1>
              <p className="text-xl text-muted-foreground">{artist}</p>
            </div>

            <div className="flex gap-4">
              <button
                onClick={handlePlaySong}
                className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-full hover:bg-primary/90 transition-colors"
              >
                {isCurrentSong && playing ? (
                  <>
                    <FaPause className="w-5 h-5" />
                    <span>暂停</span>
                  </>
                ) : (
                  <>
                    <FaPlay className="w-5 h-5" />
                    <span>播放</span>
                  </>
                )}
              </button>

              <button className="flex items-center justify-center w-12 h-12 rounded-full bg-muted hover:bg-muted/80 transition-colors">
                <FaHeart className="w-5 h-5 text-muted-foreground" />
              </button>

              <button className="flex items-center justify-center w-12 h-12 rounded-full bg-muted hover:bg-muted/80 transition-colors">
                <FaShareAlt className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>
          </div>
        </div>

        {/* Lyrics Section */}
        <div className="bg-card rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-semibold mb-6 text-foreground">歌词</h2>
          <div className="space-y-4 max-h-[600px] overflow-y-auto" id="lyrics">
            {lyricsData.length > 0 ? (
              lyricsData.map((line, index) => {
                const timeId = line.time.replace(/:/g, "-").replace(".", "-")
                return (
                  <p
                    key={index}
                    id={`time_${timeId}`}
                    className="text-muted-foreground transition-all duration-300 py-2 [&.active]:text-primary [&.active]:font-semibold [&.active]:scale-105"
                  >
                    {line.text}
                  </p>
                )
              })
            ) : (
              <p className="text-muted-foreground text-center py-8">暂无歌词</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function SongPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center">
          <p className="text-muted-foreground">加载中...</p>
        </div>
      }
    >
      <SongPageContent />
    </Suspense>
  )
}
