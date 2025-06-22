import fs from 'fs/promises';
import path from 'path';
import { File } from 'buffer';

export async function getFile(_path) {
    const filePath = path.resolve(__dirname, _path);
    try {
        const fileContent = await fs.readFile(filePath);
        // Create File object with Buffer content
        return new File([fileContent], 'cat.json', { type: 'application/json' });
    } catch (e) {
        throw new Error(`Failed to read cat.json: ${e.message}`);
    }
}

export async function getFileAsJSON(_path) {
    const filePath = path.resolve(__dirname, _path);
    try {
        let content = await fs.readFile(filePath, 'utf8');
        // Parse the content as JSON
        return JSON.parse(content);
    } catch (e) {
        throw new Error(`Failed to read file as string: ${e.message}`);
    }
}