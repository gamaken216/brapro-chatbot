const { createClient } = require('@supabase/supabase-js');
const OpenAI = require('openai');
const https = require('https');
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});
const urls = [
  'https://www.brapro.jp/chatbot1.html',
  'https://www.brapro.jp/QandA/',
  'https://www.brapro.jp/safety/',
  'https://www.brapro.jp/guide/',
  'https://www.brapro.jp/product/',
  'https://www.brapro.jp/kodawari/',
];
async function fetchPage(url) {
  return new Promise((resolve) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const text = data
          .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
          .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
          .replace(/<[^>]+>/g, ' ')
          .replace(/\s+/g, ' ')
          .trim()
          .substring(0, 3000);
        resolve(text);
      });
    }).on('error', (e) => {
      console.error(`Error fetching ${url}:`, e.message);
      resolve('');
    });
  });
}
async function registerKnowledge(url, content) {
  if (!content) return;
  try {
    const embeddingResponse = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: content.substring(0, 8000)
    });
    const embedding = embeddingResponse.data[0].embedding;
    const { error } = await supabase
      .from('knowledge')
      .upsert({ url, content, embedding }, { onConflict: 'url' });
    if (error) {
      console.error(`DB error for ${url}:`, error);
    } else {
      console.log(`✅ 登録完了: ${url}`);
    }
  } catch (e) {
    console.error(`Error processing ${url}:`, e.message);
  }
}
async function main() {
  console.log('ナレッジ登録を開始します...\n');
  for (const url of urls) {
    console.log(`📄 取得中: ${url}`);
    const content = await fetchPage(url);
    if (content) {
      await registerKnowledge(url, content);
    } else {
      console.log(`⚠️  コンテンツなし: ${url}`);
    }
    await new Promise(r => setTimeout(r, 1000));
  }
  console.log('\n✨ 全て完了しました！');
}

module.exports = { loadKnowledge: main };
