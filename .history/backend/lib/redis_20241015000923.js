import Redis from "ioredis";
import dotenv from "dotenv";

dotenv.config();

export const redis = new Redis(process.env.UPSTASH_REDIS_URL,{
    password: process.env.UPSTASH_REDIS_PASSWORD,
    db: 0,
    tls: { rejectUnauthorized: false }, // for self-signed SSL certificates
    host: 'localhost', // أو أي مضيف تستخدمه لـ Redis
    port: 6379,        // منفذ Redis الافتراضي
    db: 0        
});
