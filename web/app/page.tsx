"use client"

import Home from "@/components/home/home"
import { useAudio } from "@/app/providers/audio-provider"

export default function HomePage() {
  const { playing, setPlaying, handleNextSong, audioRef, musicId, setMusicId } = useAudio()

  return (
    <Home
      playing={playing}
      setPlaying={setPlaying}
      handleNextSong={handleNextSong}
      audioRef={audioRef}
      musicId={musicId}
      setMusicId={setMusicId}
    />
  )
}
