import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const repoUrl = 'https://github.com/snehasishroy/leetcode-companywise-interview-questions.git';
const tempDir = path.join(__dirname, '..', '.temp_data');
const outPath = path.join(__dirname, '..', 'src', 'data', 'problems.json');
const topicsPath = path.join(__dirname, '..', 'src', 'data', 'topics.json');

// Ensure data directory exists
const dataDir = path.dirname(outPath);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Clean up any existing temp dir
if (fs.existsSync(tempDir)) {
  fs.rmSync(tempDir, { recursive: true, force: true });
}

console.log(`Cloning original dataset from ${repoUrl}...`);
try {
  execSync(`git clone --depth 1 ${repoUrl} ${tempDir}`, { stdio: 'inherit' });
} catch (error) {
  console.error("Failed to clone repository:", error);
  process.exit(1);
}

const problemsMap = new Map();
const datasetPath = tempDir;

try {
  if (!fs.existsSync(datasetPath)) {
    throw new Error(`Dataset path not found: ${datasetPath}`);
  }

  const companies = fs.readdirSync(datasetPath);
  console.log(`Processing ${companies.length} companies...`);

  for (const company of companies) {
    const companyPath = path.join(datasetPath, company);
    if (fs.statSync(companyPath).isDirectory() && !company.startsWith('.')) {
      const timeframes = [
        { file: 'thirty-days.csv', label: '30 days' },
        { file: 'three-months.csv', label: '3 months' },
        { file: 'six-months.csv', label: '6 months' },
        { file: 'more-than-six-months.csv', label: 'Older' },
        { file: 'all.csv', label: 'All' }
      ];
      
      for (const { file, label } of timeframes) {
        const csvPath = path.join(companyPath, file);
        if (fs.existsSync(csvPath)) {
          const content = fs.readFileSync(csvPath, 'utf8');
          const lines = content.split('\n');
          
          for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;
            
            const matches = [...line.matchAll(/(?:^|,)(?:"([^"]*)"|([^,]*))/g)];
            if (matches.length >= 6) {
              const id = (matches[0][1] || matches[0][2])?.trim();
              const url = (matches[1][1] || matches[1][2])?.trim();
              const title = (matches[2][1] || matches[2][2])?.trim();
              const difficulty = (matches[3][1] || matches[3][2])?.trim();
              const acceptance = (matches[4][1] || matches[4][2])?.trim();
              const frequency = (matches[5][1] || matches[5][2])?.trim();

              if (!id || id === 'ID') continue;

              if (!problemsMap.has(id)) {
                problemsMap.set(id, {
                  id: parseInt(id),
                  url,
                  title,
                  difficulty,
                  acceptance,
                  topics: [], // To be populated later
                  companies: []
                });
              }
              
              const prob = problemsMap.get(id);
              const existingComp = prob.companies.find(c => c.name === company);
              
              // Only add if it doesn't exist, this way we keep the most specific timeframe
              // since we iterate from 30 days -> 3 months -> 6 months
              if (!existingComp) {
                prob.companies.push({ 
                  name: company, 
                  frequency: parseFloat(frequency) || 0,
                  timeframe: label
                });
              }
            }
          }
        }
      }
    }
  }

  const problemsArray = Array.from(problemsMap.values());
  problemsArray.sort((a, b) => a.id - b.id);

  // Load topics if available
  let topicsMap = {};
  if (fs.existsSync(topicsPath)) {
    try {
      topicsMap = JSON.parse(fs.readFileSync(topicsPath, 'utf8'));
    } catch (e) {
      console.warn("Could not read topics.json, topics will be empty.");
    }
  }

  // Sort companies for each problem by frequency descending, and attach topics
  for (const prob of problemsArray) {
    prob.companies.sort((a, b) => b.frequency - a.frequency);
    prob.topics = topicsMap[prob.id.toString()] || [];
  }

  // Write to output file
  fs.writeFileSync(outPath, JSON.stringify(problemsArray, null, 2));
  console.log(`Successfully aggregated ${problemsArray.length} problems to ${outPath}`);

} catch (error) {
  console.error("Error processing dataset:", error);
} finally {
  // Clean up
  console.log('Cleaning up temp directory...');
  if (fs.existsSync(tempDir)) {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
}
