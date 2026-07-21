import axios from 'axios';

const endpoint = 'http://localhost:3000/webhooks/twilio/whatsapp';
const payload = new URLSearchParams({
  Body: 'Solve x^2 - 5x + 6 = 0',
  From: 'whatsapp:+1234567890',
});

try {
  const response = await axios.post(endpoint, payload.toString(), {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    validateStatus: () => true,
  });
  console.log(`HTTP ${response.status}`);
  console.log(typeof response.data === 'string' ? response.data : JSON.stringify(response.data, null, 2));
} catch (error) {
  if (axios.isAxiosError(error)) {
    console.error('Request failed:', error.message);
    if (error.response) {
      console.error(`HTTP ${error.response.status}`);
      console.error(error.response.data);
    }
  } else {
    console.error(error);
  }
  process.exitCode = 1;
}
