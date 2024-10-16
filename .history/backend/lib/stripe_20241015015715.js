import Stripe from "stripe";
import dotenv from "dotenv";

dotenv.config();

export const stripe = new Stripe('sk_test_51Pwft5E6Hb1hYqAHYCs3S1Yvtu8uYJqHWccMoAwtJLG5V4PPhrcqXv1jKAGo4z1NRk19vOiffiYgRBhvztxG6aQT00SBKSoV3W');
