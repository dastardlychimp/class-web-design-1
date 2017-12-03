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
const glossary      = require('./glossary')

const path_build        = path.join(__dirname, '/build')
const path_build_module = path.join(path_build, config.MODULE)
const path_build_html   = path.join(path_build_module, '/')
const path_build_scripts = path.join(path_build_module, '/scripts')
const path_build_sass   = path.join(path_build_module, '/css')
const path_templates    = path.join(__dirname, '/templates')
const path_page         = path.join(path_templates, '/pages')
const path_sass         = path.join(__dirname, '/sass')
const path_scripts      = path.join(__dirname, '/scripts')
const path_template_funcs = path.join(path_templates, '/functions', '/compiled')

const data = {
    base_path: '/' + config.MODULE,
    glossary,
    pages: {
        'index': 'About',
        'exposure': 'Exposure',
        'design': 'Design Principles',
        'glossary': 'Glossary'
    }
}

const start = Date.now()
del([`${path_build_module}/*`])
    .then(() => Promise.all([makeDirPromise(path_build_module), makeDirPromise(path_build_sass), makeDirPromise(path_build_scripts)]))
    .then(() => Promise.all([writeHtmlFiles(), writeSassFiles(), writeScriptFiles()]))
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

function mapDirPromise(dir_path, cb) {
    return new Promise((resolve, reject) => {
        fs.readdir(dir_path, (err, data) => {
            if (err) throw err
            const files = data.filter((file) => {
                const full_path = path.join(dir_path, file)
                return fs.lstatSync(full_path).isFile()
            })

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
