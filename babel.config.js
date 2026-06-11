module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    // reanimated plugin PHẢI đứng cuối cùng
    plugins: ['react-native-reanimated/plugin'],
  };
};
