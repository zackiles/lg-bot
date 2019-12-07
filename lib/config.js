const yaml = require('yaml')
const fs = require('fs')
const path = require('path')
const base = path.normalize(`${__dirname}/..`)
const config = yaml.parse(fs.readFileSync(`${base}/config.yml`, 'utf8'))
config.base = base

module.exports = config