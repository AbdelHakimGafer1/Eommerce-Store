import Redis from "ioredis";
import dotenv from "dotenv";

dotenv.config();
console.log(process.env.UPSTASH_REDIS_URL)
export const redis = new Redis(process.env.UPSTASH_REDIS_URL, {
  db: 0 // تأكد من استخدام قاعدة البيانات 0
});
