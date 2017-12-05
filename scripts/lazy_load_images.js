// import echo from './echo.min.js'
const echo = require('./echo.min.js')(document)

echo.init({
    offsetVertical: 1000,
    throttle: 50
})