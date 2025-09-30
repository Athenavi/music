"use client"

import type React from "react"
import { useState, useEffect } from "react"
import API_URL from "@/lib/config"

interface LyricsLine {
  time: string
  text: string
  nextTime?: string
}

interface SongDetailProps {
  musicId: string
}

function SongDetail({ musicId }: SongDetailProps) {
  const [lyricsData, setLyricsData] = useState<LyricsLine[]>([])
  const [musicName, setMusicName] = useState<string>("")
  const [musicArtist, setMusicArtist] = useState<string>("")

  useEffect(() => {
    const fetchSongDetails = async () => {
      try {
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

        return {
          time: match[1],
          text: match[2].trim(),
          nextTime: lines[index + 1]?.match(/\[(\d+:\d+\.\d+)\]/)?.[1],
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

  return (
    <div className="space-y-6">
      <div className="text-center border-b border-border pb-4">
        <h1 className="text-2xl font-bold text-foreground mb-2">{musicName}</h1>
        <span className="text-sm text-muted-foreground">{musicArtist}</span>
      </div>

      <div className="space-y-3">
        {lyricsData.map((line, index) => {
          const duration = calculateDuration(line.time, line.nextTime)
          const timeId = line.time.replace(/:/g, "-").replace(".", "-")

          return (
            <p
              key={index}
              id={`time_${timeId}`}
              data-text={line.text}
              className="text-muted-foreground transition-all duration-300 text-center py-2 [&.active]:text-primary [&.active]:font-semibold [&.active]:scale-110"
              style={{ "--duration": `${duration}s` } as React.CSSProperties}
            >
              {line.text}
            </p>
          )
        })}
      </div>
    </div>
  )
}

export default SongDetail
