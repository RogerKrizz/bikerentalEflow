import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CheckCircle2, Clock, Bike, Receipt, ArrowRight, ShieldCheck } from 'lucide-react';

export default function PaymentPage() {
  const location = useLocation();
  const navigate = useNavigate();

  const rideData = location.state || {
    bike: { qrCode: 'EFLOW-BK-001' },
    durationMinutes: 12,
    fare: 24.0,
    returnStand: 'Central Library Stand (Demo B)',
  };

  const [paymentStatus, setPaymentStatus] = useState<'PENDING' | 'SUCCESS'>('PENDING');
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<'UPI' | 'CAMPUS_WALLET'>('UPI');

  const baseFare = 10.0;
  const billableMinutes = Math.max(0, rideData.durationMinutes - 5);
  const rateCharges = billableMinutes * 2.0;
  const totalAmount = baseFare + rateCharges;

  const handlePay = () => {
    setIsProcessing(true);
    // Simulate mock payment provider gateway
    setTimeout(() => {
      setIsProcessing(false);
      setPaymentStatus('SUCCESS');
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-[var(--color-bg)] flex flex-col p-4 sm:p-6 items-center justify-center">
      <div className="max-w-md mx-auto w-full space-y-4">
        {paymentStatus === 'SUCCESS' ? (
          <div className="card p-6 text-center space-y-4 shadow-md border-green-200">
            <div className="w-16 h-16 bg-green-100 text-green-700 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 size={36} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Payment Successful!</h1>
              <p className="text-xs text-gray-500 mt-1">Smart lock confirmed physically LOCKED</p>
            </div>

            <div className="bg-gray-50 p-4 rounded-xl border text-left text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-500">Receipt Ref:</span>
                <span className="font-mono font-bold text-gray-800">INV-{Date.now().toString().slice(-6)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Amount Paid:</span>
                <span className="font-bold text-green-700">₹{totalAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Payment Gateway:</span>
                <span>Mock Provider (Success)</span>
              </div>
            </div>

            <button
              onClick={() => navigate('/dashboard')}
              className="btn-primary w-full py-3 text-sm font-bold flex items-center justify-center gap-2"
            >
              Back to Campus Dashboard <ArrowRight size={16} />
            </button>
          </div>
        ) : (
          <div className="card p-6 space-y-5 shadow-md">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)]">
                Ride Summary & Invoice
              </span>
              <h1 className="text-xl font-bold text-[var(--color-primary)] mt-0.5 flex items-center gap-2">
                <Receipt size={22} className="text-[var(--color-accent)]" /> Fare Breakdown
              </h1>
            </div>

            {/* Ride details */}
            <div className="grid grid-cols-2 gap-3 text-xs bg-gray-50 p-3 rounded-xl border">
              <div>
                <span className="text-gray-400 block">Bike</span>
                <strong className="text-gray-800 flex items-center gap-1 mt-0.5">
                  <Bike size={14} /> {rideData.bike.qrCode}
                </strong>
              </div>
              <div>
                <span className="text-gray-400 block">Duration</span>
                <strong className="text-gray-800 flex items-center gap-1 mt-0.5">
                  <Clock size={14} /> {rideData.durationMinutes} mins
                </strong>
              </div>
            </div>

            {/* Itemized Fare */}
            <div className="space-y-2 text-xs border-t pt-3">
              <div className="flex justify-between text-gray-600">
                <span>Base Fare (incl. 5m grace):</span>
                <span>₹{baseFare.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Ride Charge ({billableMinutes} billable mins @ ₹2/min):</span>
                <span>₹{rateCharges.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Late return fee:</span>
                <span className="text-green-600">₹0.00</span>
              </div>
              <div className="flex justify-between text-base font-bold text-gray-900 border-t pt-2 mt-2">
                <span>Total Due:</span>
                <span className="text-[var(--color-primary)]">₹{totalAmount.toFixed(2)}</span>
              </div>
            </div>

            {/* Mock Payment Selector */}
            <div className="space-y-2 border-t pt-3">
              <span className="text-xs font-semibold text-gray-700 block">Select Payment Method:</span>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setSelectedMethod('UPI')}
                  className={`p-2.5 rounded-lg border font-medium text-center transition ${
                    selectedMethod === 'UPI'
                      ? 'border-[var(--color-primary)] bg-blue-50 text-[var(--color-primary)] font-bold'
                      : 'border-gray-200 text-gray-600'
                  }`}
                >
                  SSN UPI / QR
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedMethod('CAMPUS_WALLET')}
                  className={`p-2.5 rounded-lg border font-medium text-center transition ${
                    selectedMethod === 'CAMPUS_WALLET'
                      ? 'border-[var(--color-primary)] bg-blue-50 text-[var(--color-primary)] font-bold'
                      : 'border-gray-200 text-gray-600'
                  }`}
                >
                  Campus Wallet
                </button>
              </div>
            </div>

            {/* Pay Button */}
            <button
              onClick={handlePay}
              disabled={isProcessing}
              className="btn-accent w-full py-3 font-bold text-sm flex items-center justify-center gap-2 shadow-sm"
            >
              {isProcessing ? (
                <span>Verifying Payment...</span>
              ) : (
                <>
                  <span>Pay ₹{totalAmount.toFixed(2)}</span> <ShieldCheck size={18} />
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
