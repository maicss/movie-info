const path = require('path')

const rename = require('./rename')
const { getDirFiles, createDir, isMovie, moveFile } = require('./tools')
const { searchInfo, infoGetter, downloadPhotos, saveInfo } = require('./info-getter')
const cli = require('./cli')

async function main () {
  const { argv } = process
  let moviesDir = ''
  if (argv[2]) {
    if (path.isAbsolute(argv[2])) {
      moviesDir = argv[2]
    } else {
      moviesDir = path.resolve(process.cwd(), argv[2])
    }
  } else {
    return console.error('请输入路径')
  }
  try {
    const files = await getDirFiles(moviesDir)
    if (files.length) {
      for (let file of files) {
        if (isMovie(file)) {
          const newFileName = await rename(file, moviesDir)
          console.log(newFileName)
          const { name, ext } = path.parse(newFileName)
          await createDir(path.join(moviesDir, name))
          const size = await moveFile(path.join(moviesDir, newFileName))
          let fileInfo = {
            name: newFileName,
            size,
            path: path.join(moviesDir, name)
          }
          const searchResult = await searchInfo(name)
          if (searchResult.length) {
            // 做一个没找到想要结果的占位符
            const cliChoices = searchResult.map(s => ({
              name: `${s.title} (${s.year})`,
              value: s.id
            }))
            cliChoices.push({ name: '没有匹配项，跳过', value: '' })
            const id = await cli(name, cliChoices)
            const _info = searchResult.filter(s => s.id === id)[0]
            if (_info) {
              fileInfo.douBanID = id
              fileInfo.thumbnail = _info.img
              fileInfo.year = _info.year
              const details = await infoGetter(id)
              fileInfo = Object.assign(fileInfo, details)
              await downloadPhotos(fileInfo)
              await saveInfo(fileInfo)
              // console.log()
            } else {
              console.log('跳过' + name)
            }
            console.log('-'.repeat(process.stdout.columns))

          } else {
            console.warn(`${name} 豆瓣检索结果为空`)
          }
        } else {
          console.log(`【${file}】 不是电影`)
        }
      }
    }
  } catch (e) {
    console.error('\x1b[41m%s\x1b[0m', '[main]: ' + e)
  }
}

main().catch(e => console.error(e))