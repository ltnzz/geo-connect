import { Platform } from 'react-native';

import {
  assertCloudinaryConfigured,
  cloudinaryConfig,
} from '../config/cloudinary';

const normalizeFileName = (fileName = 'image.jpg') =>
  fileName.replace(/[^a-zA-Z0-9._-]/g, '-');

const buildFilePart = (asset) => {
  if (Platform.OS === 'web' && asset.file) {
    return asset.file;
  }

  return {
    uri: asset.uri,
    type: asset.mimeType || 'image/jpeg',
    name: normalizeFileName(asset.fileName),
  };
};

export const cloudinaryService = {
  async uploadImage(asset, { folder = 'uploads', tags = [] } = {}) {
    assertCloudinaryConfigured();

    if (!asset?.uri) {
      throw new Error('No image was selected.');
    }

    const body = new FormData();
    body.append('file', buildFilePart(asset));
    body.append('upload_preset', cloudinaryConfig.uploadPreset);
    body.append('folder', `${cloudinaryConfig.uploadFolder}/${folder}`);

    if (tags.length) {
      body.append('tags', tags.join(','));
    }

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudinaryConfig.cloudName}/image/upload`,
      {
        method: 'POST',
        body,
      },
    );
    const payload = await response.json();

    if (!response.ok) {
      throw new Error(payload.error?.message || 'Cloudinary image upload failed.');
    }

    return {
      url: payload.secure_url,
      secureUrl: payload.secure_url,
      publicId: payload.public_id,
      width: payload.width,
      height: payload.height,
      format: payload.format,
      bytes: payload.bytes,
    };
  },
};
