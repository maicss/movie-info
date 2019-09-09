const fsPromise = require('fs').promises
const path = require('path')

const axois = require('axios')
const { movieSuffixes, headers } = require('./config')

const requestResHandler = d => d.data

const request = url => axois.get(url, { headers }).then(requestResHandler)
const download = url => axois({ url, method: 'GET', responseType: 'stream', headers })

const getDirFiles = dir => fsPromise.readdir(path.join(dir))

const createDir = name => fsPromise.mkdir(path.join(name))

const rmrf = dir => fsPromise.stat(path.join(dir)).then(stats =>
  fsPromise.readdir(path.join(dir))
    .then(files => Promise.all(files.map(file => fsPromise.stat(path.join(dir, file)).then(stats1 => {
      if (stats1.isDirectory()) {
        return rmrf(path.join(dir, file))
      } else {
        return fsPromise.unlink(path.join(dir, file))
      }
    }))).then(() => fsPromise.rmdir(path.join(dir))))
).catch(e => Promise.resolve())

const moveFile = filename => {
  const { dir, base, name } = path.parse(filename)
  return fsPromise.rename(filename, path.join(dir + '/' + name, base))
}

const b2Gb = bytes => bytes / Math.pow(1024, 3)

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
  rmrf,
  moveFile,
  b2Gb,
  getDefinition,
}