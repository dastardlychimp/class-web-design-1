const path          = require('path')
const fs            = require('fs')
const pug           = require('pug')
const del           = require('del')
const sass          = require('node-sass')
const validatorHtml = require('html-validator')
const validatorCss  = require('css-validator')
const config        = require('./config')
const glossary      = require('./glossary')

const path_build        = path.join(__dirname, '/build')
const path_build_module = path.join(path_build, config.MODULE)
const path_build_html   = path.join(path_build_module, '/')
const path_build_sass   = path.join(path_build_module, '/css')
const path_page         = path.join(__dirname, '/templates/pages')
const path_sass         = path.join(__dirname, '/sass')

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

// del.sync([`${path_build_module}/*`])
del([`${path_build_module}/*`])
    .then(() => makeDirPromise(path_build_module))
    // makeDirPromise(path_build_module)
    .then(() => makeDirPromise(path_build_sass))
    .then(() => Promise.all([writeHtmlFiles(), writeSassFiles()]))
    .catch(console.log)

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
                    .catch(reject)
            })

            Promise.all(promises).then(resolve)
        })
    })
}

function writeSassFiles() {
    return mapDirPromise(path_sass, (file, resolve, reject) => {
        const path_file = path.join(path_sass, file)
        const path_file_write = path.format({
            dir: path_build_sass,
            name: path.basename(file, '.scss'),
            ext: '.css',
        })
        
        const {css} = sass.renderSync({
            file: path_file,
            outputStyle: 'expanded',
        })

        validateCss(css)

        return writeFilePromise(path_file_write, css)
            .then(resolve)
            .catch(reject)
    })
}

function mapDirPromise(path, cb) {
    return new Promise((resolve, reject) => {
        fs.readdir(path, (err, files) => {
            if (err) throw err

            Promise.all(
                files.map((file) => new Promise((resolve, reject) => cb(file, resolve, reject)))
            )
            .then(resolve)
            .catch(reject)
        })
    })
}

function makeDirPromise(path) {
    return new Promise((resolve, reject) => {
        const exists = fs.existsSync(path)

        if (exists) {
            resolve()
        }
        else {
            fs.mkdir(path, err => {
                if (err) {
                    let data = fs.readdirSync(path_build_module)
                    console.log(data)
                    throw err
                }
                resolve()
            })
        }
    })
}

function validateHtml(html) {
    validatorHtml({
        data: html,
        format: 'json'
    })
        .then((data) => data.messages.length > 0 ? console.error(data) : null)
        .catch(console.log)
}

function validateCss(css) {
    validatorCss({
        text: css,
    }, (err, data) => {
        if (err) throw err
        if (data.errors.length > 0 || data.warnings.length > 0) console.error(data)
    })
}

function writeFilePromise(path, content) {
    return new Promise((resolve, reject) => {
        fs.writeFile(path, content, err => {
            if (err) throw err
            else resolve()
        })
    })
}
