import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const outPath = path.join(__dirname, '..', 'src', 'data', 'topics.json');

async function fetchTopics() {
  console.log('Fetching topics from LeetCode GraphQL...');
  const topicsMap = {};
  const limit = 100;
  let skip = 0;
  
  while (true) {
    console.log(`Fetching skip ${skip}...`);
    try {
      const query = `
        query problemsetQuestionList($categorySlug: String, $limit: Int, $skip: Int, $filters: QuestionListFilterInput) {
          problemsetQuestionList: questionList(categorySlug: $categorySlug limit: $limit skip: $skip filters: $filters) {
            data {
              frontendQuestionId: questionFrontendId
              topicTags { name }
            }
          }
        }
      `;
      const res = await fetch("https://leetcode.com/graphql", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query,
          variables: { categorySlug: "", skip, limit, filters: {} }
        })
      });
      const data = await res.json();
      const list = data?.data?.problemsetQuestionList?.data;
      if (!list || list.length === 0) break;
      
      for (const p of list) {
        topicsMap[p.frontendQuestionId] = p.topicTags.map(t => t.name);
      }
      skip += limit;
      // Sleep slightly to respect rate limits
      await new Promise(r => setTimeout(r, 500));
    } catch (e) {
      console.error('Error fetching from LeetCode:', e);
      break;
    }
  }
  
  fs.writeFileSync(outPath, JSON.stringify(topicsMap, null, 2));
  console.log(`Saved ${Object.keys(topicsMap).length} problem topics to src/data/topics.json`);
}

fetchTopics();
