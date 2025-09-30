"use client"

import { useState, useEffect, Suspense } from "react"
import { useParams, useSearchParams } from "next/navigation"
import { useAudio } from "@/app/providers/audio-provider"
import API_URL from "@/lib/config"
import { FiPlay, FiClock } from "react-icons/fi"

interface Song {
  id: string | number
  title: string
  artist: string
}

interface PlaylistData {
  歌曲列表: Song[]
}

function PlaylistDetailContent() {
  const params = useParams()
  const searchParams = useSearchParams()
  const { setMusicId, handleNextSong } = useAudio()

  const playlistId = params.id as string
  const pType = searchParams.get("pageType") || "pl"
  const pTitle = searchParams.get("pTitle") || ""
  const pRD = searchParams.get("pRD") || ""

  const [data, setData] = useState<PlaylistData | null>(null)
  const [visibleItems, setVisibleItems] = useState(60)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      try {
        const cachedData = localStorage.getItem(`viewPlaylist_${playlistId}${pType}`)
        if (cachedData) {
          setData(JSON.parse(cachedData))
          setIsLoading(false)
          return
        }

        const res = await fetch(`${API_URL}/api/Detail?pid=${playlistId}&pageType=${pType}`)
        const responseData = await res.json()
        const convertedData = {
          歌曲列表: responseData["歌曲列表"].map((item: any) => ({
            id: item[0],
            title: item[1] || "Unknown Title",
            artist: item[2] || "Unknown Artist",
          })),
        }
        setData(convertedData)
        localStorage.setItem(`viewPlaylist_${playlistId}${pType}`, JSON.stringify(convertedData))
      } catch (error) {
        console.error("Error fetching data:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [playlistId, pType])

  const handlePlaySong = (songId: string | number) => {
    setMusicId(songId.toString())
    handleNextSong(songId.toString())
  }

  const loadMoreItems = () => {
    setVisibleItems((prev) => prev + 40)
  }

  const pageTitle = pType === "al" ? `专辑 ${pTitle}` : `歌单 ${pTitle}`
  const showMore = data && visibleItems < data.歌曲列表.length

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">加载中...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background pb-32">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Playlist Header */}
        <div className="flex flex-col md:flex-row gap-8 mb-12">
          <div className="flex-shrink-0">
            <img
              src={`${API_URL}/music_cover/${playlistId}.png`}
              alt={pTitle}
              className="w-64 h-64 rounded-lg shadow-2xl object-cover"
            />
          </div>

          <div className="flex flex-col justify-center space-y-4">
            <div>
              <p className="text-sm text-muted-foreground mb-2">{pType === "al" ? "专辑" : "歌单"}</p>
              <h1 className="text-4xl font-bold text-foreground mb-2">{pTitle}</h1>
              {pRD && <p className="text-muted-foreground">{pRD}</p>}
            </div>

            {data && (
              <div className="flex items-center gap-6 text-sm text-muted-foreground">
                <span>{data.歌曲列表.length} 首歌曲</span>
              </div>
            )}
          </div>
        </div>

        {/* Song List */}
        {data && (
          <div className="bg-card rounded-lg shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-border">
                  <tr className="text-left text-sm text-muted-foreground">
                    <th className="p-4 w-12">#</th>
                    <th className="p-4">标题</th>
                    <th className="p-4">艺术家</th>
                    <th className="p-4 w-12">
                      <FiClock />
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {data.歌曲列表.slice(0, visibleItems).map((item, index) => (
                    <tr
                      key={item.id}
                      className="border-b border-border hover:bg-muted/50 transition-colors cursor-pointer group"
                      onClick={() => handlePlaySong(item.id)}
                    >
                      <td className="p-4">
                        <div className="flex items-center justify-center">
                          <span className="group-hover:hidden">{index + 1}</span>
                          <FiPlay className="hidden group-hover:block text-primary" />
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={`${API_URL}/music_cover/${item.id}.png`}
                            alt={item.title}
                            className="w-10 h-10 rounded object-cover"
                          />
                          <span className="font-medium text-foreground">{item.title}</span>
                        </div>
                      </td>
                      <td className="p-4 text-muted-foreground">{item.artist}</td>
                      <td className="p-4">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handlePlaySong(item.id)
                          }}
                          className="text-muted-foreground hover:text-primary transition-colors"
                        >
                          <FiPlay />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {showMore && (
              <div className="p-6 text-center border-t border-border">
                <button
                  onClick={loadMoreItems}
                  className="px-6 py-2 bg-primary text-primary-foreground rounded-full hover:bg-primary/90 transition-colors"
                >
                  查看更多
                </button>
              </div>
            )}

            {!showMore && data.歌曲列表.length > 60 && (
              <div className="p-6 text-center border-t border-border">
                <p className="text-muted-foreground">已经到底了呢</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default function PlaylistDetailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center">
          <p className="text-muted-foreground">加载中...</p>
        </div>
      }
    >
      <PlaylistDetailContent />
    </Suspense>
  )
}
