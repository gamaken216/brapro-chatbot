const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
const OpenAI = require('openai');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

async function searchKnowledge(query) {
  try {
    const embeddingResponse = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: query
    });
    const queryEmbedding = embeddingResponse.data[0].embedding;

    const { data, error } = await supabase.rpc('match_knowledge', {
      query_embedding: queryEmbedding,
      match_threshold: 0.5,
      match_count: 5
    });

    if (error) {
      console.error('Vector search error:', error);
      const { data: fallback } = await supabase
        .from('knowledge')
        .select('content, url')
        .limit(5);
      return fallback || [];
    }
    return data || [];
  } catch (err) {
    console.error('Search error:', err);
    return [];
  }
}

app.post('/api/chat', async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) {
      return res.status(400).json({ error: 'メッセージがありません' });
    }

    const knowledge = await searchKnowledge(message);
    const context = knowledge.map(k => k.content).join('\n\n');

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `あなたはブラジルプロポリス専門店「ブラプロ（Copal Bussan Co., Ltd.）」のカスタマーサポートです。
お客様の質問に以下の参考情報をもとに、丁寧な日本語で回答してください。
参考情報にない内容については「詳しくはお電話（フリーダイヤル：0120-262-862）でお問い合わせください」とご案内ください。
回答は簡潔にまとめ、必要に応じて箇条書きを使ってください。

【参考情報】
${context || '関連情報が見つかりませんでした。一般的な知識でお答えします。'}`
        },
        {
          role: "user",
          content: message
        }
      ],
      max_tokens: 600,
      temperature: 0.7
    });

    res.json({ reply: completion.choices[0].message.content });
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ error: 'エラーが発生しました。しばらくしてから再度お試しください。' });
  }
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

const PORT = process.env.PORT || 3000;

// ナレッジ登録エンドポイント
app.get('/admin/reload', async (req, res) => {
  try {
    console.log('ナレッジ登録開始...');
    await loadKnowledge();
    res.send('ナレッジ登録完了！');
  } catch(e) {
    console.error('エラー:', e.message);
    res.status(500).send('エラー: ' + e.message);
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
