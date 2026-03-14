import localforage from 'localforage';
import { v4 as uuidv4 } from 'uuid';

// Configure the store
localforage.config({
  name: 'RodmonDB',
  storeName: 'worksheets'
});

const WORKSHEETS_KEY = 'rodmon_worksheets';

/**
 * Get all worksheets (without their heavy node/edge payloads)
 */
export const getWorksheetsList = async () => {
  try {
    const list = await localforage.getItem(WORKSHEETS_KEY) || [];
    return list;
  } catch (error) {
    console.error('Error fetching worksheet list:', error);
    return [];
  }
};

/**
 * Save the worksheets list
 */
const saveWorksheetsList = async (list) => {
  await localforage.setItem(WORKSHEETS_KEY, list);
};

/**
 * Create a new empty worksheet
 */
export const createWorksheet = async (name = 'New Worksheet') => {
  const newSheetId = uuidv4();
  
  const newSheet = {
    id: newSheetId,
    name,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    nodes: [],
    edges: [],
    viewport: { x: 0, y: 0, zoom: 1 }
  };

  // Add to index list
  const list = await getWorksheetsList();
  list.push({
    id: newSheetId,
    name,
    createdAt: newSheet.createdAt,
    updatedAt: newSheet.updatedAt
  });
  await saveWorksheetsList(list);

  // Save full sheet object
  await localforage.setItem(`ws_${newSheetId}`, newSheet);
  
  return newSheet;
};

/**
 * Load a full worksheet by ID
 */
export const loadWorksheet = async (id) => {
  try {
    const data = await localforage.getItem(`ws_${id}`);
    return data;
  } catch (err) {
    console.error(`Error loading worksheet ${id}:`, err);
    return null;
  }
};

/**
 * Save / Update an existing worksheet with latest nodes/edges
 */
export const saveWorksheet = async (id, data) => {
  try {
    const existing = await loadWorksheet(id) || {};
    const updated = {
      ...existing,
      ...data,
      updatedAt: Date.now()
    };
    await localforage.setItem(`ws_${id}`, updated);
    
    // Also update name in the list if name changed
    if (data.name) {
      const list = await getWorksheetsList();
      const index = list.findIndex(item => item.id === id);
      if (index !== -1) {
        list[index].name = data.name;
        list[index].updatedAt = updated.updatedAt;
        await saveWorksheetsList(list);
      }
    }
    
    return updated;
  } catch (err) {
    console.error(`Error saving worksheet ${id}:`, err);
    throw err;
  }
};

/**
 * Delete a worksheet
 */
export const deleteWorksheet = async (id) => {
  try {
    const list = await getWorksheetsList();
    const newList = list.filter(item => item.id !== id);
    await saveWorksheetsList(newList);
    
    await localforage.removeItem(`ws_${id}`);
    return true;
  } catch (err) {
    console.error(`Error deleting worksheet ${id}:`, err);
    return false;
  }
};

/**
 * Export a worksheet to raw JSON string
 */
export const exportWorksheet = async (id) => {
  const sheet = await loadWorksheet(id);
  if (!sheet) return null;
  return JSON.stringify(sheet);
};

/**
 * Import a worksheet from JSON string
 */
export const importWorksheet = async (jsonString) => {
  try {
    const data = JSON.parse(jsonString);
    if (!data.id || !data.nodes) throw new Error('Invalid Worksheet format');
    
    // Check if it exists, if so generate new ID to avoid overwrite
    const existing = await loadWorksheet(data.id);
    let finalId = data.id;
    let name = data.name;
    
    if (existing) {
      finalId = uuidv4();
      name = `${name} (Imported)`;
    }
    
    data.id = finalId;
    data.name = name;
    data.createdAt = Date.now();
    data.updatedAt = Date.now();
    
    // Add to list, then save full object
    const list = await getWorksheetsList();
    list.push({
      id: finalId,
      name,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt
    });
    
    await saveWorksheetsList(list);
    await localforage.setItem(`ws_${finalId}`, data);
    
    return data;
  } catch (err) {
    console.error('Import error:', err);
    return null;
  }
};
