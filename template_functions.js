const fs = require('fs')
const pug = require('pug')

const templates = {
    'term': 'a.term(href=`/module-4/glossary.html#${key}`)= term'
}

fs.writeFileSync('./templates/functions/compiled/term.js', pug.compileClient(templates.term, {name: 'term'}))