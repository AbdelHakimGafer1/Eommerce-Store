import Stripe from "stripe";
import dotenv from "dotenv";

dotenv.config();

export const stripe = new Stripe('sk_test_51PwjF8FY2tZyjEmOAyNYGsIqkP11QvqmqVzFs6KHLyovefKojj6isSdehOnTfRokXiTXdT9ASHsTSNEKRbqrbzxZ0072feSIXh');
