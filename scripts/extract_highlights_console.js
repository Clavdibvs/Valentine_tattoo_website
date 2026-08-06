// ============================================================
// INSTAGRAM HIGHLIGHT EXTRACTOR
// Incolla questo script nella Console di Chrome DevTools
// (Cmd+Option+J) mentre sei su instagram.com loggato
// ============================================================

(async function extractHighlights() {
  const highlights = {
    'creazioni': '18138808534098679',
    'flash': '17907459131894011',
    'merch': '17859497229473696'
  };

  const csrfToken = document.cookie.match(/csrftoken=([^;]+)/)?.[1] || '';
  const results = {};
  let totalItems = 0;

  console.log('🔄 Inizio estrazione highlights...');
  console.log('CSRF Token:', csrfToken ? '✅ trovato' : '❌ non trovato');

  for (const [name, id] of Object.entries(highlights)) {
    console.log(`\n📂 Scaricamento highlight: ${name} (${id})...`);
    try {
      const response = await fetch(`/api/v1/feed/reels_media/?reel_ids=highlight%3A${id}`, {
        headers: {
          'X-CSRFToken': csrfToken,
          'X-Requested-With': 'XMLHttpRequest',
          'X-IG-App-ID': '936619743392459'
        },
        credentials: 'include'
      });

      if (!response.ok) {
        console.error(`❌ Errore HTTP ${response.status} per ${name}`);
        continue;
      }

      const data = await response.json();

      // Try multiple response formats
      let items = [];
      if (data.reels_media && data.reels_media.length > 0) {
        items = data.reels_media[0].items || [];
      } else if (data.reels && data.reels[`highlight:${id}`]) {
        items = data.reels[`highlight:${id}`].items || [];
      }

      // Get last 12 items
      const lastItems = items.slice(-12);
      results[name] = lastItems.map((item, idx) => {
        if (item.video_versions && item.video_versions.length > 0) {
          return {
            index: idx + 1,
            type: 'video',
            url: item.video_versions[0].url,
            width: item.video_versions[0].width,
            height: item.video_versions[0].height
          };
        } else if (item.image_versions2 && item.image_versions2.candidates) {
          const best = item.image_versions2.candidates[0];
          return {
            index: idx + 1,
            type: 'image',
            url: best.url,
            width: best.width,
            height: best.height
          };
        }
        return null;
      }).filter(Boolean);

      totalItems += results[name].length;
      console.log(`✅ ${name}: ${results[name].length} elementi trovati (${items.length} totali nel highlight)`);
      results[name].forEach(item => {
        console.log(`   ${item.index}. [${item.type}] ${item.width}x${item.height}`);
      });

    } catch (e) {
      console.error(`❌ Errore per ${name}:`, e);
      results[name] = [];
    }
  }

  console.log(`\n✅ TOTALE: ${totalItems} media trovati in ${Object.keys(results).length} highlights`);

  // Save as downloadable JSON file
  const blob = new Blob([JSON.stringify(results, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'highlight_urls.json';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);

  console.log('\n📥 File highlight_urls.json scaricato! Passalo allo script Python per il download.');
  return results;
})();
