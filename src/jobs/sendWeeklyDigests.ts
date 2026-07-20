import { sendWeeklyDigests } from '../digest/weeklyDigest.js';

const digests = await sendWeeklyDigests();
console.log(`Sent ${digests.length} StudyBridge weekly digest(s).`);
for (const digest of digests) {
  console.log(`- ${digest.studentPhone}: ${digest.weakTopics.map((topic) => topic.topicId).join(', ')}`);
}
