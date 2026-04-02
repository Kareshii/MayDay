import maydayData from '~/assets/data/mayday-data.json'

export const useMaydayData = () => {
  const songs = computed(() => maydayData.songs)
  const albums = computed(() => maydayData.albums)
  const concerts = computed(() => maydayData.concerts)
  const members = computed(() => maydayData.members)
  const lyrics = computed(() => maydayData.lyrics)
  const countdowns = computed(() => maydayData.countdowns)
  const fanCreations = computed(() => maydayData.fanCreations)
  const quizQuestions = computed(() => maydayData.quizQuestions)
  const messages = computed(() => maydayData.messages)

  // 获取按年代分组的歌曲
  const songsByYear = computed(() => {
    const grouped: Record<number, typeof songs.value> = {}
    songs.value?.forEach(song => {
      if (!grouped[song.year]) {
        grouped[song.year] = []
      }
      grouped[song.year]!.push(song)
    })
    return grouped
  })

  // 获取热门歌曲（按投票数排序）
  const topSongs = computed(() => {
    return [...songs.value].sort((a, b) => b.votes - a.votes).slice(0, 10)
  })

  // 获取精选歌词
  const featuredLyrics = computed(() => {
    return lyrics.value.filter(lyric => lyric.featured)
  })

  // 搜索歌词
  const searchLyrics = (query: string) => {
    if (!query) return lyrics.value
    const lowerQuery = query.toLowerCase()
    return lyrics.value.filter(lyric => 
      lyric.song.toLowerCase().includes(lowerQuery) ||
      lyric.content.toLowerCase().includes(lowerQuery)
    )
  }

  // 按情绪筛选留言
  const getMessagesByMood = (mood?: string) => {
    if (!mood) return messages.value
    return messages.value.filter(msg => msg.mood === mood)
  }

  // 获取专辑详情
  const getAlbumById = (id: number) => {
    return albums.value.find(album => album.id === id)
  }

  // 获取成员详情
  const getMemberById = (id: number) => {
    return members.value.find(member => member.id === id)
  }

  // 按类型筛选粉丝创作
  const getCreationsByType = (type?: string) => {
    if (!type) return fanCreations.value
    return fanCreations.value.filter(creation => creation.type === type)
  }

  // 获取活跃倒计时
  const activeCountdowns = computed(() => {
    const now = new Date()
    return countdowns.value.filter(countdown => {
      const targetDate = new Date(countdown.date)
      return targetDate > now
    }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  })

  return {
    // 原始数据
    songs,
    albums,
    concerts,
    members,
    lyrics,
    countdowns,
    fanCreations,
    quizQuestions,
    messages,
    
    // 计算属性
    songsByYear,
    topSongs,
    featuredLyrics,
    activeCountdowns,
    
    // 工具方法
    searchLyrics,
    getMessagesByMood,
    getAlbumById,
    getMemberById,
    getCreationsByType,
  }
}
