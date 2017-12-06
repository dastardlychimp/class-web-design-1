window.contactFormScript = () => {
    document.addEventListener("DOMContentLoaded", (event) => {
        const form = document.getElementById('contact-form')
        const selectors = {
            reason: `.reason`,
            email: `input[name=email]`,
            name: `input[name=name]`,
            contact_email: `input[name=contact][value=email]`,
            contact_text: `input[name=contact][value=text]`,
            contact_none: `input[name=contact][value=none]`,
            phone: `input[name=phone]`,
            check_about: `input[name=about]`,
            check_exposure: `input[name=exposure]`,
            check_design: `input[name=design]`,
            check_glossary: `input[name=glossary]`,
            details: `.details`,
            problem: `.problem`,
            phone_piece: `.phone-piece`,
            submit: `button.submit`,
            subject: `.subject`
        }
        const errors = {}
        const touched = {}
        
        const email_regex = /(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:(2(5[0-5]|[0-4][0-9])|1[0-9][0-9]|[1-9]?[0-9]))\.){3}(?:(2(5[0-5]|[0-4][0-9])|1[0-9][0-9]|[1-9]?[0-9])|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])/
        const phone_regex = /1?\d{10,10}/
        
        const elements = Object.keys(selectors).reduce((acc, key) => {
            acc[key] = form.querySelector(selectors[key])
            return acc;
        }, {})

        const formElements = [
            'reason',
            'email',
            'name',
            'contact_email',
            'contact_text',
            'contact_none',
            'phone',
            'check_about',
            'check_exposure',
            'check_design',
            'check_glossary',
            'details'
        ].reduce((acc, name) => {
            acc[name] = elements[name]
            return acc
        }, {})
        
        const validations = {
            reason: (value, form) => {
                value in ["comment", "bug", "question"]
                    ? undefined
                    : 'Invalid '
            },
            email: (value, form) => {
                return email_regex.test(value)
                    ? undefined
                    : 'Invalid email'
            },
            name: (value, form) => {
                return /^[^\d]+$/.test(value)
                    ? undefined
                    : `Invalid name. Can't contain numbers`
            },
            phone: (value, form) => {
                const stripped = value.replace(/\D/g, '')
                return phone_regex.test(stripped)
                    ? undefined
                    : 'Invalid phone number'
            },
            details: (value, form) => {
                return value.length > 0
                    ? undefined
                    : `Invalid details`
            }
        }
        validations.check_about
        = validations.check_exposure
        = validations.check_design
        = validations.check_glossary = (value, form) => {
            return form.check_about
            || form.check_exposure
            || form.check_design
            || form.check_glossary
                ? undefined
                : 'Please select a page the problem is happening on.'
        }
        validations.contact_email
        = validations.contact_text
        = validations.contact_none
        = (value, form) => {
            return (form.contact_email || form.contact_text || form.contact_none)
                ? undefined
                : 'Please select a contact method'
        }
        Object.freeze(validations)
        Object.freeze(elements)
        Object.freeze(formElements)

        Object.keys(formElements).forEach((key) => {
            const em = formElements[key]
            const errorMessage = errors[key] = document.createElement('span')
            errorMessage.classList.add('error-message')
            em.parentNode.insertAdjacentElement('afterend', errorMessage)

            em.onchange = em.oninput = () => {
                touched[key] = true
                const form_data = formData()
                runValidations(form_data)
                sides(form_data);
            }
        })

        elements.submit.onclick = (e) => {
            Object.keys(formElements).forEach(key => touched[key] = true)
            const form_data = formData()
            if (! runValidations(form_data) && form.checkValidity()) {
                e.preventDefault();
                document.querySelector('.error').scrollIntoView()
            }
            else {
                elements.subject.value = {
                    'bug': 'Quixtor bug report',
                    'comment': 'Quixtor comment',
                    'question': 'Quixtor question'
                }[form_data.reason]
            }
        }

        sides(formData())

        function runValidations(form_data) {
            let valid = true;
            Object.entries(validations).forEach(([key, validation]) => {
                const em = formElements[key]
                const error = validation(form_data[key], form_data)

                if (elementVisible(em) && error) {
                    valid = false;
                    
                    if (touched[key]) {
                        em.classList.add('error')
                        // em.parentNode.classList.add('error')
                        errors[key].innerText = error
                    }
                }
                else {
                    em.classList.remove('error')
                    // em.parentNode.classList.remove('error')
                    errors[key].innerText = ''
                }
            })
            return valid;
        }

        function sides(form_data) {
            toggleVisibility(
                elements.phone_piece,
                form_data.contact_text
            )

            toggleVisibility(
                elements.problem,
                form_data.reason === 'bug'
            )

            elements.submit.innerText = {
                'comment': 'Send comment',
                'bug': 'Report bug',
                'question': 'Ask question'
            }[form_data.reason]
        }

        function formData() {
            let data = {}
            for (let key in formElements) {
                let em = formElements[key]
                data[key] = elementValue(em)
            }
            return data
        }

        function elementValue(em) {
            if (em.type === 'checkbox' || em.type === 'radio')
                return em.checked
            else
                return em.value
        }

        function elementVisible(em) {
            return em.offsetParent !== null
        }

        function toggleVisibility(em, bool) {
            bool ? em.style.display = 'block' : em.style.display = 'none'
        }
    })
}