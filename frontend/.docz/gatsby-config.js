const { mergeWith } = require('docz-utils')
const fs = require('fs-extra')

let custom = {}
const hasGatsbyConfig = fs.existsSync('./gatsby-config.custom.js')

if (hasGatsbyConfig) {
  try {
    custom = require('./gatsby-config.custom')
  } catch (err) {
    console.error(
      `Failed to load your gatsby-config.js file : `,
      JSON.stringify(err),
    )
  }
}

const config = {
  pathPrefix: '/',

  siteMetadata: {
    title: 'Build Automation Frontend',
    description: 'Front-end for SolarSPELL build automation using ReactJS',
  },
  plugins: [
    {
      resolve: 'gatsby-plugin-typescript',
      options: {
        isTSX: true,
        allExtensions: true,
      },
    },
    {
      resolve: 'gatsby-theme-docz',
      options: {
        themeConfig: {},
        src: './',
        gatsbyRoot: null,
        themesDir: 'src',
        mdxExtensions: ['.md', '.mdx'],
        docgenConfig: {},
        menu: [],
        mdPlugins: [],
        hastPlugins: [],
        ignore: [],
        typescript: true,
        ts: false,
        propsParser: true,
        'props-parser': true,
        debug: false,
        native: false,
        openBrowser: null,
        o: null,
        open: null,
        'open-browser': null,
        root: '/home/matt/solarspell-dlms/frontend/.docz',
        base: '/',
        source: './',
        'gatsby-root': null,
        files: '**/*.{md,markdown,mdx}',
        public: '/public',
        dest: '.docz/dist',
        d: '.docz/dist',
        editBranch: 'master',
        eb: 'master',
        'edit-branch': 'master',
        config: '',
        title: 'Build Automation Frontend',
        description: 'Front-end for SolarSPELL build automation using ReactJS',
        host: 'localhost',
        port: 3000,
        p: 3000,
        separator: '-',
        paths: {
          root: '/home/matt/solarspell-dlms/frontend',
          templates:
            '/home/matt/solarspell-dlms/frontend/node_modules/docz-core/dist/templates',
          docz: '/home/matt/solarspell-dlms/frontend/.docz',
          cache: '/home/matt/solarspell-dlms/frontend/.docz/.cache',
          app: '/home/matt/solarspell-dlms/frontend/.docz/app',
          appPackageJson: '/home/matt/solarspell-dlms/frontend/package.json',
          appTsConfig: '/home/matt/solarspell-dlms/frontend/tsconfig.json',
          gatsbyConfig: '/home/matt/solarspell-dlms/frontend/gatsby-config.js',
          gatsbyBrowser:
            '/home/matt/solarspell-dlms/frontend/gatsby-browser.js',
          gatsbyNode: '/home/matt/solarspell-dlms/frontend/gatsby-node.js',
          gatsbySSR: '/home/matt/solarspell-dlms/frontend/gatsby-ssr.js',
          importsJs: '/home/matt/solarspell-dlms/frontend/.docz/app/imports.js',
          rootJs: '/home/matt/solarspell-dlms/frontend/.docz/app/root.jsx',
          indexJs: '/home/matt/solarspell-dlms/frontend/.docz/app/index.jsx',
          indexHtml: '/home/matt/solarspell-dlms/frontend/.docz/app/index.html',
          db: '/home/matt/solarspell-dlms/frontend/.docz/app/db.json',
        },
      },
    },
  ],
}

const merge = mergeWith((objValue, srcValue) => {
  if (Array.isArray(objValue)) {
    return objValue.concat(srcValue)
  }
})

module.exports = merge(config, custom)
