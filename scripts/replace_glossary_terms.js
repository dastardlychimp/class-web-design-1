import glossary from '../glossary'
import term_template from '../templates/functions/compiled/term'

document.addEventListener("DOMContentLoaded", function(event) { 
    const p_tags = Array.from(document.getElementsByTagName('p'))
    const storage = {}
    
    Object.keys(glossary)
        .sort((a, b) => a.length < b.length ? 1 : -1)
        .forEach(term => {
            const termRegex = new RegExp(`(^|\\s)(${term})(^|\\s)`, 'gi')
            const termRegexIgnore = new RegExp(`!(${term})!`, 'gi')
            p_tags.forEach(p => p.innerHTML = p.innerHTML.replace(
                termRegex,
                (match, open, termCaseSensitive, close) => { 
                    let id = Math.random()
                    storage[id] = open + term_template({
                        key: term.split(' ').join('-'),
                        term: termCaseSensitive
                    }) + close
                    return id;
                })
                .replace(
                    termRegexIgnore,
                    (match, termCaseSensitive) => {
                        console.log(match)
                        let id = Math.random()
                        storage[id] = termCaseSensitive
                        return id;
                })
            )
        })
    
    p_tags.forEach(p => Object.keys(storage).forEach(id => {
        return p.innerHTML = p.innerHTML.replace(id, storage[id])
    }))
})