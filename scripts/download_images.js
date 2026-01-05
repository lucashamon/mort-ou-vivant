import fs from 'fs';
import path from 'path';
import https from 'https';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_FILE = path.join(__dirname, '../data.json');
const IMAGES_DIR = path.join(__dirname, '../public/images');
const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36';

if (!fs.existsSync(IMAGES_DIR)) {
    fs.mkdirSync(IMAGES_DIR, { recursive: true });
}

const downloadImage = (url, filepath) => {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(filepath);
        const request = https.get(url, {
            headers: { 'User-Agent': USER_AGENT }
        }, (response) => {
            if (response.statusCode === 200) {
                response.pipe(file);
                file.on('finish', () => {
                    file.close(resolve);
                });
            } else if (response.statusCode === 301 || response.statusCode === 302) {
                // Follow redirect
                downloadImage(response.headers.location, filepath).then(resolve).catch(reject);
            } else {
                fs.unlink(filepath, () => reject(new Error(`Status Code: ${response.statusCode}`)));
            }
        });

        request.on('error', (err) => {
            fs.unlink(filepath, () => reject(err));
        });

        request.setTimeout(10000, () => {
            request.destroy();
            fs.unlink(filepath, () => reject(new Error('Timeout')));
        });
    });
};

async function processImages() {
    const rawData = fs.readFileSync(DATA_FILE);
    const people = JSON.parse(rawData);
    let successCount = 0;
    let failureCount = 0;
    const failures = [];

    for (const person of people) {
        if (person.photo && person.photo.startsWith('http')) {
            const ext = path.extname(person.photo).split('?')[0] || '.jpg';
            // Sanitize extension if needed, default to .jpg if weird
            const validExt = ['.jpg', '.jpeg', '.png', '.webp', '.gif'].includes(ext.toLowerCase()) ? ext : '.jpg';
            
            const filename = `${person.id}${validExt}`;
            const localPath = path.join(IMAGES_DIR, filename);
            const relativePath = `/images/${filename}`;

            console.log(`Downloading ${person.name} (${person.id})...`);
            
            try {
                await downloadImage(person.photo, localPath);
                person.photo = relativePath;
                successCount++;
            } catch (error) {
                console.error(`Failed to download for ${person.name}: ${error.message}`);
                failureCount++;
                failures.push({ id: person.id, name: person.name, url: person.photo, error: error.message });
                // We keep the original URL if download fails so I can find an alternative
            }
        } else if (person.photo && person.photo.startsWith('/images/')) {
             console.log(`Skipping ${person.name}, already local.`);
        }
    }

    fs.writeFileSync(DATA_FILE, JSON.stringify(people, null, 4));
    
    console.log('\n--- Summary ---');
    console.log(`Success: ${successCount}`);
    console.log(`Failures: ${failureCount}`);
    
    if (failures.length > 0) {
        console.log('\nFailed IDs (saved to failures.json):');
        failures.forEach(f => console.log(`- [${f.id}] ${f.name}: ${f.error}`));
        fs.writeFileSync(path.join(__dirname, 'failures.json'), JSON.stringify(failures, null, 2));
    }
}

processImages();
