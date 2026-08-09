import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(dirname, "..");

function source(filename) {
  return fs.readFileSync(path.join(root, filename), "utf8");
}

test("job detail profile links target the participant shown in each row", () => {
  const jobDeepView = source("src/pages/JobDeepView/JobDeepView.jsx");
  const takerJobDetails = source("src/pages/TakerJobDetails/TakerJobDetails.jsx");

  assert.match(jobDeepView, /to=\{`\/profile\/\$\{job\.jobGiver\}`\}/);
  assert.match(jobDeepView, /to=\{`\/profile\/\$\{job\.selectedApplicant\}`\}/);
  assert.doesNotMatch(jobDeepView, /href="\/profile"/);

  assert.match(takerJobDetails, /to=\{`\/profile\/\$\{job\.employer\}`\}/);
  assert.match(takerJobDetails, /to=\{`\/profile\/\$\{job\.taker\}`\}/);
  assert.doesNotMatch(takerJobDetails, /href="\/profile"/);
});

test("profile job history reads every status instead of only in-progress jobs", () => {
  const jobService = source("src/services/jobService.js");

  assert.match(jobService, /const ALL_JOB_STATUSES = Object\.values\(JOB_STATUS\)/);
  assert.match(jobService, /getJobsByStatus\(status\)/);
  assert.match(jobService, /const allJobs = await getAllJobs\(\)/);
  assert.doesNotMatch(
    jobService,
    /export async function getUserJobs[\s\S]*?const allJobs = await getInProgressJobs\(\)/,
  );
});
