import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { storage } from './firebase';

export async function uploadImageAsync(path, blob) {
  const imageRef = ref(storage, path);
  await uploadBytes(imageRef, blob);

  return getDownloadURL(imageRef);
}
