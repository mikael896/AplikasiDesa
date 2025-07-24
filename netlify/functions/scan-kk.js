exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }

  const apiKey = process.env.GOOGLE_AI_API_KEY;
  if (!apiKey) {
    return { statusCode: 500, body: JSON.stringify({ error: 'API Key for Google AI is not configured.' }) };
  }

  try {
    const { imageData } = JSON.parse(event.body);
    if (!imageData) {
      return { statusCode: 400, body: JSON.stringify({ error: 'No image data provided.' }) };
    }

    const prompt = `Dari gambar Kartu Keluarga (KK) ini, ekstrak informasi untuk SETIAP anggota keluarga yang ada di dalam tabel. Kembalikan dalam format JSON yang valid berupa sebuah array/list. Setiap item dalam array adalah sebuah objek yang merepresentasikan satu orang, dengan properti berikut: no_kk, nik, nama, tglLahir (format YYYY-MM-DD), jenisKelamin, agama, pekerjaan, status_perkawinan, dan status_dalam_keluarga. Pastikan no_kk diisi untuk setiap anggota keluarga. Jika ada data yang tidak jelas di salah satu kolom, biarkan stringnya kosong.`;
    
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
          type: "ARRAY",
          items: {
            type: "OBJECT",
            properties: {
                "no_kk": { "type": "STRING" },
                "nik": { "type": "STRING" },
                "nama": { "type": "STRING" },
                "tglLahir": { "type": "STRING" },
                "jenisKelamin": { "type": "STRING" },
                "agama": { "type": "STRING" },
                "pekerjaan": { "type": "STRING" },
                "status_perkawinan": { "type": "STRING" },
                "status_dalam_keluarga": { "type": "STRING" }
            }
          }
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
        return { statusCode: response.status, body: JSON.stringify({ error: `Google AI Error: ${errorBody}` }) };
    }

    const result = await response.json();
    
    return {
      statusCode: 200,
      body: JSON.stringify(result)
    };

  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};
