"use client"

import { useState, useEffect } from "react"
import API_URL from "@/lib/config"
import Link from "next/link"
import { FiMusic, FiDisc } from "react-icons/fi"

interface PlaylistItem {
  id: string
  title: string
  releaseDate: string
}

interface PlayListsProps {
  pageType: "pl" | "al"
}

export default function PlayLists({ pageType }: PlayListsProps) {
  const [data, setData] = useState<PlaylistItem[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      try {
        const response = await fetch(`${API_URL}/api/playlists?pageType=${pageType}`)
        if (response.ok) {
          const result = await response.json()
          const converted = result.map((item: any) => ({
            id: item[0],
            title: item[1],
            releaseDate: item[2],
          }))
          setData(converted)
        }
      } catch (error) {
        console.error("Error fetching playlists:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [pageType])

  const title = pageType === "pl" ? "发现音乐 - 播放列表" : "专辑"
  const Icon = pageType === "pl" ? FiMusic : FiDisc

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">加载中...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background pb-32">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground flex items-center gap-3">
            <Icon className="w-8 h-8" />
            {title}
          </h1>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {data.map((item) => (
            <Link
              key={item.id}
              href={`/playlist/${item.id}?pageType=${pageType}&pTitle=${encodeURIComponent(item.title)}&pRD=${encodeURIComponent(item.releaseDate)}`}
              className="group"
            >
              <div className="bg-card rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                <div className="aspect-square relative overflow-hidden">
                  <img
                    src={`${API_URL}/music_cover/${item.id}.png`}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">{item.releaseDate}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {data.length === 0 && (
          <div className="text-center py-16">
            <Icon className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">暂无数据</p>
          </div>
        )}
      </div>
    </div>
  )
}
