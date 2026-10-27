import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Bike, Shield, Battery, IndianRupee, ArrowLeft, ArrowRight } from 'lucide-react';

export default function ConfirmRidePage() {
  const location = useLocation();
  const navigate = useNavigate();

  // Get selected bike & stand from navigation state, or fallback
  const bike = location.state?.bike || {
    id: 'demo-bike-id',
    qrCode: 'EFLOW-BK-001',
    standName: 'Main Gate Stand (Demo A)',
    batteryLevel: 95,
  };

  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [isUnlocking, setIsUnlocking] = useState(false);

  const handleStartRide = () => {
    setIsUnlocking(true);
    // Simulate unlock sequence with smart lock
    setTimeout(() => {
      setIsUnlocking(false);
      navigate('/ride/active', {
        state: {
          bike,
          startTime: Date.now(),
        },
      });
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-[var(--color-bg)] flex flex-col p-4 sm:p-6">
      <div className="max-w-xl mx-auto w-full">
        {/* Top bar */}
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-1.5 text-sm font-semibold text-[var(--color-primary)] mb-4 hover:underline"
        >
          <ArrowLeft size={18} /> Back to Stands
        </button>

        <div className="card p-6 space-y-6">
          <div className="flex items-center justify-between border-b pb-4">
            <div>
              <span className="text-xs uppercase tracking-wider font-bold text-[var(--color-text-secondary)]">
                Selected E-Bike
              </span>
              <h1 className="text-2xl font-bold text-[var(--color-primary)] flex items-center gap-2 mt-0.5">
                <Bike className="text-[var(--color-accent)]" /> {bike.qrCode}
              </h1>
              <p className="text-xs text-gray-500 mt-1">Docked at: {bike.standName || 'SSN Campus Stand'}</p>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-1 text-green-700 font-bold text-sm bg-green-50 px-2.5 py-1 rounded-full">
                <Battery size={16} /> {bike.batteryLevel}%
              </div>
              <span className="text-[10px] text-gray-400 mt-1 block">Est. Range: ~35 km</span>
            </div>
          </div>

          {/* Pricing Policy Card */}
          <div className="bg-blue-50/60 border border-blue-100 rounded-xl p-4 space-y-3">
            <h2 className="font-semibold text-sm text-[var(--color-primary)] flex items-center gap-1.5">
              <IndianRupee size={16} /> Transparent Pricing Policy
            </h2>
            <div className="grid grid-cols-2 gap-3 text-xs text-gray-700">
              <div className="bg-white p-2.5 rounded-lg border border-blue-100/80">
                <span className="text-gray-500 block">Base Fare</span>
                <strong className="text-sm text-gray-900">₹10.00</strong>
                <span className="text-[10px] text-green-600 block mt-0.5">Includes 5 min grace</span>
              </div>
              <div className="bg-white p-2.5 rounded-lg border border-blue-100/80">
                <span className="text-gray-500 block">Ride Rate</span>
                <strong className="text-sm text-gray-900">₹2.00 / min</strong>
                <span className="text-[10px] text-gray-500 block mt-0.5">Partial min rounds up</span>
              </div>
            </div>
          </div>

          {/* Safety & Guidelines */}
          <div className="space-y-2 text-xs text-gray-600 bg-gray-50 p-3.5 rounded-xl border">
            <h3 className="font-semibold text-gray-800 flex items-center gap-1">
              <Shield size={14} className="text-blue-600" /> Campus Rules & Return
            </h3>
            <ul className="list-disc pl-4 space-y-1">
              <li>Ride within SSN campus roads at max 20 km/h.</li>
              <li>Must be returned inside any authorized stand geofence radius (40m).</li>
              <li>Ensure the physical lock engages properly upon return.</li>
            </ul>
          </div>

          {/* Terms checkbox */}
          <label className="flex items-start gap-2.5 text-xs text-gray-700 cursor-pointer pt-1">
            <input
              type="checkbox"
              checked={acceptedTerms}
              onChange={(e) => setAcceptedTerms(e.target.checked)}
              className="mt-0.5 rounded border-gray-300 text-[var(--color-primary)] focus:ring-[var(--color-primary)]"
            />
            <span>I accept the campus rental terms and agree to ride safely.</span>
          </label>

          {/* Action button */}
          <button
            onClick={handleStartRide}
            disabled={!acceptedTerms || isUnlocking}
            className="btn-accent w-full py-3 text-base font-bold flex items-center justify-center gap-2 shadow-sm"
          >
            {isUnlocking ? (
              <span>Unlocking Smart Lock...</span>
            ) : (
              <>
                <span>Confirm & Unlock Bike</span> <ArrowRight size={18} />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
