const fs = require('fs')
const path = require('path')
const { isMovie, b2Gb, getDefinition } = require('./tools')

const res = []

const walk = (root, onEachFile, onAllEnd, info) => {
  if (!info) {
    info = { root: root, total: 1, dir: 0, file: 0 }
  }
  fs.stat(root, ((err, stats) => {
    if (err) throw err
    if (stats.isDirectory()) {
      fs.readdir(root, ((err1, files) => {
        if (err1) throw err1
        files.forEach((name) => {
          if (name.indexOf('@') !== 0 && name.indexOf('#') !== 0) {
            info.total++
            walk(path.resolve(root, name), onEachFile, onAllEnd, info)
          }
        })
        info.dir += 1
        if (info.total === info.dir + info.file && onAllEnd) {
          onAllEnd()
        }
      }))
    } else {
      if (onEachFile) {
        onEachFile(root, stats)
      }
      info.file += 1
      if (info.total === info.dir + info.file && onAllEnd) {
        onAllEnd(info)
      }
    }
  }))
}

walk('./movies', (name, stat) => {
  if (isMovie(name)) res.push({
    fileName: path.parse(name).base,
    path: name,
    size: b2Gb(stat.size).toFixed(2) * 1,
    definition: getDefinition(name)
  })
}, function () {
  console.log(res)
  console.log('done')
})



