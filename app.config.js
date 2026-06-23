module.exports = ({ config }) => {
  return {
    ...config,
    owner: "boneeeeeeeeeeeee",
    plugins: [
      ...(config.plugins || []),
      'expo-asset',
      'expo-audio',
      "@react-native-community/datetimepicker"
    ],
    android: {
      ...config.android,
      config: {
        ...config.android?.config,
        googleMaps: {
          apiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || process.env.EXPO_PUBLIC_FIREBASE_API_KEY || '',
        },
      },
    },
  };
};
