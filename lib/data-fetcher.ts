'use cache';

import { getComponentByPath, getSampleDataUrl } from './registry-data';
import { getTransformForPath } from './data-transforms';

/**
 * Server-side data fetcher optimized with Next.js 16 'use cache'.
 * This caches the fully transformed data for each component.
 */
export async function getCachedComponentData(path: string) {
    const meta = getComponentByPath(path);
    if (!meta) return null;

    try {
        const url = getSampleDataUrl(meta.sampleData);
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Failed to fetch: ${response.statusText}`);

        let jsonData;
        if (meta.sampleData.endsWith('.csv')) {
            const text = await response.text();
            const lines = text.trim().split('\n');
            const headers = lines[0].split(',').map(h => h.trim());
            jsonData = lines.slice(1).map(line => {
                const values = line.split(',');
                const obj: any = {};
                headers.forEach((h, i) => obj[h] = values[i]?.trim());
                return obj;
            });
        } else {
            jsonData = await response.json();
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
