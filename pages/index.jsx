import React, { useState } from 'react';

export default function Home() {
  const [name, setName] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [tone, setTone] = useState('convaincant');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, imageUrl, tone })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Erreur serveur');
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{ fontFamily: 'system-ui, sans-serif', padding: 24, maxWidth: 900, margin: '0 auto' }}>
      <h1>StudioAI — Générateur de fiche produit (MVP)</h1>
      <p>Entrez le nom du produit et (optionnel) une image. Clique sur Générer.</p>

      <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 12, marginTop: 18 }}>
        <label>
          Nom du produit
          <input value={name} onChange={e => setName(e.target.value)} required style={{ width: '100%', padding: 8, marginTop: 6 }} />
        </label>

        <label>
          URL image (optionnel)
          <input value={imageUrl} onChange={e => setImageUrl(e.target.value)} style={{ width: '100%', padding: 8, marginTop: 6 }} />
        </label>

        <label>
          Tonalité
          <select value={tone} onChange={e => setTone(e.target.value)} style={{ width: '100%', padding: 8, marginTop: 6 }}>
            <option value="convaincant">Convaincant / Conversion</option>
            <option value="informatif">Informatif</option>
            <option value="luxe">Luxe / Premium</option>
          </select>
        </label>

        <div>
          <button type="submit" disabled={loading} style={{ padding: '10px 16px' }}>{loading ? 'Génération...' : 'Générer la fiche'}</button>
        </div>
      </form>

      {error && <div style={{ marginTop: 12, color: 'crimson' }}>Erreur: {error}</div>}

      {result && (
        <section style={{ marginTop: 24, padding: 16, border: '1px solid #eee', borderRadius: 8 }}>
          <h2>Résultat</h2>
          <h3>{result.title}</h3>
          <p><strong>Meta (SEO):</strong> {result.meta}</p>
          <p><strong>Mots-clés:</strong> {result.keywords.join(', ')}</p>
          <div style={{ marginTop: 12 }}>
            <h4>Description</h4>
            <p style={{ whiteSpace: 'pre-wrap' }}>{result.description}</p>
          </div>
          <div style={{ marginTop: 12 }}>
            <button onClick={() => navigator.clipboard.writeText(JSON.stringify(result))}>Copier JSON</button>
          </div>
        </section>
      )}
    </main>
  );
}