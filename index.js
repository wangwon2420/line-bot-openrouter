const express = require('express');
const axios = require('axios');
const line = require('@line/bot-sdk');
const bodyParser = require('body-parser');
require('dotenv').config();

const GAS_URL = "https://script.google.com/macros/s/AKfycbw0WGCkDuExqd-xkIDFUwattLWJGFTDf-AlRS1W5yOmT4a1F35S_pEQRi0BouBWJNw/exec";

const client = new line.Client({
  channelAccessToken: process.env.LINE_ACCESS_TOKEN,
  channelSecret: process.env.LINE_SECRET
});

const app = express();

app.post('/webhook',
  bodyParser.raw({ type: '*/*' }),
  line.middleware(client.config),
  async (req, res) => {
    const events = req.body.events;

    for (const event of events) {
      if (event.type === 'message' && event.message.type === 'text') {
        const msg = event.message.text.trim().toLowerCase();

        // ✅ ถ้าผู้ใช้ส่งพิกัด → ส่ง lat/long ไป GAS ด้วย
        if (event.message.type === 'location') {
          const lat = event.message.latitude;
          const lon = event.message.longitude;
          await axios.post(GAS_URL, {
            mode: "ask",
            lat: lat,
            long: lon,
            message: "หากล้องที่ใกล้ที่สุด"
          });
          return;
        }

        // ✅ ส่งคำถามที่เกี่ยวข้องกับกล้อง ไปยัง GAS (mode=ask)
        if (
          msg.includes("offline") ||
          msg.includes("online") ||
          msg.includes("map") ||
          msg.includes("พิกัด") ||
          msg.includes("กล้อง") ||
          msg.includes("แผนที่") ||
          msg.includes("ล่ม") ||
          msg.includes("ตำแหน่ง") ||
          msg.includes("ระยะทาง") ||
          msg.includes("กี่ตัว")
        ) {
          try {
            await axios.post(GAS_URL, {
              mode: "ask",
              message: event.message.text
            });
          } catch (err) {
            console.error("ส่งไป GAS ไม่สำเร็จ:", err.message);
            await client.replyMessage(event.replyToken, {
              type: 'text',
              text: '❌ ไม่สามารถเชื่อมต่อ GAS ได้'
            });
          }
        } else {
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
