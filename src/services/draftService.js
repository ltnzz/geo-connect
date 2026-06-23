import AsyncStorage from '@react-native-async-storage/async-storage';

const DRAFTS_KEY = '@aroundu:post-drafts';

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

async function getDrafts() {
  try {
    const raw = await AsyncStorage.getItem(DRAFTS_KEY);
    const drafts = raw ? JSON.parse(raw) : [];
    return drafts.sort((a, b) => b.updatedAt - a.updatedAt);
  } catch {
    return [];
  }
}

async function saveDraft(draftData) {
  const drafts = await getDrafts();

  const { id, type = 'POST', content, assetUri, radius, eventData } = draftData;

  const newDraft = {
    id: id || generateId(),
    type,
    content: content || '',
    assetUri: assetUri || null,
    radius: radius || 5,
    eventData: eventData || null, 
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  const existingIndex = drafts.findIndex((d) => d.id === newDraft.id);
  
  if (existingIndex >= 0) {
    
    newDraft.createdAt = drafts[existingIndex].createdAt;
    drafts[existingIndex] = newDraft;
  } else {
    drafts.unshift(newDraft);
  }

  await AsyncStorage.setItem(DRAFTS_KEY, JSON.stringify(drafts));
  return newDraft;
}

async function deleteDraft(draftId) {
  const drafts = await getDrafts();
  const filtered = drafts.filter((d) => d.id !== draftId);
  await AsyncStorage.setItem(DRAFTS_KEY, JSON.stringify(filtered));
}

async function clearAllDrafts() {
  await AsyncStorage.removeItem(DRAFTS_KEY);
}

export const draftService = {
  getDrafts,
  saveDraft,
  deleteDraft,
  clearAllDrafts,
};
