module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        'module-resolver',
        {
          root: ['.'],
          alias: {
            '@': './',
            '@/features': './features',
            '@/shared': './shared',
            '@/store': './store',
            '@/types': './types',
          },
          extensions: ['.ts', '.tsx', '.js', '.jsx', '.json'],
        },
      ],
      'expo-router/babel',
      // keep this last
      'react-native-reanimated/plugin',
    ],
  };
};

