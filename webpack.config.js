const path = require('path');

let config = {
  mode: 'development',
  entry: './src/index.js',
  output: {
    filename: 'main.js',
    path: path.resolve(__dirname, 'dist')
  },
  module: {
    rules: [
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader']
      }
    ]
  },

  resolve: {
    alias: {
      'vue$': 'vue/dist/vue.esm.js' // 'vue/dist/vue.common.js' for webpack 1
    }
  }
};

module.exports = (env, argv) => {
  config.mode = argv.mode;
  if ( argv.mode === 'development' ) {
    config.output.filename = 'main.js';
  } else {
    config.output.filename = 'main.min.js';
  }
  return config;
};
