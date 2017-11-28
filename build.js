const path     = require('path')
const fs       = require('fs')
const pug      = require('pug')
const glossary = require('./glossary')

const path_page       = path.join(__dirname, '/templates/pages')
const path_build      = path.join(__dirname, '/build')
const path_build_html = path.join(path_build, '/pages')
const data            = {glossary}

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

        return writeFilePromise(path_file_write, html)
            .catch(e => console.log(e))
        })
    })
    
    function writeFilePromise(path, content) {
        return new Promise((resolve, reject) => {
            fs.writeFile(path, content, err => {
                if (err) reject(err)
                else resolve()
            })
    })
}
