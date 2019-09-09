const fs = require('fs')
const path = require('path')
const cheerio = require('cheerio')
const { request, download } = require('./tools')
const { headers } = require('./config')

const infoKeyMap = {
  // 这些先不要
  // '导演': 'director',
  // '编剧': 'scriptwriter',
  // '主演': 'cast',
  '类型': 'type',
  'IMDb链接': 'IMDbID',
  '片长': 'duration',
  douBanScore: 0,
  IMDbScore: 0,
}

// https://movie.douban.com/subject/26709258/photos?type=R

const htmlParser = html => {
  const res = {}
  html.split('<br>').map(d => d.replace(/\n/g, '')).map(d => cheerio.load(d).text()).filter(a => a).forEach(d => {
    const key = d.split(':')[0].trim()
    if (infoKeyMap[key] !== undefined) res[infoKeyMap[key]] = d.split(':')[1].trim()
  })
  return res
}

// 先找电影，获得基本信息
// 再去详情页面下载详细信息

/**
 * @param name {string}
 * @return Promise<Array.<object>>*/
const searchInfo = name => request('https://movie.douban.com/j/subject_suggest?q=' + encodeURIComponent(name), { headers })

const infoGetter = id => request(`https://movie.douban.com/subject/${id}/?from=showing`, { headers }).then(html => {
  const $ = cheerio.load(html)
  const infoDOM = $('#info').html()
  const jsonStr = $('script[type="application/ld+json"]').html()
  let json
  try {
    json = JSON.parse(jsonStr.replace(/[\r\n]/g, ''))
  } catch (e) {
    return Promise.reject('JSON Parse: ' + jsonStr)
  }

  const res = Object.assign({ summary: $('span[property="v:summary"]').text().replace(/\n +/g, '').replace('。　　', '\n   ') }, json, htmlParser(infoDOM))
  delete res.genre
  delete res.description
  res.douBanScore = res.aggregateRating.ratingValue
  delete res.aggregateRating
  delete res['@context']
  delete res['@type']
  delete res['image']
  delete res['name']
  res.director = res.director.map(a => {
    delete a['@type']
    return a
  })
  res.author = res.director.map(a => {
    delete a['@type']
    return a
  })
  res.actor = res.director.map(a => {
    delete a['@type']
    return a
  })
  return res
})

const bgImageGetter = id => request(`https://movie.douban.com/subject/${id}/photos?type=R`).then(html => {
  const $ = cheerio.load(html)
  return $('#content ul li .cover a').first().attr('href').match(/\d/)
})

const downloadPhotos = info => download(info.thumbnail).then(res => res.data.pipe(fs.createWriteStream(path.join(info.path, path.parse(info.name).name + path.parse(info.thumbnail).ext))))

const saveInfo = info => new Promise((resolve, reject) => {
  fs.writeFile(path.join(info.path, path.parse(info.name).name + '.json'), JSON.stringify(info), err => {
    if (err) return reject(err)
    return resolve()
  })
})

module.exports = {
  searchInfo,
  infoGetter,
  bgImageGetter,
  downloadPhotos,
  saveInfo,
}

