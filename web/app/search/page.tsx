"use client"

import { useState, useCallback, useMemo } from "react"
import { useAudio } from "@/app/providers/audio-provider"
import API_URL from "@/lib/config"
import { FiSearch, FiMusic, FiAlertCircle, FiLoader, FiPlus } from "react-icons/fi"

interface Song {
  id: number
  name: string
  artists: { name: string }[]
  album: { name: string; artist: { name: string } }
  duration: number
}

export default function SearchPage() {
  const [keyword, setKeyword] = useState<string>("")
  const [results, setResults] = useState<Song[]>([])
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string>("")
  const [visibleItems, setVisibleItems] = useState<number>(20)

  const { setMusicId, handleNextSong } = useAudio()

  const handleSearch = useCallback(async () => {
    if (!keyword.trim()) return

    setLoading(true)
    setError("")
    setResults([])
    setVisibleItems(20)

    try {
      const response = await fetch(`${API_URL}/api/search?keyword=${encodeURIComponent(keyword)}`)
      const data = await response.json()

      if (data.code === 200 && data.result?.songs) {
        setResults(data.result.songs)
      } else {
        setError("未找到结果")
      }
    } catch (err) {
      setError("请求失败，请稍后重试")
    } finally {
      setLoading(false)
    }
  }, [keyword])

  const loadMoreItems = useCallback(() => {
    setVisibleItems((prev) => Math.min(prev + 20, results.length))
  }, [results.length])

  const visibleSongs = useMemo(() => results.slice(0, visibleItems), [results, visibleItems])

  const handlePlaySong = (song: Song) => {
    setMusicId(song.id.toString())
    handleNextSong(song.id.toString())
  }

  const addToPlaylist = (song: Song) => {
    const currentPlaylist = JSON.parse(localStorage.getItem("currentPlaylist") || '{"播放列表": []}')
    const exists = currentPlaylist["播放列表"].some((item: any) => item.id === song.id)

    if (!exists) {
      currentPlaylist["播放列表"].push({
        id: song.id,
        title: song.name,
        artist: song.artists.map((artist) => artist.name).join(", "),
      })
      localStorage.setItem("currentPlaylist", JSON.stringify(currentPlaylist))
      alert("已添加到播放列表")
    } else {
      alert("歌曲已在播放列表中")
    }
  }

  return (
    <div className="min-h-screen bg-background pb-32">
      <div className="container mx-auto px-4 py-8">
        {/* Search Header */}
        <div className="max-w-3xl mx-auto mb-12">
          <h1 className="text-4xl font-bold text-foreground flex items-center gap-3 mb-6">
            <FiMusic className="w-8 h-8" />
            音乐搜索
          </h1>

          <div className="flex gap-3">
            <div className="flex-1 relative">
              <input
                type="text"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="输入歌曲或艺术家名称"
                onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                className="w-full px-6 py-4 bg-card border border-border rounded-full text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <button
              onClick={handleSearch}
              disabled={loading || !keyword.trim()}
              className="px-8 py-4 bg-primary text-primary-foreground rounded-full hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-medium"
            >
              <FiSearch className="w-5 h-5" />
              搜索
            </button>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-16">
            <FiLoader className="w-12 h-12 text-primary animate-spin mb-4" />
            <p className="text-muted-foreground">加载中...</p>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="flex flex-col items-center justify-center py-16">
            <FiAlertCircle className="w-12 h-12 text-destructive mb-4" />
            <p className="text-muted-foreground">{error}</p>
          </div>
        )}

        {/* Results Grid */}
        {visibleSongs.length > 0 && !loading && (
          <>
            <div className="mb-6">
              <p className="text-muted-foreground">
                找到 <span className="text-foreground font-semibold">{results.length}</span> 个结果
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {visibleSongs.map((song) => (
                <div key={song.id} className="group">
                  <div className="bg-card rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300">
                    {/* Album Cover */}
                    <div
                      className="aspect-square relative overflow-hidden cursor-pointer"
                      onClick={() => handlePlaySong(song)}
                    >
                      <img
                        src={`${API_URL}/music_cover/${song.id}.png`}
                        alt={song.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
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
                      <h3 className="font-semibold text-foreground truncate mb-1">{song.name}</h3>
                      <p className="text-sm text-muted-foreground truncate mb-2">
                        {song.artists.map((artist) => artist.name).join(", ")}
                      </p>
                      <p className="text-xs text-muted-foreground truncate mb-3">{song.album.name}</p>

                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          addToPlaylist(song)
                        }}
                        className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-primary/10 hover:bg-primary/20 text-primary rounded-md transition-colors text-sm"
                      >
                        <FiPlus className="w-4 h-4" />
                        添加到播放列表
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Load More Button */}
            {visibleItems < results.length && (
              <div className="mt-12 text-center">
                <button
                  onClick={loadMoreItems}
                  className="px-8 py-3 bg-primary text-primary-foreground rounded-full hover:bg-primary/90 transition-colors shadow-lg"
                >
                  加载更多结果
                </button>
              </div>
            )}
          </>
        )}

        {/* Empty State */}
        {!loading && !error && results.length === 0 && keyword && (
          <div className="flex flex-col items-center justify-center py-16">
            <FiMusic className="w-16 h-16 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">没有找到相关歌曲</p>
          </div>
        )}

        {/* Initial State */}
        {!loading && !error && results.length === 0 && !keyword && (
          <div className="flex flex-col items-center justify-center py-16">
            <FiSearch className="w-16 h-16 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">输入关键词开始搜索</p>
          </div>
        )}
      </div>
    </div>
  )
}
