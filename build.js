const path          = require('path')
const fs            = require('fs')
const pug           = require('pug')
const del           = require('del')
const sass          = require('node-sass')
const browserify    = require('browserify')
const babelify      = require('babelify')
const validatorHtml = require('html-validator')
const validatorCss  = require('css-validator')
const config        = require('./config')
const data          = require('./data')

const path_build        = path.join(__dirname, '/build')
const path_build_module = path.join(path_build, config.MODULE)
const path_build_html   = path.join(path_build_module, '/')
const path_build_scripts = path.join(path_build_module, '/scripts')
const path_build_sass   = path.join(path_build_module, '/css')
const path_build_images = path.join(path_build_module, '/images')
const path_build_media  = path.join(path_build_module, '/media')

const path_templates    = path.join(__dirname, '/templates')
const path_page         = path.join(path_templates, '/pages')
const path_sass         = path.join(__dirname, '/sass')
const path_scripts      = path.join(__dirname, '/scripts')
const path_images       = path.join(__dirname, '/images')
const path_media        = path.join(__dirname, '/media')
const path_template_funcs = path.join(path_templates, '/functions', '/compiled')

data.base_path = '/' + config.MODULE

const buildDirectories = () => Promise.all([
    path_build_module,
    path_build_sass,
    path_build_scripts,
    path_build_images,
    path_build_media,
].map(p => makeDirPromise(p)))

const writeFiles = () => Promise.all([
    writeHtmlFiles(),
    writeSassFiles(),
    writeScriptFiles(),
    writeImageFiles(),
    writeMediaFiles(),
])

const start = Date.now()
del([`${path_build_module}/*`])
    .then(buildDirectories)
    .then(writeFiles)
    .then(() => console.log(`========== BUILD FINISHED =========`))
    .then(() => console.log(`${Date.now() - start}ms`))
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
            })

            Promise.all(promises).then(resolve).catch(reject)
        })
    })
}

function writeSassFiles() {
    return transformFiles(path_sass, path_build_sass, '.css', (file_path) => {
        const { css } = sass.renderSync({
            file: file_path,
            outputStyle: 'expanded',
        })

        validateCss(css)

        return Promise.resolve(css)
    })
}

function writeScriptFiles() {
    return new Promise((resolve, reject) => {
        const path_write = path.join(path_build_module, '/scripts/index.js')
        fs.readdir(path_scripts, (err, data) => {
            if (err) throw err

            const scripts = data.map(f => path.join(path_scripts, f))
            const template_functions = fs.readdirSync(path_template_funcs).map(f => path.join(path_template_funcs, f))
            const opts = process.env.NODE_ENV === 'production'
                ? {}
                : {debug: true}

            browserify(scripts, opts)
                .transform(babelify)
                .add(template_functions, {standalone: 'templates'})
                .bundle()
                .on('error', reject)
                .pipe(fs.createWriteStream(path_write).on('finish', resolve))
        })
    })
}

function writeImageFiles() {
    return transformFiles(path_images, path_build_images, null, readFilePromise)
}

function writeMediaFiles() {
    return transformFiles(path_media, path_build_media, null, readFilePromise)
}

// function compileTemplateFunctions() {
//     const path_funcs = path.join(path_templates, '/functions')
//     const path_compiled = path.join(path_funcs, '/compiled')

//     mapDirPromise(path_funcs, (file, resolve, reject) => {
//         const path_file = path.join(path_funcs, file)
//         const path_write = path.format({
//             dir: path_compiled,
//             name: path.basename(file, '.pug'),
//             ext: '.js'
//         })
//         const compiledFunction = pug.compileFileClient(path_file)

//         writeFilePromise(path_write, compiledFunction)
//             .then(resolve)
//             .catch(reject)
//     })
// }

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

function transformFiles(dir_path, build_path, ext, cb) {
    return mapDirPromise(dir_path, (resolve, reject, file, file_path) => {
        cb(file_path, file)
            .then((data) => {
                const file_ext = path.extname(file)
                const file_write = path.format({
                    dir: build_path,
                    name: path.basename(file, file_ext),
                    ext: ext ? ext : file_ext
                })

                return writeFilePromise(file_write, data)
            })
            .then(resolve)
            .catch(reject)
    })
}

function mapDirPromise(dir_path, cb) {
    return new Promise((resolve, reject) => {
        fs.readdir(dir_path, (err, data) => {
            if (err) throw err
            const files = data
                .map((file) => ({
                    name: file,
                    full_path: path.join(dir_path, file)
                }))
                .filter((file) => fs.lstatSync(file.full_path).isFile())

            const promises = files.map((file) => {
                new Promise((resolve, reject) => cb(
                    resolve,
                    reject,
                    file.name,
                    file.full_path
                )).catch(reject)
            })

            Promise.all(promises)
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
                    throw err
                }
                resolve()
            })
        }
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

function readFilePromise(path) {
    return new Promise((resolve, reject) => {
        fs.readFile(path, (err, data) => {
            err ? reject(err) : resolve(data)
        })
    })
}