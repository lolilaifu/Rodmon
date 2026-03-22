import { getWorksheetsList, loadWorksheet } from './storage';

/**
 * Calculates a variation of Levenshtein distance (Sellers' algorithm) 
 * to find the minimum edit distance from `query` to ANY substring of `text`.
 */
function fuzzySubstringDistance(query, text) {
  if (!query || !text) return Infinity;
  if (text.includes(query)) return 0;
  if (query.length <= 2) return Infinity; // Short tokens MUST exactly match
  
  const m = query.length;
  const n = text.length;
  
  let prevRow = new Uint16Array(n + 1);
  let currRow = new Uint16Array(n + 1);
  
  for (let i = 1; i <= m; i++) {
    currRow[0] = i; 
    for (let j = 1; j <= n; j++) {
      const cost = query[i - 1] === text[j - 1] ? 0 : 1;
      currRow[j] = Math.min(
        currRow[j - 1] + 1,      // insertion into text
        prevRow[j] + 1,          // deletion from text
        prevRow[j - 1] + cost    // substitution
      );
    }
    let temp = prevRow;
    prevRow = currRow;
    currRow = temp;
  }
  
  let minDistance = m;
  for (let j = 0; j <= n; j++) {
    if (prevRow[j] < minDistance) minDistance = prevRow[j];
  }
  
  return minDistance;
}

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
export const performSearch = (query, restrictToWorksheetId = null, isCaseSensitive = false, isFuzzySearch = true) => {
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

  const tokens = isFuzzySearch ? searchStr.split(/\s+/).filter(Boolean) : [searchStr];

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

      if (!isFuzzySearch) {
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
      } else {
        let isMatch = true;
        let minEditDist = Infinity;
        let fuzzyMatchedField = null;

        for (const token of tokens) {
          let bestDistForToken = Infinity;
          let tokenMatchedField = null;

          const isShort = token.length <= 2;

          // 1. Check Tags
          for (const t of tagsToMatch) {
            if (isShort) {
              if (t === token || t.includes(token)) { bestDistForToken = 0; tokenMatchedField = 'tag'; }
            } else {
              const dist = fuzzySubstringDistance(token, t);
              if (dist < bestDistForToken) { bestDistForToken = dist; tokenMatchedField = 'tag'; }
            }
          }

          // 2. Check Name
          if (isShort) {
             if (nameToMatch === token || nameToMatch.includes(token)) {
               if (bestDistForToken > 0) { bestDistForToken = 0; tokenMatchedField = 'name'; }
             }
          } else {
             const distName = fuzzySubstringDistance(token, nameToMatch);
             if (distName < bestDistForToken) { bestDistForToken = distName; tokenMatchedField = 'name'; }
          }

          // 3. Check Content (skip if tag priority search)
          if (!isTagSearch) {
            if (isShort) {
               if (contentToMatch.includes(token)) {
                 if (bestDistForToken > 0) { bestDistForToken = 0; tokenMatchedField = 'content'; }
               }
            } else {
               const distContent = fuzzySubstringDistance(token, contentToMatch);
               if (distContent < bestDistForToken) { bestDistForToken = distContent; tokenMatchedField = 'content'; }
            }
          }

          if (bestDistForToken > 2) {
            isMatch = false;
            break;
          }

          minEditDist = Math.min(minEditDist, bestDistForToken);

          if (!fuzzyMatchedField) fuzzyMatchedField = tokenMatchedField;
          else if (fuzzyMatchedField !== 'name' && tokenMatchedField === 'name') fuzzyMatchedField = 'name';
          else if (fuzzyMatchedField === 'content' && tokenMatchedField === 'tag') fuzzyMatchedField = 'tag';
        }

        if (isMatch) {
           score = 30 - minEditDist * 10;
           if (fuzzyMatchedField === 'name') score += 20;
           if (fuzzyMatchedField === 'tag') score += 10;
           if (nameToMatch === searchStr) score += 30;
           matchedField = fuzzyMatchedField;
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
