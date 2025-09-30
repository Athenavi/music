"use client"

import { useState, useEffect } from "react"
import { useAudio } from "@/app/providers/audio-provider"
import API_URL from "@/lib/config"
import { FiMusic, FiHeart, FiPlus, FiShare2, FiAlertCircle } from "react-icons/fi"

interface TopSong {
  id: string
  artist: string
  title: string
}

export default function TopListPage() {
  const [data, setData] = useState<TopSong[]>([])
  const [visibleData, setVisibleData] = useState<TopSong[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const loadMoreCount = 30

  const { setMusicId, handleNextSong } = useAudio()

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(`${API_URL}/api/toplist`)
        if (!response.ok) throw new Error("数据加载失败")
        const result = await response.json()
        const converted = result.map((item: any) => ({
          id: item[0],
          artist: item[1],
          title: item[2],
        }))
        setData(converted)
        setVisibleData(converted.slice(0, loadMoreCount))
        setLoading(false)
      } catch (err) {
        setError(err instanceof Error ? err.message : "数据加载失败")
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const loadMore = () => {
    setVisibleData(data.slice(0, visibleData.length + loadMoreCount))
  }

  const handlePlaySong = (song: TopSong) => {
    setMusicId(song.id)
    handleNextSong(song.id)
  }

  const addToCurrentPlaylist = (song: TopSong) => {
    const currentPlaylist = JSON.parse(localStorage.getItem("currentPlaylist") || '{"播放列表": []}')
    const exists = currentPlaylist["播放列表"].some((item: any) => item.id === Number(song.id))

    if (!exists) {
      currentPlaylist["播放列表"].push({
        id: Number(song.id),
        title: song.title,
        artist: song.artist,
      })
      localStorage.setItem("currentPlaylist", JSON.stringify(currentPlaylist))
      alert("已添加到播放列表")
    } else {
      alert("歌曲已在播放列表中")
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <FiMusic className="w-12 h-12 mx-auto mb-4 text-primary animate-pulse" />
          <p className="text-muted-foreground">正在加载榜单...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <FiAlertCircle className="w-12 h-12 mx-auto mb-4 text-destructive" />
          <p className="text-muted-foreground">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background pb-32">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground flex items-center gap-3">
            <FiMusic className="w-8 h-8" />
            热门排行榜
          </h1>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {visibleData.map((song, index) => (
            <div key={`${song.id}-${index}`} className="group relative">
              <div className="bg-card rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300">
                {/* Rank Badge */}
                <div className="absolute top-2 left-2 z-10 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold text-sm shadow-lg">
                  {index + 1}
                </div>

                {/* Album Cover */}
                <div
                  className="aspect-square relative overflow-hidden cursor-pointer"
                  onClick={() => handlePlaySong(song)}
                >
                  <img
                    src={`${API_URL}/music_cover/${song.id}.png`}
                    alt={song.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors duration-300 flex items-center justify-center">
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <button className="w-12 h-12 bg-primary text-primary-foreground rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform">
                        <FiMusic className="w-6 h-6" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Song Info */}
                <div className="p-4">
                  <h3 className="font-semibold text-foreground truncate mb-1">{song.title}</h3>
                  <p className="text-sm text-muted-foreground truncate">{song.artist}</p>

                  {/* Action Buttons */}
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => addToCurrentPlaylist(song)}
                      className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-primary/10 hover:bg-primary/20 text-primary rounded-md transition-colors text-sm"
                      title="添加到播放列表"
                    >
                      <FiPlus className="w-4 h-4" />
                    </button>
                    <button
                      className="flex items-center justify-center px-3 py-2 bg-muted hover:bg-muted/80 rounded-md transition-colors"
                      title="喜欢"
                    >
                      <FiHeart className="w-4 h-4 text-muted-foreground" />
                    </button>
                    <button
                      className="flex items-center justify-center px-3 py-2 bg-muted hover:bg-muted/80 rounded-md transition-colors"
                      title="分享"
                    >
                      <FiShare2 className="w-4 h-4 text-muted-foreground" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Load More Button */}
        {visibleData.length < data.length && (
          <div className="mt-12 text-center">
            <button
              onClick={loadMore}
              className="px-8 py-3 bg-primary text-primary-foreground rounded-full hover:bg-primary/90 transition-colors shadow-lg"
            >
              加载更多
              <span className="ml-2 text-sm opacity-80">
                ({visibleData.length}/{data.length})
              </span>
            </button>
          </div>
        )}

        {/* Footer */}
        {visibleData.length >= data.length && (
          <div className="mt-12 text-center">
            <FiMusic className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-muted-foreground">前面的区域，以后再来探索吧！</p>
          </div>
        )}
      </div>
    </div>
  )
}
