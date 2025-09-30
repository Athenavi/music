"use client"

import { useAudio } from "@/app/providers/audio-provider"
import API_URL from "@/lib/config"

export function AudioPlayer() {
  const { audioRef, playing, setPlaying, musicId } = useAudio()

  return (
    <>
      <audio
        ref={audioRef}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        src={`${API_URL}/music/${musicId}.mp3`}
        className="hidden"
      />
    </>
  )
}
