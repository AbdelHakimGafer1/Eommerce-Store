import Redis from "ioredis";
import dotenv from "dotenv";

dotenv.config();

export const redis = new Redis(process.env.UPSTASH_REDIS_URL, {
  db: 0, // تأكد من أنك تستخدم قاعدة البيانات 0 فقط
  tls: {} // Upstash تستخدم TLS، لذلك نحتاج إلى تمكينه عند استخدام rediss://
});
