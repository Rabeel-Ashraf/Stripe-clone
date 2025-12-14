"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

interface ChargeData {
  id: string;
  amount: number;
  currency: string;
  status: string;
  cardLast4: string;
  cardBrand: string;
  createdAt: string;
}

interface PaymentIntentData {
  id: string;
  amount: number;
  currency: string;
  status: string;
  charges?: ChargeData[];
  createdAt: string;
}

const formatAmount = (amount: number, currency: string) => {
  const formatter = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency || "USD",
  });
  return formatter.format(amount / 100);
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export default function CheckoutSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const intentId = searchParams.get("payment_intent");
  const [paymentIntent, setPaymentIntent] = useState<PaymentIntentData | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchPaymentIntent = async () => {
      try {
        if (!intentId) {
          setLoading(false);
          return;
        }

        const response = await fetch(
          `/api/payment-intents?status=succeeded&limit=1`
        );
        if (!response.ok) {
          setLoading(false);
          return;
        }

        const data = await response.json();
        const intent = data.data?.find((pi: any) => pi.id === intentId);
        if (intent) {
          setPaymentIntent(intent);
        }
        setLoading(false);
      } catch (err) {
        setLoading(false);
      }
    };

    fetchPaymentIntent();
  }, [intentId]);

  const handleCopyTransactionId = () => {
    if (paymentIntent?.id) {
      navigator.clipboard.writeText(paymentIntent.id);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-lg shadow-2xl p-8 max-w-md w-full">
        {/* Success Icon */}
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
            <svg
              className="w-8 h-8 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={3}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
        </div>

        {/* Heading */}
        <h1 className="text-3xl font-bold text-center text-gray-900 mb-2">
          Payment Successful
        </h1>
        <p className="text-center text-gray-600 mb-8">
          Thank you for your purchase
        </p>

        {/* Details Section */}
        {paymentIntent && (
          <div className="bg-gray-50 rounded-lg p-6 space-y-4 mb-8">
            {/* Amount */}
            <div>
              <p className="text-sm text-gray-600 mb-1">Amount</p>
              <p className="text-3xl font-bold text-gray-900">
                {formatAmount(paymentIntent.amount, paymentIntent.currency)}
              </p>
            </div>

            {/* Transaction ID */}
            <div className="pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-600 mb-1">Transaction ID</p>
              <div className="flex items-center gap-2">
                <p className="font-mono text-sm text-gray-900 break-all">
                  {paymentIntent.id}
                </p>
                <button
                  onClick={handleCopyTransactionId}
                  className="text-blue-600 hover:text-blue-700 transition-colors"
                  title="Copy to clipboard"
                >
                  {copied ? (
                    <svg
                      className="w-5 h-5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  ) : (
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                      />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Date */}
            <div className="pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-600 mb-1">Date</p>
              <p className="text-sm text-gray-900">
                {formatDate(paymentIntent.createdAt)}
              </p>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-3">
          <button
            onClick={() => router.push("/")}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            Return to Store
          </button>
          <button
            onClick={() => window.print()}
            className="w-full px-4 py-2 border border-gray-300 text-gray-900 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
          >
            Download Receipt
          </button>
        </div>

        {/* Footer */}
        <div className="mt-8 pt-8 border-t border-gray-200 text-center text-xs text-gray-600">
          <p>Powered by Stripe Clone</p>
          <p className="mt-2">
            A transaction confirmation email will be sent shortly
          </p>
        </div>
      </div>
    </div>
  );
}
