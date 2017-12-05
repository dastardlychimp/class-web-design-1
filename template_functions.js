const fs = require('fs')
const path = require('path')
const pug = require('pug')
const config = require('./config')

const compiledPath = './templates/functions/compiled';

const templates = {
    'term': `a.term(href=\`/${config.MODULE}/glossary.html#\$\{key\}\`)= term`
}

Object.keys(templates).forEach((name) => {
    const template_path = path.join(compiledPath, name + '.js')
    const opts = {
        name
    }

    fs.writeFileSync(template_path, pug.compileClient(templates.term, opts))
    fs.appendFileSync(template_path, `module.exports = ${name};`)
})