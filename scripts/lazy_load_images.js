const echo = require('./echo.min.js')(document)

echo.init({
    offsetVertical: 1000,
    throttle: 50
})

window.setTimeout(echo.render, 0)