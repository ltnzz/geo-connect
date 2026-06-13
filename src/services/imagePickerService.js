import * as ImagePicker from 'expo-image-picker';

const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

const validateAsset = (asset) => {
  if (asset.fileSize && asset.fileSize > MAX_IMAGE_BYTES) {
    throw new Error('Image must be smaller than 10 MB.');
  }

  if (asset.type && asset.type !== 'image') {
    throw new Error('Please select an image file.');
  }

  return asset;
};

export const imagePickerService = {
  async fromLibrary({ aspect = [4, 3], allowsEditing = true } = {}) {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      throw new Error('Photo library permission is required to choose an image.');
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing,
      aspect,
      quality: 0.85,
    });

    return result.canceled ? null : validateAsset(result.assets[0]);
  },

  async fromCamera({ aspect = [4, 3], allowsEditing = true } = {}) {
    const permission = await ImagePicker.requestCameraPermissionsAsync();

    if (!permission.granted) {
      throw new Error('Camera permission is required to take a photo.');
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      allowsEditing,
      aspect,
      quality: 0.85,
    });

    return result.canceled ? null : validateAsset(result.assets[0]);
  },
};
