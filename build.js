const path      = require('path')
const fs        = require('fs')
const pug       = require('pug')
const del       = require('del')
const validator = require('html-validator')
const config    = require('./config')
const glossary  = require('./glossary')

const path_build        = path.join(__dirname, '/build')
const path_build_module = path.join(path_build, config.MODULE)
const path_build_html   = path.join(path_build_module, '/')
const path_page         = path.join(__dirname, '/templates/pages')

const data = {
    base_path: '/' + config.MODULE,
    glossary,
    pages: {
        'index': 'About',
        'exposure': 'Exposure',
        'lighting': 'Lighting',
        'design': 'Design Principles',
        'glossary': 'Glossary'
    }
}

del([`${path_build_module}/**`])
    .then(() => makeDirPromise(path_build_module))
    .then(writeHtmlFiles)

function writeHtmlFiles() {
    return new Promise((resolve, reject) => {
        fs.readdir(path_page, (err, files) => {
            if (err) throw err
    
            const promises = files.map((file) => {
                const path_file = path.join(path_page, file)
                const path_file_write = path.format({
                    dir: path_build_html,
                    name: path.basename(file, '.pug'),
                    ext: '.html'
                })
                const html = pug.renderFile(path_file, data)

                validateHtml(html)
                return writeFilePromise(path_file_write, html)
                    .catch(e => console.log(e))
            })

            Promise.all(promises).then(resolve)
        })
    })
}

function makeDirPromise(path) {
    return new Promise((resolve, reject) => {
        fs.mkdir(path, err => {
            if (err) throw err
            resolve()
        })
    })
}

function validateHtml(html) {
    validator({
        data: html,
        format: 'json'
    })
        .then((data) => data.messages.length > 0 ? console.error(data) : null)
        .catch(console.error)
}

function writeFilePromise(path, content) {
    return new Promise((resolve, reject) => {
        fs.writeFile(path, content, err => {
            if (err) throw err
            else resolve()
        })
    })
}
