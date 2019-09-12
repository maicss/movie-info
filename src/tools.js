const fs = require('fs')
const path = require('path')
const mm = require('mmmagic')
const axois = require('axios')
const magic = new mm.Magic(mm.MAGIC_MIME_TYPE)

const { headers, renameKeyWords } = require('../config')

const requestResHandler = d => d.data

const request = url => axois.get(url, { headers }).then(requestResHandler)
const download = url => axois({ url, method: 'GET', responseType: 'stream', headers })

/**
 * @desc 遍历文件夹下所有文件
 * @param {string} root
 * @param {function} onEachFile
 * @param {function} onAllEnd
 * @param {object} info[]
 * */
const walk = (root, onEachFile, onAllEnd, info) => {
  if (!info) {
    info = { root: root, total: 1, dir: 0, file: 0 }
  }
  fs.stat(root, (err, stats) => {
    if (err) throw err
    if (stats.isDirectory()) {
      fs.readdir(root, (err1, files) => {
        if (err1) throw err1
        files.forEach(name => {
          if (name.indexOf('@') !== 0 && name.indexOf('#') !== 0) {
            info.total++
            walk(path.resolve(root, name), onEachFile, onAllEnd, info)
          }
        })
        info.dir += 1
        if (info.total === info.dir + info.file && onAllEnd) {
          onAllEnd()
        }
      })
    } else {
      if (onEachFile) {
        onEachFile(root, stats)
      }
      info.file += 1
      if (info.total === info.dir + info.file && onAllEnd) {
        onAllEnd(info)
      }
    }
  })
}

/**
 * @desc 获取文件夹里的所有文件
 * @param {string} dir
 * @return {Promise<Array<{fileName: string, path: string, size: number}>>}
 * */
const getDirFiles = dir => new Promise((resolve, reject) => {
  const res = []
  walk(dir, (name, stat) => {
    if (isMovie(name)) res.push({
      fileName: path.parse(name).base,
      path: name,
      size: b2Gb(stat.size).toFixed(2) * 1,
      // definition: getDefinition(name)
    })
  }, () => resolve(res))
})

const createDir = name => new Promise((resolve, reject) => fs.mkdir(name, err => {
  if (err && err.errno === -4075) {
    // 文件夹已存在
    console.warn(`文件夹 【${name}】 已存在`)
    // todo 三个选项：使用、删除或者直接跳过当前电影
  }
  if (err) return reject(err)
  return resolve()
}))

/**
 * @param {string} fileName
 * @return {Promise<string>}
 * */
const rename = (fileName) => new Promise((resolve, reject) => {
  let {dir, base:newName} = path.parse(fileName)
  for (let str of renameKeyWords) {
    if (newName.includes(str)) {
      newName = newName.replace(str, '')
    }
  }
  const {name,ext} = path.parse(newName)
  newName = name.replace(/\./g, '') + ext
  fs.rename(fileName, path.resolve(dir, newName), (err => {
    if (err) return reject(err)
    resolve(path.resolve(dir, newName))
  }))
})

/**
 * @desc rm -rf
 * @param {string} dir
 * */
const rmrf = dir => new Promise((resolve, reject) => {
  fs.stat(dir, (err, stats) => {
    if (err) return reject(err)
    if (stats.isDirectory()) {
      fs.readdir(dir, (err1, files) => {
        if (err1) return reject(err1)
        if (files.length) {
          files.forEach(file => rmrf(path.join(dir, file)))
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

/**
 * @desc 文件是不是已经处理过了
 * @param {string} filePath - 电影路径，带后缀的
 * @return {Promise<boolean>}
 * */
const handledMovie = filePath => new Promise((resolve, reject) => {
  const { dir, name } = path.parse(filePath)
  let hasThumbnails = false
  let hasInfo = false
  let hasBG = false
  let count = 0
  fs.readdir(dir, {withFileTypes: true}, ((err, files) => {
    if (err) return reject(err)
    for (let file of files) {
      if (file.isFile()) {
        count ++
        magic.detectFile(path.join(dir, file.name), (err1, res) => {
          count --
          if (err1) {
            reject(err1)
          }
          if (res.startsWith('image') && path.parse(file.name).name === name) {
            // 有同名的图片
            hasThumbnails = true
          }
          if (file.name === 'info.json') hasInfo = true
          if (count === 0) {
            resolve(hasInfo && hasThumbnails)
          }
        })
      }
    }
  }))
})

/**
 * @desc byte to Gb
 * @param {number} byte
 * @return {number}
 * */
const b2Gb = byte => byte / Math.pow(1024, 3)

const moveFile = filename => new Promise((resolve, reject) => {
  const { dir, base, name } = path.parse(filename)

  fs.rename(filename, path.join(dir + '/' + name, base), err => {
    if (err) return reject(err)
    return resolve()
  })
})

const isMovie = (filePath, cb) => {
  magic.detectFile(filePath, (err, res) => {
    if (err) cb(err)
    cb(null, res.startsWith('video'))
  })
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
  handledMovie,
  rename,
  moveFile,
  b2Gb,
  getDefinition,
}