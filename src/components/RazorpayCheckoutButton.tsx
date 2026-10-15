import React, { useState } from 'react';
import { CreditCard, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

interface RazorpayCheckoutButtonProps {
  amountInINR: number; // e.g. 499 for ₹499
  title?: string;
  description?: string;
  prefillEmail?: string;
  prefillName?: string;
  prefillContact?: string;
  receipt?: string;
  buttonText?: string;
  buttonClassName?: string;
  onSuccess?: (details: { paymentId: string; orderId: string; signature: string }) => void;
  onError?: (errorMsg: string) => void;
  onCancel?: () => void;
}

export const RazorpayCheckoutButton: React.FC<RazorpayCheckoutButtonProps> = ({
  amountInINR,
  title = 'PulseNote AI Checkout',
  description = 'Secure Payment via Razorpay Gateway',
  prefillEmail = '',
  prefillName = '',
  prefillContact = '',
  receipt,
  buttonText,
  buttonClassName,
  onSuccess,
  onError,
  onCancel,
}) => {
  const [loading, setLoading] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'success' | 'failed'>('idle');

  const loadRazorpayScript = (): Promise<boolean> => {
    return new Promise((resolve) => {
      if ((window as any).Razorpay) {
        return resolve(true);
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleCheckout = async () => {
    setLoading(true);
    setPaymentStatus('processing');

    try {
      // 1. Ensure script is loaded
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        throw new Error('Failed to load Razorpay SDK. Please check your internet connection.');
      }

      // Convert amount to paise (min 100 paise = ₹1.00)
      const amountInPaise = Math.max(100, Math.round(amountInINR * 100));

      // 2. Call backend order creation endpoint
      const response = await fetch('/api/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: amountInPaise,
          currency: 'INR',
          receipt: receipt || `rcpt_${Date.now()}`,
        }),
      });

      const orderData = await response.json();

      if (!response.ok || !orderData.order_id) {
        throw new Error(orderData.message || orderData.error || 'Failed to create order on server.');
      }

      const keyId = orderData.key_id || orderData.keyId || (import.meta as any).env?.VITE_RAZORPAY_KEY_ID || (import.meta as any).env?.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_live_To8VhLeb57Fbsw';

      // 3. Open Razorpay Standard Checkout Modal
      const options = {
        key: keyId,
        amount: orderData.amount,
        currency: orderData.currency || 'INR',
        name: title,
        description: description,
        order_id: orderData.order_id,
        prefill: {
          name: prefillName,
          email: prefillEmail,
          contact: prefillContact,
        },
        theme: {
          color: '#4e8cff',
        },
        handler: async (paymentResponse: {
          razorpay_payment_id: string;
          razorpay_order_id: string;
          razorpay_signature: string;
        }) => {
          try {
            // 4. Send all three parameter credentials to backend verification endpoint
            const verifyResponse = await fetch('/api/verify-payment', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                razorpay_payment_id: paymentResponse.razorpay_payment_id,
                razorpay_order_id: paymentResponse.razorpay_order_id,
                razorpay_signature: paymentResponse.razorpay_signature,
              }),
            });

            const verifyData = await verifyResponse.json();

            if (verifyResponse.ok && verifyData.success) {
              setPaymentStatus('success');
              if (onSuccess) {
                onSuccess({
                  paymentId: paymentResponse.razorpay_payment_id,
                  orderId: paymentResponse.razorpay_order_id,
                  signature: paymentResponse.razorpay_signature,
                });
              }
            } else {
              throw new Error(verifyData.message || 'Signature mismatch. Payment verification failed.');
            }
          } catch (verifyErr: any) {
            setPaymentStatus('failed');
            const errText = verifyErr?.message || 'Payment verification failed.';
            if (onError) onError(errText);
          } finally {
            setLoading(false);
          }
        },
        modal: {
          ondismiss: () => {
            setLoading(false);
            setPaymentStatus('idle');
            if (onCancel) onCancel();
          },
        },
      };

      const razorpayInstance = new (window as any).Razorpay(options);

      razorpayInstance.on('payment.failed', (resp: any) => {
        setLoading(false);
        setPaymentStatus('failed');
        const failureMsg = resp.error?.description || 'Payment process failed or was cancelled.';
        if (onError) onError(failureMsg);
      });

      razorpayInstance.open();
    } catch (err: any) {
      setLoading(false);
      setPaymentStatus('failed');
      const msg = err?.message || 'Order creation failed.';
      if (onError) onError(msg);
    }
  };

  const defaultBtnClass =
    buttonClassName ||
    'w-full py-3 px-5 rounded-xl bg-gradient-to-r from-[#4e8cff] to-[#ff5757] hover:opacity-95 text-white font-bold text-xs shadow-lg shadow-[#4e8cff]/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50';

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={handleCheckout}
        disabled={loading}
        className={defaultBtnClass}
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin text-white" />
            <span>Connecting Razorpay...</span>
          </>
        ) : (
          <>
            <CreditCard className="w-4 h-4" />
            <span>{buttonText || `Pay ₹${amountInINR.toLocaleString('en-IN')} with Razorpay`}</span>
          </>
        )}
      </button>

      {paymentStatus === 'success' && (
        <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center gap-2 text-xs text-emerald-300">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
          <span>Payment verified & processed successfully!</span>
        </div>
      )}

      {paymentStatus === 'failed' && (
        <div className="p-2.5 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-center gap-2 text-xs text-rose-300">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
          <span>Payment failed or signature mismatch. Please try again.</span>
        </div>
      )}
    </div>
  );
};
