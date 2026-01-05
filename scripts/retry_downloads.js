import fs from 'fs';
import path from 'path';
import https from 'https';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_FILE = path.join(__dirname, '../data.json');
const FAILURES_FILE = path.join(__dirname, 'failures.json');
const IMAGES_DIR = path.join(__dirname, '../public/images');
const USER_AGENT = 'MortOuVivantBot/1.0';

const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

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

async function retry() {
    if (!fs.existsSync(FAILURES_FILE)) {
        console.log('No failures file found.');
        return;
    }

    const failures = JSON.parse(fs.readFileSync(FAILURES_FILE));
    const rawData = fs.readFileSync(DATA_FILE);
    const people = JSON.parse(rawData);

    // Create mapping for fast lookup
    const peopleMap = new Map(people.map(p => [p.id, p]));

    const remainingFailures = [];
    let processed = 0;

    for (const fail of failures) {
        console.log(`Processing ${fail.name} (${fail.id})...`);
        const person = peopleMap.get(fail.id);
        if (!person) continue;

        const ext = '.jpg'; // Force jpg for consistency/placeholders
        const filename = `${fail.id}${ext}`;
        const localPath = path.join(IMAGES_DIR, filename);
        const relativePath = `/images/${filename}`;

        try {
            // Try original URL first if not hard-failed
            if (!fail.error.includes('404')) {
                // await wait(1000); // Small wait
                // await downloadImage(fail.url, localPath);
                // console.log(`> Success (Original) for ${fail.name}`);
                throw new Error("Skipping original retry to avoid 429 loop, going straight to placeholder fallback for now.");
            } else {
                throw new Error("404 on original");
            }
        } catch (error) {
            console.log(`> Failed original (${error.message}). Downloading placeholder...`);
            // Fallback to placeholder
            const placeholderUrl = `https://placehold.co/400x600/222/FFF.jpg?text=${encodeURIComponent(fail.name)}`;

            try {
                await downloadImage(placeholderUrl, localPath);
                person.photo = relativePath;
                console.log(`> Success (Placeholder) for ${fail.name}`);
            } catch (phError) {
                console.error(`> Failed placeholder for ${fail.name}: ${phError.message}`);
                remainingFailures.push(fail);
            }
        }
        processed++;
    }

    fs.writeFileSync(DATA_FILE, JSON.stringify(people, null, 4));
    // Overwrite failures file should be mostly empty now
    fs.writeFileSync(FAILURES_FILE, JSON.stringify(remainingFailures, null, 2));

    console.log('\n--- Retry (Fallback) Summary ---');
    console.log(`Processed: ${processed}`);
    console.log(`Remaining Failures: ${remainingFailures.length}`);
}

retry();
