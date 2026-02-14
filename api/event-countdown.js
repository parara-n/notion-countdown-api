// api/event-countdown.js
export default async function handler(req, res) {
  try {
    const NOTION_TOKEN = process.env.NOTION_TOKEN;
    const DATABASE_ID = process.env.DATABASE_ID;
    const API_KEY = process.env.API_KEY; // 合言葉
    const DATE_PROP = "開催日";

    // 合言葉チェック（ブラウザ側から ?key=xxx を付ける）
    if (API_KEY && req.query.key !== API_KEY) {
      return res.status(403).json({ error: "Forbidden" });
    }

    if (!NOTION_TOKEN || !DATABASE_ID) {
      return res.status(500).json({ error: "Missing env vars" });
    }

    const nowIso = new Date().toISOString();

    const notionRes = await fetch(
      `https://api.notion.com/v1/databases/${DATABASE_ID}/query`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${NOTION_TOKEN}`,
          "Notion-Version": "2022-06-28",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          filter: { property: DATE_PROP, date: { on_or_after: nowIso } },
          sorts: [{ property: DATE_PROP, direction: "ascending" }],
          page_size: 1,
        }),
      }
    );

    const data = await notionRes.json();
    if (!notionRes.ok) {
      return res.status(500).json({ error: "Notion API error", detail: data });
    }

    const item = data.results?.[0];
    if (!item) return res.status(200).json({ found: false });

    const dateValue = item.properties?.[DATE_PROP]?.date?.start;
    if (!dateValue) return res.status(500).json({ error: "開催日が空" });

    // 返す情報は最小（titleも返さない）
    return res.status(200).json({ found: true, date: dateValue });
  } catch (e) {
    return res.status(500).json({ error: "Server error", detail: String(e) });
  }
}
