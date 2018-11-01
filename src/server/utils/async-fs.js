
const fs = require('fs')
const path = require('path')

async function mkdir (path, options) {
  return new Promise((resolve, reject) => {
    fs.mkdir(path, options, err => {
      if (err) {
        reject(err)
      } else {
        resolve()
      }
    })
  })
}

function writeFile (path, data) {
  return new Promise((resolve, reject) => {
    fs.writeFile(path, data, err => {
      if (err) {
        reject(err)
      } else {
        resolve()
      }
    })
  })
}

function stat (path) {
  return new Promise((resolve, reject) => {
    fs.stat(path, (err, stats) => {
      if (err) {
        resolve(null)
      } else {
        resolve(stats)
      }
    })
  })
}

function access (path, mode) {
  return new Promise((resolve, reject) => {
    fs.access(path, mode, (err) => {
      if (err) {
        resolve(false)
      } else {
        resolve(true)
      }
    })
  })
}

function rename (oldPath, newPath) {
  return new Promise((resolve, reject) => {
    fs.rename(oldPath, newPath, async err => {
      if (err) {
        reject(err)
      } else {
        resolve()
      }
    })
  })
}

async function forceMove(oldPath, newPath) {
  await makeSureFileDir(newPath)
  try {
    await rename(oldPath, newPath)
  } catch (e) {
    await copy(oldPath, newPath)
    unlink(oldPath)
  }
}

function copy (src, dest) {
  return new Promise((resolve, reject) => {
    const ws = fs.createWriteStream(dest)
    ws.on('error', err => reject(err))
    ws.on('close', () => resolve())

    if (typeof src === 'string') {
      src = [src]
    }

    for (const p of src) {
      const is = fs.createReadStream(p)
      is.pipe(ws)
      is.on('error', err => reject(err))
    }
  })
}

function unlink (path) {
  return new Promise((resolve, reject) => {
    fs.unlink(path, (err) => {
      if (err) {
        reject(err)
      } else {
        resolve()
      }
    })
  })
}

async function makeSureDir(dir) {
  const exists = await access(dir)
  if (!exists) {
    await mkdir(dir, {recursive: true})
  }
}

function makeSureFileDir(fullpath) {
  return makeSureDir(path.dirname(fullpath))
}

module.exports = {
  access,
  stat,
  mkdir,
  writeFile,
  rename,
  forceMove,
  copy,
  unlink,
  makeSureDir,
  makeSureFileDir
}
