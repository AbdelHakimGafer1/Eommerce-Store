import Coupon from "../models/coupon.model.js";
import Order from "../models/order.model.js";
import { stripe } from "../lib/stripe.js";

export const createCheckoutSession = async (req, res) => {
    try {
        const { products, couponCode } = req.body;

        // التحقق من أن مصفوفة المنتجات صحيحة
        if (!Array.isArray(products) || products.length === 0) {
            return res.status(400).json({ error: "Invalid or empty products array" });
        }

        let totalAmount = 0;

        // إنشاء lineItems المطلوبة بواسطة Stripe بناءً على المنتجات
        const lineItems = products.map((product) => {
            const amount = Math.round(product.price * 100); // تحويل السعر إلى سنتات
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

        // إدارة الكوبونات (إذا كان متاحاً)
        let coupon = null;
        if (couponCode) {
            coupon = await Coupon.findOne({ code: couponCode, userId: req.user._id, isActive: true });
            if (coupon) {
                const discountAmount = Math.round((totalAmount * coupon.discountPercentage) / 100);
                totalAmount -= discountAmount;
            }
        }

        // إنشاء جلسة Checkout مع Stripe
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

        // إنشاء كوبون جديد إذا تجاوز المبلغ 200 دولار (20000 سنت)
        if (totalAmount >= 20000) {
            await createNewCoupon(req.user._id);
        }

        // إرجاع معرف الجلسة والمبلغ الكلي
        res.status(200).json({ id: session.id, totalAmount: totalAmount / 100 });
    } catch (error) {
        console.error("Error processing checkout:", error);
        res.status(500).json({ message: "Error processing checkout", error: error.message });
    }
};

export const checkoutSuccess = async (req, res) => {
    try {
        const { sessionId } = req.body;
        const session = await stripe.checkout.sessions.retrieve(sessionId);

        if (session.payment_status === "paid") {
            // تعطيل الكوبون إذا كان مستخدماً
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

            // إنشاء طلب جديد (Order)
            const products = JSON.parse(session.metadata.products);
            const newOrder = new Order({
                user: session.metadata.userId,
                products: products.map((product) => ({
                    product: product.id,
                    quantity: product.quantity,
                    price: product.price,
                })),
                totalAmount: session.amount_total / 100, // تحويل المبلغ من سنتات إلى دولارات
                stripeSessionId: sessionId,
            });
console.log(stripeSessionId)
            await newOrder.save();

            // إرجاع نجاح العملية مع تفاصيل الطلب
            res.status(200).json({
                success: true,
                message: "Payment successful, order created, and coupon deactivated if used.",
                orderId: newOrder._id,
            });
        }
    } catch (error) {
        console.error("Error processing successful checkout:", error);
        res.status(500).json({ message: "Error processing successful checkout", error: error.message });
    }
};

// دالة لإنشاء كوبون في Stripe
async function createStripeCoupon(discountPercentage) {
    try {
        const coupon = await stripe.coupons.create({
            percent_off: discountPercentage,
            duration: "once",
        });
        return coupon.id;
    } catch (error) {
        console.error("Error creating Stripe coupon:", error);
        throw new Error("Failed to create Stripe coupon");
    }
}

// دالة لإنشاء كوبون جديد للمستخدم
async function createNewCoupon(userId) {
    try {
        // حذف أي كوبون سابق للمستخدم
        await Coupon.findOneAndDelete({ userId });

        const newCoupon = new Coupon({
            code: "GIFT" + Math.random().toString(36).substring(2, 8).toUpperCase(),
            discountPercentage: 10,
            expirationDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 يوم من الآن
            userId: userId,
        });

        await newCoupon.save();
        return newCoupon;
    } catch (error) {
        console.error("Error creating new coupon:", error);
        throw new Error("Failed to create new coupon");
    }
}
