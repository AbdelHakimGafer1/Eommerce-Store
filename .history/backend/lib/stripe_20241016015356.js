import Stripe from "stripe";
import dotenv from "dotenv";

dotenv.config();

export const stripe = new Stripe('sk_test_51QAJUk03y3Lg8NsPJgMMvVpGD9YXFG2e5WbPzSt87BWIwPiMACJWySw2TsodZmIo0YCfGboFF3sNRGrwmTTvevWm00Mu11TvO9');
