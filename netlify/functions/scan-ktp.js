// File: netlify/functions/scan-ktp.js
exports.handler = async function(event) {
    const { imageData } = JSON.parse(event.body);
    const apiKey = process.env.GOOGLE_AI_API_KEY;

    if (!apiKey) {
        return { statusCode: 500, body: JSON.stringify({ error: "Kunci API tidak diatur di Netlify." }) };
    }

    const prompt = "Dari gambar KTP ini, ekstrak informasi berikut: NIK, Nama, Tanggal Lahir (dalam format YYYY-MM-DD), Jenis Kelamin, Agama, dan Pekerjaan. Jika informasi tidak ada, kembalikan string kosong.";
    const payload = {
        contents: [{ parts: [{ text: prompt }, { inlineData: { mimeType: "image/jpeg", data: imageData } }] }],
        generationConfig: {
            responseMimeType: "application/json",
            responseSchema: {
                type: "OBJECT",
                properties: { "nik": { "type": "STRING" }, "nama": { "type": "STRING" }, "tglLahir": { "type": "STRING" }, "jenisKelamin": { "type": "STRING" }, "agama": { "type": "STRING" }, "pekerjaan": { "type": "STRING" } }
            }
        }
    };
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

    try {
        const response = await fetch(apiUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        if (!response.ok) {
            const errorBody = await response.json();
            throw new Error(`API Error: ${errorBody.error?.message || 'Unknown error'}`);
        }
        const result = await response.json();
        return { statusCode: 200, body: JSON.stringify(result) };
    } catch (error) {
        return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
    }
};
