import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Confetti from "react-confetti";
import { CheckCircle, HandHeart, ArrowRight } from "react-icons/fa"; // تأكد من استيراد أيقوناتك
import axios from "axios";
import { useCartStore } from '../stores/useCartStore'; // استيراد المخزن الخاص بالعربة

const PurchaseSuccessPage = () => {
  const [isProcessing, setIsProcessing] = useState(true);
  const [error, setError] = useState(null);
  const [orderNumber, setOrderNumber] = useState(null); // إضافة رقم الطلب
  const { clearCart } = useCartStore();
  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const handleCheckoutSuccess = async (sessionId) => {
      try {
        const response = await axios.post("/payments/checkout-success", { sessionId });
        const { orderNumber } = response.data; // استخراج رقم الطلب من الـ response
        setOrderNumber(orderNumber); // تخزين رقم الطلب
        clearCart();
      } catch (error) {
        setError(error.response?.data?.message || "Something went wrong. Please try again.");
      } finally {
        setIsProcessing(false);
      }
    };

    const sessionId = new URLSearchParams(window.location.search).get("session_id");
    if (sessionId) {
      handleCheckoutSuccess(sessionId);
    } else {
      setIsProcessing(false);
      setError("No session ID found in the URL");
    }
  }, [clearCart]);

  if (isProcessing) return "Processing...";

  if (error) return `Error: ${error}`;

  return (
    <div className='h-screen flex items-center justify-center px-4'>
      <Confetti
        width={windowSize.width}
        height={windowSize.height}
        gravity={0.1}
        style={{ zIndex: 99 }}
        numberOfPieces={700}
        recycle={false}
      />

      <div className='max-w-md w-full bg-gray-800 rounded-lg shadow-xl overflow-hidden relative z-10'>
        <div className='p-6 sm:p-8'>
          <div className='flex justify-center'>
            <CheckCircle className='text-emerald-400 w-16 h-16 mb-4' />
          </div>
          <h1 className='text-2xl sm:text-3xl font-bold text-center text-emerald-400 mb-2'>
            Purchase Successful!
          </h1>

          <p className='text-gray-300 text-center mb-2'>
            Thank you for your order. {"We're"} processing it now.
          </p>
          <p className='text-emerald-400 text-center text-sm mb-6'>
            Check your email for order details and updates.
          </p>
          <div className='bg-gray-700 rounded-lg p-4 mb-6'>
            <div className='flex items-center justify-between mb-2'>
              <span className='text-sm text-gray-400'>Order number</span>
              <span className='text-sm font-semibold text-emerald-400'>
                {orderNumber ? `#${orderNumber}` : "Loading..."} {/* عرض رقم الطلب */}
              </span>
            </div>
            <div className='flex items-center justify-between'>
              <span className='text-sm text-gray-400'>Estimated delivery</span>
              <span className='text-sm font-semibold text-emerald-400'>3-5 business days</span>
            </div>
          </div>

          <div className='space-y-4'>
            <button
              className='w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-4 rounded-lg 
              transition duration-300 flex items-center justify-center'
            >
              <HandHeart className='mr-2' size={18} />
              Thanks for trusting us!
            </button>
            <Link
              to={"/"}
              className='w-full bg-gray-700 hover:bg-gray-600 text-emerald-400 font-bold py-2 px-4 rounded-lg 
              transition duration-300 flex items-center justify-center'
            >
              Continue Shopping
              <ArrowRight className='ml-2' size={18} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PurchaseSuccessPage;
