const fs = require('fs')
const path = require('path')

const axois = require('axios')
const { movieSuffixes, headers } = require('./config')

const requestResHandler = d => d.data

const request = url => axois.get(url, { headers }).then(requestResHandler)
const download = url => axois({ url, method: 'GET', responseType: 'stream', headers })

const getDirFiles = dir => new Promise((resolve, reject) => fs.readdir(dir, (err, files) => {
  if (err) return reject(err)
  return resolve(files)
}))

const createDir = name => new Promise((resolve, reject) => fs.mkdir(name, err => {
  if (err && err.errno === -4075) {
    // 文件夹已存在
    console.warn(`文件夹 【${name}】 已存在`)
    // todo 三个选项：使用、删除或者直接跳过当前电影
  }
  if (err) return reject(err)
  return resolve()
}))

const rmrf = dir => new Promise((resolve, reject) => {
  fs.stat(dir, (err, stats) => {
    if (err) return reject(err)
    if (stats.isDirectory()) {
      fs.readdir(dir, (err1, files) => {
        if (err1) return reject(err1)
        if (files.length) {
          files.forEach(file => rmrf(path.join(dir,file)))
        } else {
          fs.unlink(dir, err2 => {
            if (err2) return reject(err2)
            return resolve()
          })
        }
      })
    } else {
      return reject(dir + 'is not a directory')
    }
  })
})

const b2Gb = bytes => bytes / Math.pow(1024, 3)

const moveFile = filename => new Promise((resolve, reject) => {
  const { dir, base, name } = path.parse(filename)

  fs.rename(filename, path.join(dir + '/' + name, base), err => {
    if (err) return reject(err)
    fs.stat(path.join(dir + '/' + name, base), (err1, stats) => {
      if (err1) return reject(err1)
      return resolve(b2Gb(stats.size))
    })
  })
})


const isMovie = (name, stat) => {
  const ext = path.parse(name).ext
  return movieSuffixes.includes(ext)
}

const getDefinition = name => {
  if (name.indexOf('1080p') > -1 || name.indexOf('1080P') > -1) {
    return 1080
  } else if (name.indexOf('2160') > -1) {
    return 2160
  } else {
    return 0
  }
}

module.exports = {
  request,
  download,
  getDirFiles,
  createDir,
  isMovie,
  // rmrf,
  moveFile,
  b2Gb,
  getDefinition,
}