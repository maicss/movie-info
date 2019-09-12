const path = require('path')

const { getDirFiles, createDir, moveFile, handledMovie, rename } = require('./src/tools')
const { searchInfo, infoGetter, downloadPhotos, saveInfo } = require('./src/info-getter')
const cli = require('./src/cli')

async function main () {
  const { argv } = process
  let [nodePath, scriptPath, moviesDir, ...options] = argv
  if (options.includes('--renew')) {

  }
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
    const fileInfoList = await getDirFiles(moviesDir)
    if (fileInfoList.length) {
      for (let fileInfoListElement of fileInfoList) {
        const handled = await handledMovie(fileInfoListElement.path)
        if (handled) {
          console.info(fileInfoListElement.fileName, 'handled.')
        } else {
          const newFileName = await rename(fileInfoListElement.path)
          const { name, ext, dir } = path.parse(newFileName)
          if (!dir.includes(name)) {
            await createDir(path.resolve(dir, name))
            await moveFile(newFileName)
          }
          let fileInfo = {
            name: newFileName,
            size: fileInfoListElement.size,
            path: path.join(moviesDir, name)
          }
          const searchResult = await searchInfo(name)
          if (searchResult.length) {
            // todo 如果检索结果只有一个，直接写入，不选择，但是要获取到年份比较合适
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
              if (_info.episode) {
                fileInfo.type = 'series'
                fileInfo.episode = _info.episode
              } else {
                fileInfo.type = 'movie'
              }
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
        }

      }
    }
  } catch (e) {
    console.error('\x1b[41m%s\x1b[0m', '[main]')
    console.error(e)
  }
}

main().catch(e => console.error(e))