// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

/* eslint-disable no-console, no-process-env */

const fs = require('fs');
const path = require('path');
const url = require('url');

const CopyWebpackPlugin = require('copy-webpack-plugin');
const ExternalTemplateRemotesPlugin = require('external-remotes-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const MonacoWebpackPlugin = require('monaco-editor-webpack-plugin');
const webpack = require('webpack');
const { ModuleFederationPlugin } = require('webpack').container;
const WebpackPwaManifest = require('webpack-pwa-manifest');

const packageJson = require('./package.json');

// 从 brand_config.ts 读取品牌配置（构建时使用）
function getBrandConfigForBuild() {
  const brandConfigPath = path.resolve(__dirname, 'src/utils/brand_config.ts');
  const defaultConfig = {
    SITE_NAME: 'Mattermost1',
    SITE_NAME_SHORT: 'Mattermost1',
    DESCRIPTION: 'Mattermost is an open source, self-hosted Slack-alternative',
  };

  try {
    const fileContent = fs.readFileSync(brandConfigPath, 'utf8');

    // 提取 SITE_NAME
    const siteNameMatch = fileContent.match(/SITE_NAME:\s*['"]([^'"]+)['"]/);
    if (siteNameMatch) {
      defaultConfig.SITE_NAME = siteNameMatch[1];
    }

    // 提取 SITE_NAME_SHORT
    const siteNameShortMatch = fileContent.match(/SITE_NAME_SHORT:\s*['"]([^'"]+)['"]/);
    if (siteNameShortMatch) {
      defaultConfig.SITE_NAME_SHORT = siteNameShortMatch[1];
    } else {
      // 如果没有 SITE_NAME_SHORT，使用 SITE_NAME
      defaultConfig.SITE_NAME_SHORT = defaultConfig.SITE_NAME;
    }

    // 提取 META.DESCRIPTION（在 META 对象中）
    const metaSection = fileContent.match(/META:\s*\{[\s\S]*?\}/);
    if (metaSection) {
      const metaDescriptionMatch = metaSection[0].match(/DESCRIPTION:\s*['"]([^'"]+)['"]/);
      if (metaDescriptionMatch) {
        defaultConfig.DESCRIPTION = metaDescriptionMatch[1];
      }
    }
  } catch (error) {
    console.warn('Warning: Could not read brand_config.ts, using default values:', error.message);
  }

  return defaultConfig;
}

const brandConfig = getBrandConfigForBuild();

const NPM_TARGET = process.env.npm_lifecycle_event;

const targetIsBuild = NPM_TARGET?.startsWith('build');
const targetIsRun = NPM_TARGET?.startsWith('run');
const targetIsStats = NPM_TARGET === 'stats';
const targetIsDevServer = NPM_TARGET?.startsWith('dev-server');
const targetIsEsLint = !targetIsBuild && !targetIsRun && !targetIsDevServer;

const DEV = targetIsRun || targetIsStats || targetIsDevServer;

const STANDARD_EXCLUDE = [
  /node_modules/,
];

// 生产：publicPath 为 '/'，使 root.html 中资源引用为 /static/xxx.js（output.filename 已含 static/）
// 开发：可从环境变量覆盖，否则用 '/'，保证 /static/xxx 能正确解析
let publicPath = '/';

if (DEV) {
  const siteURL = process.env.MM_SERVICESETTINGS_SITEURL || '';
  if (siteURL) {
    const pathname = new url.URL(siteURL).pathname;
    publicPath = pathname.endsWith('/') ? pathname : pathname + '/';
  }
}

// Track the build time so that we can bust any caches that may have incorrectly cached remote_entry.js from before we
// started setting Cache-Control: no-cache for that file on the server. This can be removed in 2024 after those cached
// entries are guaranteed to have expired.
const buildTimestamp = Date.now();

var config = {
  entry: ['./src/root.tsx'],
  // 输出结构：dist/root.html + dist/static/*（JS/CSS/资源），便于服务器部署
  output: {
    path: path.resolve(__dirname, 'dist'),
    publicPath,
    filename: 'static/[name].[contenthash].js',
    chunkFilename: 'static/[name].[contenthash].js',
    assetModuleFilename: 'static/files/[contenthash][ext]',
    clean: true,
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx|ts|tsx)$/,
        exclude: STANDARD_EXCLUDE,
        use: {
          loader: 'babel-loader',
          options: {
            // 生产构建禁用缓存，避免改图标/品牌后打包仍用旧缓存导致部署后不生效
            cacheDirectory: DEV,

            // Babel configuration is in .babelrc because jest requires it to be there.
          },
        },
      },
      {
        test: /\.json$/,
        include: [
          path.resolve(__dirname, 'src/i18n'),
        ],
        exclude: [/en\.json$/],
        type: 'asset/resource',
        generator: {
          filename: 'static/i18n/[name].[contenthash].json',
        },
      },
      {
        test: /\.(css|scss)$/,
        exclude: /\/highlight\.js\//,
        use: [
          DEV ? 'style-loader' : MiniCssExtractPlugin.loader,
          {
            loader: 'css-loader',
          },
        ],
      },
      {
        test: /\.scss$/,
        use: [
          {
            loader: 'sass-loader',
            options: {
              sassOptions: {
                loadPaths: ['src/sass'],
              },
            },
          },
        ],
      },
      // favicon 等小图不走 image-webpack-loader，避免 pngquant 在部分环境（如 Windows）构建失败
      {
        test: /\.(png|eot|tiff|svg|woff2|woff|ttf|gif|mp3|jpg)$/,
        include: path.resolve(__dirname, 'src/images/favicon'),
        type: 'asset/resource',
      },
      {
        test: /\.(png|eot|tiff|svg|woff2|woff|ttf|gif|mp3|jpg)$/,
        exclude: path.resolve(__dirname, 'src/images/favicon'),
        type: 'asset/resource',
        use: [

          // Skip image optimizations during development to speed up build time
          !DEV && {
            loader: 'image-webpack-loader',
            options: {},
          },
        ],
      },
      {
        test: /\.apng$/,
        type: 'asset/resource',
      },
      {
        test: /\/highlight\.js\/.*\.css$/,
        type: 'asset/resource',
      },
    ],
  },
  resolve: {
    modules: [
      'node_modules',
      './src',
    ],
    alias: {
      'mattermost-redux/test': 'packages/mattermost-redux/test',
      // 品牌配置别名：将 getConfig 重定向到带品牌配置的版本（必须放在更通用的别名之前）
      // 注意：webpack 别名需要指向完整的文件路径（包含扩展名）
      'mattermost-redux/selectors/entities/general': path.resolve(__dirname, 'src/utils/config_with_brand.ts'),
      'mattermost-redux': 'packages/mattermost-redux/src',
      '@mui/styled-engine': '@mui/styled-engine-sc',

      // This alias restricts single version of styled components across all packages
      'styled-components': path.resolve(__dirname, '..', 'node_modules', 'styled-components'),
    },
    extensions: ['.ts', '.tsx', '.js', '.jsx'],
    fallback: {
      crypto: require.resolve('crypto-browserify'),
      stream: require.resolve('stream-browserify'),
      buffer: require.resolve('buffer/'),
    },
  },
  performance: {
    hints: 'warning',
  },
  target: 'web',
  plugins: [
    new webpack.ProvidePlugin({
      process: 'process/browser.js',
      Buffer: ['buffer', 'Buffer'],
    }),
    new MiniCssExtractPlugin({
      filename: 'static/[name].[contenthash].css',
      chunkFilename: 'static/[name].[contenthash].css',
    }),
    new HtmlWebpackPlugin({
      filename: 'root.html',
      inject: 'head',
      template: 'src/root.html',
      scriptLoading: 'blocking',
      publicPath: publicPath,
      // 传递品牌配置给模板
      templateParameters: {
        siteName: brandConfig.SITE_NAME,
      },
      meta: {
        csp: {
          'http-equiv': 'Content-Security-Policy',
          content: generateCSP(),
        },
        'application-name': {
          name: 'application-name',
          content: brandConfig.SITE_NAME,
        },
      },
    }),
    new CopyWebpackPlugin({
      patterns: [
        // 静态资源统一放到 dist/static/ 下，与 root.html 同级部署时由服务器提供 /static/ 路径
        { from: 'src/images/emoji', to: 'static/emoji' },
        {
          from: 'src/images',
          to: 'static/images',
          globOptions: {
            ignore: ['**/emoji/**'],
          },
          noErrorOnMissing: true,
        },
        { from: '../node_modules/pdfjs-dist/cmaps', to: 'static/cmaps' },
      ],
    }),

    // Generate manifest.json, honouring any configured publicPath. This also handles injecting
    // <link rel="apple-touch-icon" ... /> and <meta name="apple-*" ... /> tags into root.html.
    // 使用品牌配置（从 brand_config.ts 读取）
    new WebpackPwaManifest({
      name: brandConfig.SITE_NAME,
      short_name: brandConfig.SITE_NAME_SHORT,
      start_url: '..',
      description: brandConfig.DESCRIPTION,
      background_color: '#ffffff',
      inject: true,
      ios: true,
      fingerprints: false,
      orientation: 'any',
      filename: 'static/manifest.json',
      icons: [{
        src: path.resolve('src/images/favicon/android-chrome-192x192.png'),
        type: 'image/png',
        sizes: '192x192',
      }, {
        src: path.resolve('src/images/favicon/apple-touch-icon-120x120.png'),
        type: 'image/png',
        sizes: '120x120',
        ios: true,
      }, {
        src: path.resolve('src/images/favicon/apple-touch-icon-144x144.png'),
        type: 'image/png',
        sizes: '144x144',
        ios: true,
      }, {
        src: path.resolve('src/images/favicon/apple-touch-icon-152x152.png'),
        type: 'image/png',
        sizes: '152x152',
        ios: true,
      }, {
        src: path.resolve('src/images/favicon/apple-touch-icon-57x57.png'),
        type: 'image/png',
        sizes: '57x57',
        ios: true,
      }, {
        src: path.resolve('src/images/favicon/apple-touch-icon-60x60.png'),
        type: 'image/png',
        sizes: '60x60',
        ios: true,
      }, {
        src: path.resolve('src/images/favicon/apple-touch-icon-72x72.png'),
        type: 'image/png',
        sizes: '72x72',
        ios: true,
      }, {
        src: path.resolve('src/images/favicon/apple-touch-icon-76x76.png'),
        type: 'image/png',
        sizes: '76x76',
        ios: true,
      }, {
        src: path.resolve('src/images/favicon/favicon-16x16.png'),
        type: 'image/png',
        sizes: '16x16',
      }, {
        src: path.resolve('src/images/favicon/favicon-32x32.png'),
        type: 'image/png',
        sizes: '32x32',
      }, {
        src: path.resolve('src/images/favicon/favicon-96x96.png'),
        type: 'image/png',
        sizes: '96x96',
      }],
    }),
    new MonacoWebpackPlugin({
      languages: [],

      // don't include features we disable. these generally correspond to the options
      // passed to editor initialization in note-content-editor.tsx
      // @see https://github.com/microsoft/monaco-editor/blob/main/webpack-plugin/README.md#options
      features: [
        '!bracketMatching',
        '!codeAction',
        '!codelens',
        '!colorPicker',
        '!comment',
        '!diffEditor',
        '!diffEditorBreadcrumbs',
        '!folding',
        '!gotoError',
        '!gotoLine',
        '!gotoSymbol',
        '!gotoZoom',
        '!inspectTokens',
        '!multicursor',
        '!parameterHints',
        '!quickCommand',
        '!quickHelp',
        '!quickOutline',
        '!referenceSearch',
        '!rename',
        '!snippet',
        '!stickyScroll',
        '!suggest',
        '!toggleHighContrast',
        '!unicodeHighlighter',
      ],
    }),
  ],
};

