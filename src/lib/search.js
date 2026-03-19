import { getWorksheetsList, loadWorksheet } from './storage';

// In-memory search index
// Structure: { worksheetId: { worksheetName, blobs: { blobId: { name, data, tags } } } }
let searchIndex = {};
let isIndexReady = false;

/**
 * Builds the initial search index by loading all worksheets and their blobs.
 * Call this once on application startup.
 */
export const initializeSearchIndex = async () => {
  const worksheets = await getWorksheetsList();
  const newIndex = {};

  for (const ws of worksheets) {
    const fullSheet = await loadWorksheet(ws.id);
    if (!fullSheet) continue;

    newIndex[ws.id] = {
      worksheetName: ws.name,
      blobs: {}
    };

    if (fullSheet.nodes) {
      fullSheet.nodes.forEach(node => {
        if (node.type === 'blobNode') {
          newIndex[ws.id].blobs[node.id] = {
            name: node.data.name || '',
            content: node.data.content || '',
            tags: node.data.tags || []
          };
        }
      });
    }
  }

  searchIndex = newIndex;
  isIndexReady = true;
  console.log('Search index initialized');
};

/**
 * Updates or adds a worksheet to the index.
 */
export const updateWorksheetIndex = (worksheetId, worksheetName, nodes) => {
  if (!isIndexReady) return;

  if (!searchIndex[worksheetId]) {
    searchIndex[worksheetId] = { worksheetName, blobs: {} };
  } else {
    searchIndex[worksheetId].worksheetName = worksheetName;
  }

  // Rewrite blobs for this worksheet
  const updatedBlobs = {};
  if (nodes) {
    nodes.forEach(node => {
      if (node.type === 'blobNode') {
        updatedBlobs[node.id] = {
          name: node.data.name || '',
          content: node.data.content || '',
          tags: Array.isArray(node.data.tags) ? node.data.tags : []
        };
      }
    });
  }
  searchIndex[worksheetId].blobs = updatedBlobs;
};

/**
 * Removes a worksheet from the index.
 */
export const removeWorksheetFromIndex = (worksheetId) => {
  if (searchIndex[worksheetId]) {
    delete searchIndex[worksheetId];
  }
};

/**
 * Perform a unified search.
 * @param {string} query The search string
 * @param {string|null} restrictToWorksheetId If provided, searches only within this worksheet (Local Search)
 * @returns {Array} Array of sorted results matching the query
 */
export const performSearch = (query, restrictToWorksheetId = null, isCaseSensitive = false) => {
  if (!isIndexReady || !query || query.trim() === '') return [];
  
  const rawQuery = query.trim();
  const isTagSearch = rawQuery.startsWith('#');
  
  // Extracting search string, without the tag prefix if tag search
  const originalSearchStr = isTagSearch ? rawQuery.substring(1).trim() : rawQuery;
  const searchStr = isCaseSensitive ? originalSearchStr : originalSearchStr.toLowerCase();
  
  const results = [];

  const worksheetsToScan = restrictToWorksheetId 
    ? (searchIndex[restrictToWorksheetId] ? [restrictToWorksheetId] : [])
    : Object.keys(searchIndex);

  worksheetsToScan.forEach(wsId => {
    const wsData = searchIndex[wsId];
    const wsName = wsData.worksheetName;

    Object.entries(wsData.blobs).forEach(([blobId, blobData]) => {
      let score = 0;
      let matchedField = null;

      const nameVal = blobData.name || '';
      const contentVal = blobData.content || '';
      const tagsVal = Array.isArray(blobData.tags) ? blobData.tags.map(t => typeof t === 'string' ? t : '') : [];

      const nameToMatch = isCaseSensitive ? nameVal : nameVal.toLowerCase();
      const contentToMatch = isCaseSensitive ? contentVal : contentVal.toLowerCase();
      const tagsToMatch = isCaseSensitive ? tagsVal : tagsVal.map(t => typeof t === 'string' ? t.toLowerCase() : '');

      if (isTagSearch) {
        // Strict tag priority matching
        if (tagsToMatch.some(t => t.includes(searchStr))) {
          score += 10;
          matchedField = 'tag';
        } else if (nameToMatch.includes(searchStr)) {
          score += 2;
          matchedField = 'name';
        }
      } else {
        // Standard fuzzy substring scoring
        
        // Exact exact name match
        if (nameToMatch === searchStr) {
          score += 20;
          matchedField = 'name';
        } 
        // Partial name match
        else if (nameToMatch.includes(searchStr)) {
          score += 10;
          matchedField = 'name';
        }
        
        // Tag match
        if (tagsToMatch.some(t => t.includes(searchStr))) {
          score += 8;
          if (!matchedField) matchedField = 'tag';
        }
        
        // Content match
        if (contentToMatch.includes(searchStr)) {
          score += 5;
          if (!matchedField) matchedField = 'content';
        }
      }

      if (score > 0) {
        results.push({
          worksheetId: wsId,
          worksheetName: wsName,
          blobId,
          blobName: blobData.name,
          blobTags: blobData.tags,
          matchedField,
          score
        });
      }
    });
  });

  // Sort by score descending
  return results.sort((a, b) => b.score - a.score);
};
