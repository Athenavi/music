"use client"

import { useState, useEffect } from "react"
import API_URL from "@/lib/config"
import { FiPlus, FiMinus, FiHeart, FiMusic } from "react-icons/fi"
import removeFromPlaylist from "../func/removeFromPlaylist"
import addToPlaylist from "../func/addToPlaylist"

const SingerDetail = () => {
  const [data, setData] = useState(null)
  const [visibleItems, setVisibleItems] = useState(60)
  const [showMore, setShowMore] = useState(true)
  const location = window.location
  const searchParams = new URLSearchParams(location.search)
  const name = searchParams.get("name") || ""
  const singerId = searchParams.get("uid") || "0"

  const fetchData = async (singerId) => {
    try {
      const res = await fetch(API_URL + `/api/singer?uid=` + singerId)
      const responseData = await res.json()
      const convertedData = convertData(responseData)
      setData(convertedData)
      localStorage.setItem("singerPlaylist_" + singerId, JSON.stringify(convertedData))
    } catch (error) {
      console.error("Error fetching data:", error)
    }
  }

  useEffect(() => {
    const cachedData = localStorage.getItem("singerPlaylist_" + singerId)
    if (cachedData) {
      setData(JSON.parse(cachedData))
    } else {
      fetchData(singerId)
    }
  }, [location, singerId])

  const convertData = (data) => {
    return {
      artists: data["歌手"].map((item) => {
        return {
          id: item[0],
          artist: item[1] || "Unknown Artist",
        }
      }),
    }
  }

  const loadMoreItems = () => {
    setVisibleItems((prev) => prev + 40)
  }

  useEffect(() => {
    if (data && data.artists.length <= visibleItems) {
      setShowMore(false)
    } else {
      setShowMore(true)
    }
  }, [visibleItems, data])

  const likeThisSong = (songId) => {
    console.log("Like song with ID:", songId)
  }

  return (
    <div className="singer-detail-container">
      {data ? (
        <>
          <div className="detail-header">
            <h1 className="artist-title">{name}</h1>
            <div className="stats-badge">
              <FiMusic className="icon" />
              <span>{data.artists.length}首作品</span>
            </div>
          </div>

          <div className="grid-container">
            {data.artists.slice(0, visibleItems).map((item) => (
              <div key={item.id} className="grid-item">
                {singerId === "0" ? (
                  <a href={`/discover/singer?uid=${item.id}&name=${item.artist}`} className="artist-card">
                    <div className="image-wrapper">
                      <img src={`${API_URL}/singer/${item.id}.png`} alt={item.artist} className="artist-image" />
                      <div className="hover-overlay" />
                    </div>
                    <h3 className="artist-name">{item.artist}</h3>
                    <p className="artist-type">歌手</p>
                  </a>
                ) : (
                  <div className="song-card">
                    <div className="song-image-wrapper">
                      <img src={`${API_URL}/music_cover/${item.id}.png`} alt={item.artist} className="song-cover" />
                      <div className="song-controls">
                        <button
                          onClick={(e) => {
                            e.preventDefault()
                            addToPlaylist({
                              id: item.id,
                              artist: name,
                              title: item.artist,
                            })
                          }}
                          className="control-button add"
                        >
                          <FiPlus />
                        </button>
                        <a href={`/song?id=${item.id}&name=${item.artist}`} className="play-button">
                          播放
                        </a>
                      </div>
                    </div>
                    <div className="song-info">
                      <a href={`/song?id=${item.id}&name=${item.artist}`} className="song-title">
                        {item.artist}
                      </a>
                      <div className="song-actions">
                        <button onClick={() => removeFromPlaylist(item.id)} className="action-button">
                          <FiMinus />
                        </button>
                        <button onClick={() => likeThisSong(item.id)} className="action-button like">
                          <FiHeart />
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="load-more-container">
            {showMore ? (
              <button onClick={loadMoreItems} className="load-more-button">
                加载更多
              </button>
            ) : (
              <p className="end-hint">—— 已显示全部内容 ——</p>
            )}
          </div>
        </>
      ) : (
        <div className="loading-container">
          <div className="loading-spinner" />
          加载中...
        </div>
      )}
    </div>
  )
}

export default SingerDetail