function generateCSP() {
  let csp = 'script-src \'self\' js.stripe.com/v3';

  if (DEV) {
    // Development source maps require eval
    csp += ' \'unsafe-eval\'';
    // 开发环境允许 HMR、API 代理和 Chrome DevTools 连接，避免 connect-src 回退到 default-src 导致拦截
    csp += '; connect-src \'self\' ws://localhost:* http://localhost:* https://localhost:* chrome-extension:*';
  }

  return csp;
}

async function initializeModuleFederation() {
  function makeSharedModules(packageNames, singleton) {
    const sharedObject = {};

    for (const packageName of packageNames) {
      const version = packageJson.dependencies[packageName];

      sharedObject[packageName] = {

        // Ensure only one copy of this package is ever loaded
        singleton,

        // Setting this to true causes the app to error out if the required version is not satisfied
        strictVersion: singleton,

        // Set these to match the specific version that the web app includes
        requiredVersion: singleton ? version : undefined,
        version,
      };
    }

    return sharedObject;
  }

  async function getRemoteContainers() {
    const products = [];

    const remotes = {};
    for (const product of products) {
      remotes[product.name] = `${product.name}@[window.basename]/static/products/${product.name}/remote_entry.js?bt=${buildTimestamp}`;
    }

    return { remotes };
  }

  const { remotes } = await getRemoteContainers();

  const moduleFederationPluginOptions = {
    name: 'mattermost_webapp',
    remotes,
    shared: [

      // Shared modules will be made available to other containers (ie products and plugins using module federation).
      // To allow for better sharing, containers shouldn't require exact versions of packages like the web app does.

      // Other containers will use these shared modules if their required versions match. If they don't match, the
      // version packaged with the container will be used.
      makeSharedModules([
        '@mattermost/client',
        '@mattermost/types',
        'luxon',
      ], false),

      // Other containers will be forced to use the exact versions of shared modules that the web app provides.
      makeSharedModules([
        'history',
        'react',
        'react-beautiful-dnd',
        'react-bootstrap',
        'react-dom',
        'react-intl',
        'react-redux',
        'react-router-dom',
        'styled-components',
      ], true),
    ],
  };

  // Desktop specific code for remote module loading
  moduleFederationPluginOptions.exposes = {
    './app': 'components/app',
    './store': 'stores/redux_store',
    './styles': './src/sass/styles.scss',
    './registry': 'module_registry',
  };
  moduleFederationPluginOptions.filename = `static/remote_entry.js?bt=${buildTimestamp}`;

  config.plugins.push(new ModuleFederationPlugin(moduleFederationPluginOptions));

  // Add this plugin to perform the substitution of window.basename when loading remote containers
  config.plugins.push(new ExternalTemplateRemotesPlugin());

  config.plugins.push(new webpack.DefinePlugin({
    REMOTE_CONTAINERS: JSON.stringify(remotes),
  }));
}

