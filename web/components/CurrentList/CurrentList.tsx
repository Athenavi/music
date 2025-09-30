"use client"

import React, { useState, useEffect, useCallback, useMemo } from "react"
import API_URL from "@/lib/config"
import { MdDragIndicator, MdClose, MdEdit, MdCheck } from "react-icons/md"

interface Song {
  id: number
  title: string
  artist: string
}

interface PlaylistData {
  播放列表: Song[]
}

interface CurrentListProps {
  pid: string
  setMusicId: (id: string) => void
  handleNextSong: (id: string) => void
  toggleVisable?: () => void
}

interface DragResult {
  destination?: {
    index: number
  }
  source: {
    index: number
  }
}

const CurrentList: React.FC<CurrentListProps> = React.memo(({ pid, setMusicId, handleNextSong }) => {
  const [data, setData] = useState<PlaylistData | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const convertData = useCallback(
    (apiData: any): PlaylistData => ({
      播放列表: apiData["播放列表"].map(([id, title, artist]: [number, string, string]) => ({
        id,
        title: title || "Unknown Title",
        artist: artist || "Unknown Artist",
      })),
    }),
    [],
  )

  const fetchData = useCallback(async () => {
    if (isLoading) return

    setIsLoading(true)
    setError(null)
    try {
      const res = await fetch(`${API_URL}/api/userSongList?pid=${pid}`)
      if (!res.ok) throw new Error("Network response was not ok")

      const responseData = await res.json()
      const convertedData = convertData(responseData)
      setData(convertedData)
      localStorage.setItem("currentPlaylist", JSON.stringify(convertedData))
    } catch (error) {
      console.error("Error fetching data:", error)
      setError("无法连接到服务器，使用本地缓存数据")
    } finally {
      setIsLoading(false)
    }
  }, [pid, convertData, isLoading])

  useEffect(() => {
    const cachedData = localStorage.getItem("currentPlaylist")
    if (cachedData) {
      try {
        setData(JSON.parse(cachedData))
      } catch (error) {
        console.error("Error parsing cached data:", error)
        fetchData()
      }
    } else {
      fetchData()
    }
  }, [fetchData])

  const handleRemove = useCallback((id: number) => {
    setData((prev) => {
      if (!prev) return prev

      const updated = {
        ...prev,
        播放列表: prev.播放列表.filter((item) => item.id !== id),
      }
      localStorage.setItem("currentPlaylist", JSON.stringify(updated))
      return updated
    })
  }, [])

  const handleDragEnd = useCallback(
    (result: DragResult) => {
      if (!result.destination || !isEditing || !data) return

      const items = [...data.播放列表]
      const [reorderedItem] = items.splice(result.source.index, 1)
      items.splice(result.destination.index, 0, reorderedItem)

      const newData = { ...data, 播放列表: items }
      setData(newData)
      localStorage.setItem("currentPlaylist", JSON.stringify(newData))
    },
    [isEditing, data],
  )

  const handleSongClick = useCallback(
    (e: React.MouseEvent, id: number, isEditing: boolean) => {
      if (isEditing) {
        e.preventDefault()
        return
      }
      setMusicId(id.toString())
      handleNextSong(id.toString())
    },
    [setMusicId, handleNextSong],
  )

  const songList = useMemo(() => {
    if (!data) return null

    return (
      <div onDragEnd={handleDragEnd}>
        <ul className="space-y-2">
          {data.播放列表.map((item, index) => (
            <li
              key={`${item.id}-${index}`}
              className={`group flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors ${
                isEditing ? "cursor-move" : "cursor-pointer"
              }`}
              draggable={isEditing}
              onDragStart={(e) => {
                if (!isEditing) return
                e.dataTransfer.setData("text/plain", index.toString())
              }}
              onDragOver={(e) => {
                if (!isEditing) return
                e.preventDefault()
              }}
              onDrop={(e) => {
                if (!isEditing) return
                e.preventDefault()
                const fromIndex = Number.parseInt(e.dataTransfer.getData("text/plain"))
                const toIndex = index
                if (fromIndex === toIndex) return

                handleDragEnd({
                  source: { index: fromIndex },
                  destination: { index: toIndex },
                })
              }}
            >
              {isEditing && (
                <div className="text-muted-foreground">
                  <MdDragIndicator size={20} />
                </div>
              )}

              <img
                src={`${API_URL}/music_cover/${item.id}.png`}
                alt={item.title}
                className="w-12 h-12 rounded object-cover"
              />

              <div onClick={(e) => handleSongClick(e, item.id, isEditing)} className="flex-1 min-w-0">
                <h3 className="font-medium text-foreground truncate">{item.title}</h3>
                <p className="text-sm text-muted-foreground truncate">{item.artist}</p>
              </div>

              {isEditing && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleRemove(item.id)
                  }}
                  className="text-destructive hover:text-destructive/80 transition-colors"
                  aria-label="删除歌曲"
                >
                  <MdClose size={18} />
                </button>
              )}
            </li>
          ))}
        </ul>
      </div>
    )
  }, [data, isEditing, handleDragEnd, handleSongClick, handleRemove])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: "var(--color-border)" }}>
        <h2 className="text-lg font-semibold">播放列表</h2>
        <button
          onClick={() => setIsEditing(!isEditing)}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-md transition-colors ${
            isEditing ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/80"
          }`}
          title={isEditing ? "完成编辑" : "编辑列表"}
          aria-label={isEditing ? "完成编辑" : "编辑列表"}
        >
          {isEditing ? <MdCheck size={18} /> : <MdEdit size={16} />}
          <span className="text-sm">{isEditing ? "完成" : "编辑"}</span>
        </button>
      </div>

      {error && <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">{error}</div>}

      {isEditing && <p className="text-xs text-muted-foreground">拖动歌曲以重新排序</p>}

      {isLoading ? (
        <p className="text-center text-muted-foreground py-8">加载中...</p>
      ) : data ? (
        songList
      ) : (
        <p className="text-center text-muted-foreground py-8">暂无数据</p>
      )}
    </div>
  )
})

CurrentList.displayName = "CurrentList"

export default CurrentList
