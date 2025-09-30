"use client"

import { useState, useEffect, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { useAudio } from "@/app/providers/audio-provider"
import API_URL from "@/lib/config"
import Link from "next/link"
import { FiMusic, FiPlus, FiHeart } from "react-icons/fi"

interface Artist {
  id: string
  artist: string
}

interface ArtistData {
  artists: Artist[]
}

function SingerPageContent() {
  const searchParams = useSearchParams()
  const singerId = searchParams.get("uid") || "0"
  const name = searchParams.get("name") || ""

  const [data, setData] = useState<ArtistData | null>(null)
  const [visibleItems, setVisibleItems] = useState(60)
  const [isLoading, setIsLoading] = useState(true)

  const { setMusicId, handleNextSong } = useAudio()

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      try {
        const cachedData = localStorage.getItem(`singerPlaylist_${singerId}`)
        if (cachedData) {
          setData(JSON.parse(cachedData))
          setIsLoading(false)
          return
        }

        const res = await fetch(`${API_URL}/api/singer?uid=${singerId}`)
        const responseData = await res.json()
        const convertedData = {
          artists: responseData["歌手"].map((item: any) => ({
            id: item[0],
            artist: item[1] || "Unknown Artist",
          })),
        }
        setData(convertedData)
        localStorage.setItem(`singerPlaylist_${singerId}`, JSON.stringify(convertedData))
      } catch (error) {
        console.error("Error fetching data:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [singerId])

  const loadMoreItems = () => {
    setVisibleItems((prev) => prev + 40)
  }

  const handlePlaySong = (songId: string, songTitle: string) => {
    setMusicId(songId)
    handleNextSong(songId)
  }

  const addToPlaylist = (song: Artist) => {
    const currentPlaylist = JSON.parse(localStorage.getItem("currentPlaylist") || '{"播放列表": []}')
    const exists = currentPlaylist["播放列表"].some((item: any) => item.id === Number(song.id))

    if (!exists) {
      currentPlaylist["播放列表"].push({
        id: Number(song.id),
        title: song.artist,
        artist: name,
      })
      localStorage.setItem("currentPlaylist", JSON.stringify(currentPlaylist))
      alert("已添加到播放列表")
    } else {
      alert("歌曲已在播放列表中")
    }
  }

  const showMore = data && visibleItems < data.artists.length

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">加载中...</p>
      </div>
    )
  }

  // Artist listing page (uid=0)
  if (singerId === "0") {
    return (
      <div className="min-h-screen bg-background pb-32">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-foreground flex items-center gap-3">
              <FiMusic className="w-8 h-8" />
              歌手
            </h1>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {data?.artists.slice(0, visibleItems).map((artist) => (
              <Link
                key={artist.id}
                href={`/discover/singer?uid=${artist.id}&name=${encodeURIComponent(artist.artist)}`}
                className="group"
              >
                <div className="bg-card rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                  <div className="aspect-square relative overflow-hidden">
                    <img
                      src={`${API_URL}/singer/${artist.id}.png`}
                      alt={artist.artist}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                      {artist.artist}
                    </h3>
                    <p className="text-sm text-muted-foreground">歌手</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {showMore && (
            <div className="mt-12 text-center">
              <button
                onClick={loadMoreItems}
                className="px-8 py-3 bg-primary text-primary-foreground rounded-full hover:bg-primary/90 transition-colors shadow-lg"
              >
                加载更多
              </button>
            </div>
          )}

          {!showMore && data && data.artists.length > 60 && (
            <div className="mt-12 text-center">
              <p className="text-muted-foreground">—— 已显示全部内容 ——</p>
            </div>
          )}
        </div>
      </div>
    )
  }

  // Artist detail page (specific artist)
  return (
    <div className="min-h-screen bg-background pb-32">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">{name}</h1>
          <div className="flex items-center gap-2 text-muted-foreground">
            <FiMusic className="w-5 h-5" />
            <span>{data?.artists.length} 首作品</span>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {data?.artists.slice(0, visibleItems).map((song) => (
            <div key={song.id} className="group">
              <div className="bg-card rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300">
                {/* Song Cover */}
                <div
                  className="aspect-square relative overflow-hidden cursor-pointer"
                  onClick={() => handlePlaySong(song.id, song.artist)}
                >
                  <img
                    src={`${API_URL}/music_cover/${song.id}.png`}
                    alt={song.artist}
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
                  <h3 className="font-semibold text-foreground truncate mb-3">{song.artist}</h3>

                  <div className="flex gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        addToPlaylist(song)
                      }}
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
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {showMore && (
          <div className="mt-12 text-center">
            <button
              onClick={loadMoreItems}
              className="px-8 py-3 bg-primary text-primary-foreground rounded-full hover:bg-primary/90 transition-colors shadow-lg"
            >
              加载更多
            </button>
          </div>
        )}

        {!showMore && data && data.artists.length > 60 && (
          <div className="mt-12 text-center">
            <p className="text-muted-foreground">—— 已显示全部内容 ——</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default function SingerPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center">
          <p className="text-muted-foreground">加载中...</p>
        </div>
      }
    >
      <SingerPageContent />
    </Suspense>
  )
}
