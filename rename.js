const fs = require('fs')
const path = require('path')
const { renameKeyWords } = require('./config')

/**
 * @param {string} fileName
 * @return {Promise}
 * */
const rename = (fileName, moviesDir) => new Promise((resolve, reject) => {
  let newName = fileName
  for (let str of renameKeyWords) {
    if (newName.includes(str)) {
      newName = newName.replace(str, '')
    }
  }
  const _parse = path.parse(newName)
  newName = _parse.name.replace(/\./g, '') + _parse.ext
  if (path.parse(newName).name) {

  }
  fs.rename(path.join(moviesDir, fileName), path.join(moviesDir, newName), (err => {
    if (err) return reject(err)
    return resolve(newName)
  }))
})

module.exports = rename