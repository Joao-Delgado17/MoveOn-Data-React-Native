const { getDefaultConfig } = require("expo/metro-config");

module.exports = (async () => {
  const defaultConfig = await getDefaultConfig(__dirname);

  defaultConfig.resolver.extraNodeModules = {
    crypto: require.resolve("react-native-crypto"),
  };

  return defaultConfig;
})();
