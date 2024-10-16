import Coupon from "../models/coupon.model.js";
import Order from "../models/order.model.js";
import { stripe } from "../lib/stripe.js";

export const createCheckoutSession = async (req, res) => {
    try {
        const { products, couponCode } = req.body;

        // تحقق من صحة المنتجات
        if (!Array.isArray(products) || products.length === 0) {
            return res.status(400).json({ error: "Invalid or empty products array" });
        }

        let totalAmount = 0;

        // إنشاء العناصر المطلوبة بواسطة Stripe
        const lineItems = products.map((product) => {
            const amount = Math.round(product.price * 100); // تحويل إلى سنتات
            totalAmount += amount * product.quantity;

            return {
                price_data: {
                    currency: "usd",
                    product_data: {
                        name: product.name,
                        images: [product.image],
                    },
                    unit_amount: amount,
                },
                quantity: product.quantity || 1,
            };
        });

        // التحقق من الكوبون إذا تم تقديمه
        let coupon = null;
        if (couponCode) {
            coupon = await Coupon.findOne({ code: couponCode, userId: req.user._id, isActive: true });
            if (coupon) {
                const discountAmount = Math.round((totalAmount * coupon.discountPercentage) / 100);
                totalAmount -= discountAmount;
            }
        }

        // إنشاء جلسة Stripe Checkout
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ["card"],
            line_items: lineItems,
            mode: "payment",
            success_url: `${process.env.CLIENT_URL}/purchase-success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.CLIENT_URL}/purchase-cancel`,
            discounts: coupon
                ? [
                      {
                          coupon: await createStripeCoupon(coupon.discountPercentage),
                      },
                  ]
                : [],
            metadata: {
                userId: req.user._id.toString(),
                couponCode: couponCode || "",
                products: JSON.stringify(
                    products.map((p) => ({
                        id: p._id,
                        quantity: p.quantity,
                        price: p.price,
                    }))
                ),
            },
        });

        // إنشاء كوبون جديد إذا تجاوز المبلغ 200 دولار
        if (totalAmount >= 20000) {
            await createNewCoupon(req.user._id);
        }

        // إرجاع معرف الجلسة
        res.status(200).json({ id: session.id, totalAmount: totalAmount / 100 });
    } catch (error) {
        console.error("Error processing checkout:", error);
        res.status(500).json({ message: "Error processing checkout", error: error.message });
    }
};

export const checkoutSuccess = async (req, res) => {
    try {
        const { sessionId } = req.body;
        
        // تحقق من sessionId
        if (!sessionId) {
            return res.status(400).json({ error: "Missing session ID" });
        }

        // استرجاع الجلسة من Stripe
        const session = await stripe.checkout.sessions.retrieve(sessionId);

        if (session.payment_status === "paid") {
            // تعطيل الكوبون إذا تم استخدامه
            if (session.metadata.couponCode) {
                await Coupon.findOneAndUpdate(
                    {
                        code: session.metadata.couponCode,
                        userId: session.metadata.userId,
                    },
                    {
                        isActive: false,
                    }
                );
            }

            // إنشاء الطلب
            const products = JSON.parse(session.metadata.products);
            const newOrder = new Order({
                user: session.metadata.userId,
                products: products.map((product) => ({
                    product: product.id,
                    quantity: product.quantity,
                    price: product.price,
                })),
                totalAmount: session.amount_total / 100, // تحويل من سنتات إلى دولارات
                stripeSessionId: sessionId,
            });

            await newOrder.save();

            // إرجاع نجاح العملية
            res.status(200).json({
                success: true,
                message: "Payment successful, order created, and coupon deactivated if used.",
                orderId: newOrder._id,
            });
        } else {
            res.status(400).json({ message: "Payment not completed." });
        }
    } catch (error) {
        console.error("Error processing successful checkout:", error);
        res.status(500).json({ message: "Error processing successful checkout", error: error.message });
    }
};
