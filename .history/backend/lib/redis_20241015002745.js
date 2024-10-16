import Redis from "ioredis";
import dotenv from "dotenv";

dotenv.config();

export const redis = new Redis(process.env.UPSTASH_REDIS_URL, {
  db: 0 // تأكد من استخدام قاعدة البيانات 0
});
