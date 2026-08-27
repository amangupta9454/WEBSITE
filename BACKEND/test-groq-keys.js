require('dotenv').config();

async function testKeys() {
  const keys = [
    process.env.GROQ_API_KEY,
    process.env.GROQ_API_KEY_2,
    process.env.GROQ_API_KEY_3,
    process.env.GROQ_API_KEY_4
  ].filter(Boolean);

  console.log(`Found ${keys.length} keys to test...`);

  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    try {
      const response = await fetch("https://api.groq.com/openai/v1/models", {
        headers: { "Authorization": `Bearer ${key}` }
      });
      const data = await response.json();
      if (response.ok) {
        console.log(`✅ Key ${i + 1} (${key.slice(0, 10)}...) is VALID`);
      } else {
        console.log(`❌ Key ${i + 1} (${key.slice(0, 10)}...) is INVALID. Error: ${data.error?.message || response.statusText}`);
      }
    } catch (e) {
      console.log(`❌ Key ${i + 1} failed network request: ${e.message}`);
    }
  }
}

testKeys();