if (DEV) {
  // Development mode configuration
  config.mode = 'development';
  config.devtool = 'eval-cheap-module-source-map';
} else {
  // Production mode configuration
  config.mode = 'production';
  config.devtool = 'source-map';
}

const env = {};
if (DEV) {
  env.PUBLIC_PATH = JSON.stringify(publicPath);
} else {
  env.NODE_ENV = JSON.stringify('production');
}

config.plugins.push(new webpack.DefinePlugin({
  'process.env': env,
}));

if (targetIsDevServer) {
  const proxyToServer = {
    logLevel: 'silent',
    // 后端 API 地址配置
    // 优先级：环境变量 MM_SERVICESETTINGS_SITEURL > 默认值
    // 可以通过设置环境变量覆盖：export MM_SERVICESETTINGS_SITEURL=https://your-backend.com
    target: process.env.MM_SERVICESETTINGS_SITEURL ?? 'https://guduu-im.zeabur.app',
    // 跨域配置（类似 Vue 的代理配置）
    changeOrigin: true,        // 改变请求头中的 origin，解决跨域问题
    secure: true,              // 如果是 HTTPS，验证 SSL 证书（如果后端是自签名证书，改为 false）
    xfwd: true,               // 添加 X-Forwarded-* 头
    // 处理响应头，解决跨域问题
    onProxyRes: function (proxyRes, req, res) {
      // 允许所有来源（开发环境）
      proxyRes.headers['Access-Control-Allow-Origin'] = '*';
      proxyRes.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, PATCH, OPTIONS';
      proxyRes.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, X-Requested-With';
      proxyRes.headers['Access-Control-Allow-Credentials'] = 'true';
    },
    // 处理请求头
    onProxyReq: function (proxyReq, req, res) {
      // 如果需要，可以在这里修改请求头
      // 例如：proxyReq.setHeader('X-Custom-Header', 'value');
    },
  };

  config = {
    ...config,
    devtool: 'eval-cheap-module-source-map',
    devServer: {
      liveReload: true,
      proxy: [
        {
          context: '/api',
          ...proxyToServer,
          ws: true,
        },
        {
          context: '/plugins',
          ...proxyToServer,
        },
        {
          context: '/static/plugins',
          ...proxyToServer,
        },
      ],
      port: 9005,
      devMiddleware: {
        writeToDisk: false,
      },
      // publicPath 为 '/' 时，入口 HTML 的 URL 为 /root.html
      historyApiFallback: {
        index: '/root.html',
      },
      // 禁用 webpack 编译警告和错误的 iframe 弹出层
      client: {
        overlay: false,
      },
    },
    performance: false,
    optimization: {
      ...config.optimization,
      splitChunks: false,
    },
  };
}

// Export PRODUCTION_PERF_DEBUG=1 when running webpack to enable support for the react profiler
// even while generating production code. (Performance testing development code is typically
// not helpful.)
// See https://reactjs.org/blog/2018/09/10/introducing-the-react-profiler.html and
// https://gist.github.com/bvaughn/25e6233aeb1b4f0cdb8d8366e54a3977
if (process.env.PRODUCTION_PERF_DEBUG) {
  console.log('Enabling production performance debug settings'); //eslint-disable-line no-console
  config.resolve.alias['react-dom'] = 'react-dom/profiling';
  config.resolve.alias['schedule/tracing'] = 'schedule/tracing-profiling';
  config.optimization = {

    // Skip minification to make the profiled data more useful.
    minimize: false,
  };
}

if (targetIsEsLint) {
  // ESLint can't handle setting an async config, so just skip the async part
  module.exports = config;
} else {
  module.exports = async () => {
    // Do this asynchronously so we can determine whether which remote modules are available
    await initializeModuleFederation();

    return config;
  };
}
