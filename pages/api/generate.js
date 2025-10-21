import fetch from 'node-fetch';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { name, imageUrl, tone } = req.body;
  if (!name) return res.status(400).json({ error: 'Missing product name' });

  try {
    const prompt = buildPrompt({ name, imageUrl, tone });

    const openaiRes = await fetch(process.env.OPENAI_API_BASE_URL ? `${process.env.OPENAI_API_BASE_URL}/chat/completions` : 'https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'Tu es un assistant expert en marketing e-commerce. Génère une fiche produit optimisée SEO en français.' },
          { role: 'user', content: prompt }
        ],
        max_tokens: 700,
        temperature: 0.6
      })
    });

    const data = await openaiRes.json();
    if (!openaiRes.ok) {
      console.error('OpenAI error', data);
      return res.status(500).json({ error: data.error?.message || 'OpenAI API error' });
    }

    const text = data.choices?.[0]?.message?.content || data.choices?.[0]?.text || '';
    // Parse expected JSON block if present
    const parsed = parseResponseText(text);

    return res.status(200).json(parsed);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
}

function buildPrompt({ name, imageUrl, tone }) {
  return `Génère POUR UN PRODUIT EN FRANÇAIS une sortie JSON uniquement (sans explication) avec les champs:\n- title (court, 5-10 mots),\n- meta (160 caractères max),\n- keywords (liste de 5 mots-clés),\n- description (3 paragraphes; premier paragraphe accroche, deuxième technique, troisième call-to-action).\n\nDonnées produit:\nNom: ${name}\nImage: ${imageUrl || 'aucune'}\nTonalité: ${tone}\n\nRéponds uniquement par un bloc JSON valide.`;
}

function parseResponseText(text) {
  // Essaye d'extraire le JSON d'un block dans le texte
  try {
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    if (start !== -1 && end !== -1) {
      const jsonText = text.slice(start, end + 1);
      const obj = JSON.parse(jsonText);
      return {
        title: obj.title || '',
        meta: obj.meta || '',
        keywords: obj.keywords || [],
        description: obj.description || ''
      };
    }
  } catch (e) {
    console.warn('Failed parse JSON, fallback to raw text');
  }
  // Fallback: return raw text in description
  return { title: nameSafe(text), meta: '', keywords: [], description: text };
}

function nameSafe(t) { return (t || '').slice(0, 60); }