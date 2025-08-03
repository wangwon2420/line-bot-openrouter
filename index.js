
const express = require('express');
const axios = require('axios');
const line = require('@line/bot-sdk');
require('dotenv').config();

const client = new line.Client({
  channelAccessToken: process.env.LINE_ACCESS_TOKEN,
  channelSecret: process.env.LINE_SECRET
});

const app = express();
app.use(express.json());

const GAS_URL = process.env.GAS_URL || "https://script.google.com/macros/s/YOUR_GAS_URL/exec";

app.post('/webhook',
  line.middleware(client.config),
  async (req, res) => {
    const events = req.body.events;
    for (const event of events) {
      if (event.type === 'message') {
        const msg = event.message.text.toLowerCase();
        let replied = false;

        if (msg.includes("offline") || msg.includes("online") ||
            msg.includes("แผนที่") || msg.includes("พิกัด") || msg.includes("กล้อง")) {
          try {
            await axios.post(GAS_URL, {
              mode: "ask",
              message: event.message.text
            });
            replied = true;
          } catch (err) {
            console.error("❌ GAS ไม่ตอบกลับ:", err.message);
            await client.replyMessage(event.replyToken, {
              type: 'text',
              text: 'เกิดข้อผิดพลาดขณะเชื่อมต่อระบบข้อมูลกล้อง ❌'
            });
            replied = true;
          }
        }

        if (!replied) {
          await client.replyMessage(event.replyToken, {
            type: 'text',
            text: '❓ โปรดพิมพ์คำถามเกี่ยวกับกล้อง เช่น "แผนที่", "กล้อง offline", "พิกัดกล้อง A"'
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
