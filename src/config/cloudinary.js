export const cloudinaryConfig = Object.freeze({
  cloudName: process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME,
  uploadPreset: process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET,
  uploadFolder: process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_FOLDER || 'aroundu',
});

export const isCloudinaryConfigured = Boolean(
  cloudinaryConfig.cloudName && cloudinaryConfig.uploadPreset,
);

export const assertCloudinaryConfigured = () => {
  if (!isCloudinaryConfigured) {
    throw new Error(
      'Cloudinary belum dikonfigurasi. Isi EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME dan EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET di .env.',
    );
  }
};
