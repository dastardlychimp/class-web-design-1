import glossary from '../glossary'
import term_template from '../templates/functions/compiled/term'

document.addEventListener("DOMContentLoaded", function(event) { 
    const p_tags = Array.from(document.getElementsByTagName('p'))
    
    Object.keys(glossary).forEach(term => {
        const linked_term = term_template({ term, key: term.split(' ').join('-') })
        const termRegex = new RegExp('\\b' + term + '\\b', 'gi')
        console.log(termRegex)
        console.log(linked_term)
        p_tags.forEach(p => p.innerHTML = p.innerHTML.replace(termRegex, linked_term))
    })
})