import { getComponentByPath, getSampleDataUrl } from './registry-data';
import { getTransformForPath } from './data-transforms';
import fs from 'fs';
import * as nodePath from 'path';

/**
 * Server-side data fetcher with fetch caching.
 * Uses Next.js built-in fetch cache for data requests.
 */
export async function getCachedComponentData(path: string) {
    const meta = getComponentByPath(path);
    if (!meta) return null;

    try {
        const url = getSampleDataUrl(meta.sampleData);
        let jsonData: any;

        if (url.startsWith('/')) {
            // Read from local filesystem for paths starting with /
            const filePath = nodePath.join(process.cwd(), 'public', url);
            if (!fs.existsSync(filePath)) {
                throw new Error(`Local file not found: ${filePath}`);
            }
            const content = fs.readFileSync(filePath, 'utf-8');
            if (meta.sampleData.endsWith('.csv')) {
                jsonData = parseCSVData(content);
            } else {
                jsonData = JSON.parse(content);
            }
        } else {
            // Fetch from external URL
            const response = await fetch(url, { next: { revalidate: 3600 } });
            if (!response.ok) throw new Error(`Failed to fetch: ${response.statusText}`);

            if (meta.sampleData.endsWith('.csv')) {
                const text = await response.text();
                jsonData = parseCSVData(text);
            } else {
                jsonData = await response.json();
            }
        }

        // Handle wrapped data format for BRFSS state components
        if (path.includes('brfss/state-bar') && jsonData.data) {
            jsonData = jsonData.data;
        }

        const transform = getTransformForPath(path);
        if (transform) {
            return transform(jsonData);
        }
        return jsonData;
    } catch (error) {
        console.error(`Error fetching data for ${path}:`, error);
        return null;
    }
}

/**
 * Helper to parse CSV text into objects
 */
function parseCSVData(text: string): any[] {
    const lines = text.trim().split('\n');
    if (lines.length < 2) return [];
    const headers = lines[0].split(',').map(h => h.trim());
    return lines.slice(1).map(line => {
        const values = line.split(',');
        const obj: any = {};
        headers.forEach((h, i) => obj[h] = values[i]?.trim());
        return obj;
    });
}
