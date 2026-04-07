const TOKENS = [
  process.env.COMPANYCAM_API_TOKEN_BALTIMORE,
  process.env.COMPANYCAM_API_TOKEN_LANCASTER
].filter(Boolean) as string[];

const BASE_URL = 'https://api.companycam.com/v2';
const COMPANYCAM_MODE = (process.env.COMPANYCAM_MODE || '').toLowerCase();

async function ccFetch(endpoint: string, token: string) {
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`CompanyCam API error ${res.status}: ${text}`);
  }
  return res.json();
}

export interface CCProject {
  id: string;
  name: string;
  address?: {
    street_address_1?: string;
    city?: string;
    state?: string;
  };
  created_at: number;
  updated_at: number;
}

export interface CCPhoto {
  id: string;
  uri: string;
  urls: {
    original: string;
    thumbnail: string;
  };
  uris?: Array<{ type: string; uri: string }>;
  captured_at: number;
  created_at: number;
  photo_url?: string;
}

export function isCompanyCamConfigured(): boolean {
  if (COMPANYCAM_MODE === 'mock') return false;
  return TOKENS.length > 0;
}

export function buildMockProject(storeNumber: string, woNumber?: string): CCProject {
  const now = Date.now();
  return {
    id: `mock:${storeNumber}:${woNumber || 'pending'}`,
    name: `Starbucks #${storeNumber}${woNumber ? ` WO# ${woNumber}` : ' (mock project)'}`,
    created_at: now,
    updated_at: now,
  };
}

export function buildMockPhotos(storeNumber: string, woNumber?: string): CCPhoto[] {
  const labels = [
    'Front Door',
    'Before 1',
    'Before 2',
    'After 1',
    'After 2',
  ];

  return labels.map((label, index) => {
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="1200" height="900">
        <rect width="100%" height="100%" fill="#0f172a" />
        <rect x="35" y="35" width="1130" height="830" rx="24" fill="#111827" stroke="#00A4C7" stroke-width="8" />
        <text x="50%" y="38%" font-family="Arial, Helvetica, sans-serif" font-size="54" text-anchor="middle" fill="#e5e7eb">CompanyCam Mock Photo</text>
        <text x="50%" y="49%" font-family="Arial, Helvetica, sans-serif" font-size="42" text-anchor="middle" fill="#00A4C7">Starbucks #${storeNumber}</text>
        <text x="50%" y="58%" font-family="Arial, Helvetica, sans-serif" font-size="34" text-anchor="middle" fill="#cbd5e1">${woNumber ? \`WO# \${woNumber}\` : 'No WO# entered yet'}</text>
        <text x="50%" y="69%" font-family="Arial, Helvetica, sans-serif" font-size="46" text-anchor="middle" fill="#f8fafc">${label}</text>
      </svg>`;
    const uri = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
    return {
      id: `mock-photo-${index + 1}`,
      uri,
      urls: {
        original: uri,
        thumbnail: uri,
      },
      uris: [{ type: 'original', uri }],
      captured_at: Date.now(),
      created_at: Date.now(),
      photo_url: uri,
    };
  });
}

/**
 * Search CompanyCam projects by query string across all configured accounts
 */
export async function searchProjects(query: string): Promise<CCProject[]> {
  const encoded = encodeURIComponent(query);
  const allResults: CCProject[] = [];
  
  for (const token of TOKENS) {
    try {
      const res = await ccFetch(`/projects?query=${encoded}&per_page=25`, token);
      allResults.push(...res);
    } catch (err) {
      console.error('Error fetching projects from a CompanyCam account:', err);
    }
  }
  
  return allResults;
}

export async function findStarbucksProject(
  storeNumber: string,
  woNumber?: string
): Promise<CCProject | null> {
  if (woNumber) {
    const exactQuery = `Starbucks #${storeNumber} WO# ${woNumber}`;
    const exactResults = await searchProjects(exactQuery);
    const exactMatch = exactResults.find((p) => p.name.includes(`#${storeNumber}`) && p.name.includes(woNumber));
    if (exactMatch) return exactMatch;
  }

  const storeQuery = `Starbucks #${storeNumber}`;
  const storeResults = await searchProjects(storeQuery);
  const matches = storeResults.filter((p) => p.name.includes(`#${storeNumber}`));

  if (matches.length === 0) return null;

  if (woNumber) {
    const woMatch = matches.find((p) => p.name.includes(woNumber));
    if (woMatch) return woMatch;
  }

  matches.sort((a, b) => b.updated_at - a.updated_at);
  return matches[0];
}

export async function getProjectPhotos(projectId: string, perPage = 50): Promise<CCPhoto[]> {
  let lastError = null;
  
  // Try all tokens until one works, since we don't know which account owns this project ID
  for (const token of TOKENS) {
    try {
      return await ccFetch(`/projects/${projectId}/photos?per_page=${perPage}`, token);
    } catch (err) {
      lastError = err;
      continue;
    }
  }
  
  throw new Error(`Failed to fetch photos. Project ${projectId} may not exist in any configured CompanyCam account. (${lastError})`);
}

export async function downloadPhotoAsBase64(photoUrl: string): Promise<{ base64: string; contentType: string }> {
  const res = await fetch(photoUrl);
  if (!res.ok) throw new Error(`Failed to download photo: ${res.status}`);
  const buffer = await res.arrayBuffer();
  const contentType = res.headers.get('content-type') || (photoUrl.startsWith('data:image/svg+xml') ? 'image/svg+xml' : 'image/jpeg');
  const base64 = Buffer.from(buffer).toString('base64');
  return { base64, contentType };
}
