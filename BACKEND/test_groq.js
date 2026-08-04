require('dotenv').config();

async function test() {
  const prompt = `You are an expert ATS (Applicant Tracking System) Analyzer.
I will provide a parsed resume text below.
Please analyze it and provide:
1. An ATS Score out of 100 based on standard metrics (action verbs, quantifiable results, completeness, clarity).
2. A short array of 3-5 concise, highly actionable suggestions to improve the resume.

Output MUST be valid JSON in this exact format, with no markdown formatting or extra text outside the JSON:
{
  "score": 85,
  "suggestions": [
    "Include more quantifiable metrics in your experience section.",
    "Add a professional summary."
  ]
}

Resume Text:
Name: Himanshu Gupta
Email: himanshu561hi@gmail.com
Phone: 8090860670
`;

  try {
    const key = process.env.GROQ_API_KEY;
    if (!key) throw new Error("No key in .env");

    const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${key}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: "llama3-8b-8192",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.2,
        response_format: { type: "json_object" }
      })
    });

    if (!groqRes.ok) {
      console.log("Error status:", groqRes.status);
      console.log(await groqRes.text());
      return;
    }

    const responseData = await groqRes.json();
    console.log("Response:", JSON.stringify(responseData, null, 2));
    const content = responseData.choices[0].message.content;
    console.log("Content:", content);
    const parsed = JSON.parse(content);
    console.log("Parsed:", parsed);
  } catch (err) {
    console.error("Caught error:", err.message);
  }
}

test();
