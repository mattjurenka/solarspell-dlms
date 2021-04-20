const { hot } = require("react-hot-loader/root")

// prefer default export if available
const preferDefault = m => (m && m.default) || m


exports.components = {
  "component---cache-dev-404-page-js": hot(preferDefault(require("/home/matt/solarspell-dlms/frontend/.docz/.cache/dev-404-page.js"))),
  "component---docz-test-mdx": hot(preferDefault(require("/home/matt/solarspell-dlms/frontend/docz/test.mdx"))),
  "component---src-pages-404-js": hot(preferDefault(require("/home/matt/solarspell-dlms/frontend/.docz/src/pages/404.js")))
}

