import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const repoPath = path.join(__dirname, '..', '..', 'leetcode-dataset-repo');
const outPath = path.join(__dirname, '..', 'src', 'data', 'problems.json');

// Ensure data directory exists
const dataDir = path.dirname(outPath);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const problemsMap = new Map();

try {
  const companies = fs.readdirSync(repoPath);

  for (const company of companies) {
    const companyPath = path.join(repoPath, company);
    if (fs.statSync(companyPath).isDirectory() && !company.startsWith('.')) {
      const allCsvPath = path.join(companyPath, 'all.csv');
      
      if (fs.existsSync(allCsvPath)) {
        const content = fs.readFileSync(allCsvPath, 'utf8');
        const lines = content.split('\n');
        
        // Skip header line
        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue;
          
          const matches = [...line.matchAll(/(?:^|,)(?:"([^"]*)"|([^,]*))/g)];
          
          if (matches.length >= 6) {
            const id = (matches[0][1] || matches[0][2]).trim();
            const url = (matches[1][1] || matches[1][2]).trim();
            const title = (matches[2][1] || matches[2][2]).trim();
            const difficulty = (matches[3][1] || matches[3][2]).trim();
            const acceptance = (matches[4][1] || matches[4][2]).trim();
            const frequency = (matches[5][1] || matches[5][2]).trim();

            if (!id || id === 'ID') continue;

            if (!problemsMap.has(id)) {
              problemsMap.set(id, {
                id: parseInt(id),
                url,
                title,
                difficulty,
                acceptance,
                companies: []
              });
            }
            
            const prob = problemsMap.get(id);
            if (!prob.companies.some(c => c.name === company)) {
              prob.companies.push({ name: company, frequency: parseFloat(frequency) || 0 });
            }
          }
        }
      }
    }
  }

  const finalProblems = Array.from(problemsMap.values());
  finalProblems.sort((a, b) => a.id - b.id);
  
  finalProblems.forEach(p => {
    p.companies.sort((a, b) => b.frequency - a.frequency);
  });

  fs.writeFileSync(outPath, JSON.stringify(finalProblems, null, 2));
  console.log(`Successfully aggregated ${finalProblems.length} problems to ${outPath}`);

} catch (error) {
  console.error("Error processing dataset:", error);
}
