async function run() {
  const query = `
    query problemsetQuestionList($categorySlug: String, $limit: Int, $skip: Int, $filters: QuestionListFilterInput) {
      problemsetQuestionList: questionList(categorySlug: $categorySlug limit: $limit skip: $skip filters: $filters) {
        data {
          frontendQuestionId: questionFrontendId
          title
          titleSlug
          freqBar
        }
      }
    }
  `;
  const res = await fetch("https://leetcode.com/graphql", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      query,
      variables: { categorySlug: "", skip: 0, limit: 2, filters: {} }
    })
  });
  const data = await res.json();
  console.log(JSON.stringify(data.data.problemsetQuestionList.data, null, 2));
}
run();
