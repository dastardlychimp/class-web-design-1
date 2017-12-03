import glossary from '../glossary'
import term_template from '../templates/functions/compiled/term'

document.addEventListener("DOMContentLoaded", function(event) { 
    const p_tags = Array.from(document.getElementsByTagName('p'))
    const storage = {}
    
    Object.keys(glossary)
        .sort((a, b) => a.length < b.length ? 1 : -1)
        .forEach(term => {
            console.log(term)
            const termRegex = new RegExp('\\b(' + term + ')\\b', 'gi')
            p_tags.forEach(p => p.innerHTML = p.innerHTML.replace(
                termRegex,
                (match, termCaseSensitive) => { 
                    let id = Math.random()
                    storage[id] = term_template({
                        key: term.split(' ').join('-'),
                        term: termCaseSensitive
                    })
                    return id;
                }
            ))
        })
    
    p_tags.forEach(p => Object.keys(storage).forEach(id => {
        console.log(id, storage[id])
        return p.innerHTML = p.innerHTML.replace(id, storage[id])
    }))
})