import dotenv from 'dotenv';
dotenv.config();

export async function generateContent({ prompt, systemInstruction }) {
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.GEMINI_API;
  const OMNIROUTE_API = process.env.OMNIROUTE_API;

  // Strategy 1: Direct Gemini API Call
  if (GEMINI_API_KEY) {
    // Try primary recommended fast model and secondary candidate if needed
    const candidateModels = ['gemini-3.6-flash', 'gemini-3.5-flash', 'gemini-2.5-flash'];
    for (const modelName of candidateModels) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${GEMINI_API_KEY}`;
        
        const contents = [];
        const parts = [];

        if (systemInstruction) {
          parts.push({ text: `System Instruction: ${systemInstruction}\n\n` });
        }

        parts.push({ text: prompt });
        contents.push({ parts });

        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents }),
        });

        if (response.ok) {
          const data = await response.json();
          const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text) {
            // Friendly model badge
            const formattedModelName = modelName
              .replace('gemini-', 'Gemini ')
              .replace('-flash', ' Flash')
              .replace('-pro', ' Pro');
            return {
              text,
              model: formattedModelName,
            };
          }
        } else {
          const errText = await response.text();
          console.warn(`[OmniRoute] Direct Gemini call (${modelName}) failed (${response.status}):`, errText);
        }
      } catch (e) {
        console.warn(`[OmniRoute] Direct Gemini call (${modelName}) error:`, e.message);
      }
    }
  }

  // Strategy 2: Local OmniRoute Instance Fallback (OpenAI compatible)
  if (OMNIROUTE_API) {
    try {
      const localOmniRouteUrl = 'http://localhost:20128/v1/chat/completions';
      const targetModel = 'claude-3-7-sonnet';
      const res = await fetch(localOmniRouteUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OMNIROUTE_API}`,
        },
        body: JSON.stringify({
          model: targetModel,
          messages: [
            ...(systemInstruction ? [{ role: 'system', content: systemInstruction }] : []),
            { role: 'user', content: prompt }
          ],
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const text = data.choices?.[0]?.message?.content;
        const respondedModel = data.model || targetModel;
        if (text) {
          return {
            text,
            model: `OmniRoute / ${respondedModel}`,
          };
        }
      } else {
        const errText = await res.text();
        console.warn(`[OmniRoute] Local OmniRoute instance failed (${res.status}):`, errText);
      }
    } catch (e) {
      console.warn('[OmniRoute] Local OmniRoute instance request error:', e.message);
    }
  }

  // If both direct Gemini and OmniRoute fail, throw a clear error instead of returning fake content
  throw new Error('AI analysis is temporarily unavailable, please try again');
}

