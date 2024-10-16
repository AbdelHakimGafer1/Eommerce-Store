import Stripe from "stripe";
import dotenv from "dotenv";

dotenv.config();

export const stripe = new Stripe('sk_test_51PyaPnP3O2fi0sORyNM9rkVsbHqDEHYsa7VN4L5NaNW9Vhwps1EKrdrRcMOgguGJavOH0sqCO9lXNIXESRWsyskm00BuyIrTiP');
