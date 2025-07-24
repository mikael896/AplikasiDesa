exports.handler = async (event) => {
  // Hanya izinkan metode POST
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }

  // Ambil API Key dari environment variable di Netlify
  const apiKey = process.env.GOOGLE_AI_API_KEY;
  if (!apiKey) {
    return { statusCode: 500, body: JSON.stringify({ error: 'API Key for Google AI is not configured.' }) };
  }

  try {
    const { imageData } = JSON.parse(event.body);
    if (!imageData) {
      return { statusCode: 400, body: JSON.stringify({ error: 'No image data provided.' }) };
    }

    const prompt = `Dari gambar KTP ini, ekstrak informasi berikut dan kembalikan dalam format JSON yang valid: nik, nama, tglLahir (format YYYY-MM-DD), jenisKelamin, agama, pekerjaan. Jika ada data yang tidak jelas, biarkan string kosong.`;
    
    const payload = {
      contents: [{
        parts: [
          { text: prompt },
          { inline_data: { mime_type: "image/jpeg", data: imageData } }
        ]
      }],
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "OBJECT",
          properties: {
            "nik": { "type": "STRING" },
            "nama": { "type": "STRING" },
            "tglLahir": { "type": "STRING" },
            "jenisKelamin": { "type": "STRING" },
            "agama": { "type": "STRING" },
            "pekerjaan": { "type": "STRING" }
          },
        }
      }
    };

    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro-vision:generateContent?key=${apiKey}`;

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
        const errorBody = await response.text();
        // Kembalikan error dari Google AI agar bisa dibaca di depan
        return { statusCode: response.status, body: JSON.stringify({ error: `Google AI Error: ${errorBody}` }) };
    }

    const result = await response.json();
    
    // Kembalikan hasil yang sukses
    return {
      statusCode: 200,
      body: JSON.stringify(result)
    };

  } catch (error) {
    // Tangkap semua error lain dan laporkan
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};
