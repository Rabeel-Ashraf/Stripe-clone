"use client";

interface PaymentIntentData {
  id: string;
  amount: number;
  currency: string;
  description?: string;
  status: string;
  metadata?: Record<string, any>;
}

interface OrderSummaryProps {
  paymentIntent: PaymentIntentData;
}

const formatAmount = (amount: number, currency: string) => {
  const formatter = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency || "USD",
  });
  return formatter.format(amount / 100);
};

export default function OrderSummary({ paymentIntent }: OrderSummaryProps) {
  const quantity = 1;
  const subtotal = paymentIntent.amount;
  const total = paymentIntent.amount;

  return (
    <div className="space-y-6">
      {/* Order Items */}
      <div>
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Order Summary</h3>
        <div className="bg-white rounded-lg p-4 space-y-3">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-900">
                {paymentIntent.description || "Purchase"}
              </p>
              <p className="text-xs text-gray-600 mt-1">Qty: {quantity}</p>
            </div>
            <p className="text-sm font-medium text-gray-900">
              {formatAmount(subtotal, paymentIntent.currency)}
            </p>
          </div>
        </div>
      </div>

      {/* Totals */}
      <div className="bg-white rounded-lg p-4 space-y-3 border-t-2 border-gray-200">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Subtotal</span>
          <span className="text-gray-900 font-medium">
            {formatAmount(subtotal, paymentIntent.currency)}
          </span>
        </div>
        <div className="flex justify-between text-sm border-t border-gray-200 pt-3">
          <span className="text-lg font-semibold text-gray-900">Total</span>
          <span className="text-lg font-semibold text-blue-600">
            {formatAmount(total, paymentIntent.currency)}
          </span>
        </div>
      </div>

      {/* Security Badge */}
      <div className="bg-green-50 rounded-lg p-4 border border-green-200">
        <div className="flex items-start gap-3">
          <svg
            className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M5.293 9.707a1 1 0 010-1.414L10 3.586l4.707 4.707a1 1 0 01-1.414 1.414L10 6.414l-3.293 3.293a1 1 0 01-1.414 0z"
              clipRule="evenodd"
            />
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clipRule="evenodd"
            />
          </svg>
          <div>
            <p className="font-medium text-green-900 text-sm">
              🔒 Secure Checkout
            </p>
            <p className="text-xs text-green-700 mt-1">
              Your payment information is encrypted and secure
            </p>
          </div>
        </div>
      </div>

      {/* Powered by */}
      <div className="text-center text-xs text-gray-600 pt-4 border-t border-gray-200">
        <p>Powered by Stripe Clone</p>
      </div>
    </div>
  );
}
