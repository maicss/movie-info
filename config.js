const renameKeyWords = [
  '英语', '中字', '韩语', '日语', 'www.', 'dy2018', '.com', '[', ']', '双字', '电影', '天堂', '国粤', '双语', '中英', '中日', 'BD', 'HD', '高清'
]

const movieSuffixes = [
  '.mkv', '.rmvb', '.rm', '.avi', '.ts', '.mp4'
]

const headers = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/76.0.3809.132 Safari/537.36'
}

module.exports = {
  renameKeyWords,
  movieSuffixes,
  headers,
}