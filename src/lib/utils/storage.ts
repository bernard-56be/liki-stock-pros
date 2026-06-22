// src/lib/utils/storage.ts

/**
 * Sauvegarde des données dans le localStorage après conversion JSON
 */
export const saveToCache = (key: string, data: any): void => {
  try {
    const serializedData = JSON.stringify(data);
    localStorage.setItem(key, serializedData);
  } catch (error) {
    console.error("Erreur lors de la sauvegarde dans le cache :", error);
  }
};

/**
 * Récupération et parsing des données depuis le localStorage
 */
export const getFromCache = (key: string): any | null => {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error("Erreur lors de la lecture du cache :", error);
    return null;
  }
};