const express = require('express');
const axios = require('axios');
const line = require('@line/bot-sdk');
const bodyParser = require('body-parser');
require('dotenv').config();

const client = new line.Client({
  channelAccessToken: process.env.LINE_ACCESS_TOKEN,
  channelSecret: process.env.LINE_SECRET
});

const app = express();

// ✅ ต้องใส่ raw body ไว้ก่อน middleware LINE
app.post('/webhook',
  bodyParser.raw({ type: '*/*' }),
  line.middleware(client.config),
  async (req, res) => {
    const events = req.body.events;

    for (const event of events) {
      if (event.type === 'message' && event.message.type === 'text') {
        const msg = event.message.text.toLowerCase();

        if (msg.includes('offline')) {
          try {
            const response = await axios.get(process.env.SHEET_WEBHOOK_URL);
            const cameras = response.data.cameras;

            const offlineCams = cameras.filter(c =>
              (c.status || c.Status)?.toLowerCase() === 'offline'
            );

            const replyText = offlineCams.length === 0
              ? "✅ ขณะนี้ไม่มีกล้อง offline ครับ"
              : "📷 กล้อง offline:\n" + offlineCams.map(c => `- ${c.camera_name}`).join('\n');

            await client.replyMessage(event.replyToken, {
              type: 'text',
              text: replyText
            });
          } catch (err) {
            console.error("Fetch camera error:", err.message);
            await client.replyMessage(event.replyToken, {
              type: 'text',
              text: 'เกิดข้อผิดพลาดในการดึงข้อมูลกล้อง ❌'
            });
          }
        } else {
          await client.replyMessage(event.replyToken, {
            type: 'text',
            text: 'พิมพ์ "กล้องไหน offline" เพื่อดูสถานะกล้องครับ'
          });
        }
      }
    }

    res.status(200).send('OK');
  }
);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on ${PORT}`);
});
