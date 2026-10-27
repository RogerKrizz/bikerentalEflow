import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Lock, Unlock, StopCircle, Clock, MapPin, AlertCircle, ShieldCheck } from 'lucide-react';

export default function ActiveRidePage() {
  const location = useLocation();
  const navigate = useNavigate();

  const bike = location.state?.bike || {
    qrCode: 'EFLOW-BK-001',
    standName: 'Main Gate Stand (Demo A)',
  };

  const [seconds, setSeconds] = useState(0);
  const [isTempLocked, setIsTempLocked] = useState(false);
  const [inGeofence, setInGeofence] = useState(true);

  // Live Ride Timer — persists start timestamp in localStorage to prevent reset on reload
  useEffect(() => {
    let startTimestamp = localStorage.getItem('eflow_ride_start');
    if (!startTimestamp) {
      startTimestamp = Date.now().toString();
      localStorage.setItem('eflow_ride_start', startTimestamp);
    }

    const updateTimer = () => {
      const elapsedSeconds = Math.floor((Date.now() - parseInt(startTimestamp, 10)) / 1000);
      setSeconds(elapsedSeconds >= 0 ? elapsedSeconds : 0);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, []);

  // Format HH:MM:SS or MM:SS
  const formatTime = (totalSec: number) => {
    const hrs = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = totalSec % 60;
    if (hrs > 0) {
      return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // Estimate Fare
  const durationMinutes = Math.max(1, Math.ceil(seconds / 60));
  const billableMinutes = Math.max(0, durationMinutes - 5);
  const estimatedFare = 10 + billableMinutes * 2;

  const handleEndRide = () => {
    if (!inGeofence) {
      alert('Cannot end ride: You are outside the authorized stand return geofence!');
      return;
    }

    localStorage.removeItem('eflow_ride_start');

    navigate('/payment', {
      state: {
        bike,
        durationMinutes,
        fare: estimatedFare,
        returnStand: 'Central Library Stand (Demo B)',
      },
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col p-4 sm:p-6 items-center">
      <div className="max-w-lg w-full space-y-4">
        {/* Header bar */}
        <div className="flex justify-between items-center px-1">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Active Session
          </span>
          <span className="flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
            <ShieldCheck size={14} /> Smart Lock Synced
          </span>
        </div>

        {/* Big Live Clock Banner */}
        <div className="bg-[#1e3a5f] text-white p-7 rounded-2xl shadow-lg text-center relative overflow-hidden">
          <div className="flex justify-center mb-2">
            <span
              className={`text-xs font-semibold uppercase tracking-wider px-3 py-1 rounded-full border ${
                isTempLocked
                  ? 'bg-amber-500/20 border-amber-400 text-amber-200 animate-pulse'
                  : 'bg-emerald-500/20 border-emerald-400 text-emerald-200'
              }`}
            >
              {isTempLocked ? '⏸ Temporarily Locked (Billing Active)' : '● Active Ride In Progress'}
            </span>
          </div>

          <div className="my-6">
            <div className="text-5xl sm:text-6xl font-mono font-black tracking-widest text-white drop-shadow-sm">
              {formatTime(seconds)}
            </div>
            <p className="text-xs text-blue-200 mt-2 flex items-center justify-center gap-1.5">
              <Clock size={14} className="text-emerald-400" /> Live server-synchronized ride duration
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-5 border-t border-white/15 text-left">
            <div>
              <span className="text-[11px] text-blue-200 block uppercase tracking-wider">E-Bike</span>
              <strong className="text-base font-bold text-white">{bike.qrCode}</strong>
            </div>
            <div className="text-right">
              <span className="text-[11px] text-blue-200 block uppercase tracking-wider">Estimated Fare</span>
              <strong className="text-lg font-black text-emerald-300">₹{estimatedFare.toFixed(2)}</strong>
            </div>
          </div>
        </div>

        {/* Smart Lock Control */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-sm text-slate-800">Smart Lock Status</h2>
            <span
              className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${
                isTempLocked ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
              }`}
            >
              {isTempLocked ? '🔒 LOCKED' : '🔓 UNLOCKED'}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-1">
            <button
              onClick={() => setIsTempLocked(true)}
              disabled={isTempLocked}
              className={`py-3 px-3 rounded-lg border text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                isTempLocked
                  ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                  : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50 shadow-sm active:scale-95'
              }`}
            >
              <Lock size={15} /> Pause & Lock
            </button>
            <button
              onClick={() => setIsTempLocked(false)}
              disabled={!isTempLocked}
              className={`py-3 px-3 rounded-lg border text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                !isTempLocked
                  ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                  : 'bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-700 shadow-sm active:scale-95'
              }`}
            >
              <Unlock size={15} /> Resume & Unlock
            </button>
          </div>
          <p className="text-[11px] text-slate-500">
            {isTempLocked
              ? 'Your bike is locked. Other students cannot take it. Billing continues while paused.'
              : 'Smart lock is unlocked. You can ride freely across campus.'}
          </p>
        </div>

        {/* Geofence & Return Status */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-sm text-slate-800 flex items-center gap-1.5">
              <MapPin size={16} className="text-[#1e3a5f]" /> Authorized Return Stand
            </h2>
            <button
              onClick={() => setInGeofence(!inGeofence)}
              className="text-[11px] text-blue-600 hover:underline bg-blue-50 px-2 py-0.5 rounded font-medium"
              title="Click to toggle geofence for demo"
            >
              Toggle Demo Zone
            </button>
          </div>

          <div
            className={`p-3 rounded-xl border flex items-center gap-3 text-xs ${
              inGeofence
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-rose-50 border-rose-200 text-rose-800'
            }`}
          >
            <AlertCircle size={20} className="shrink-0" />
            <div>
              {inGeofence ? (
                <>
                  <strong className="block text-emerald-900">Inside Authorized Stand Radius</strong>
                  <p className="text-[11px] text-emerald-700 mt-0.5">
                    Central Library Stand (18m away, limit 40m). Physical lock sensor will engage upon ending ride.
                  </p>
                </>
              ) : (
                <>
                  <strong className="block text-rose-900">Outside Authorized Stand Geofence</strong>
                  <p className="text-[11px] text-rose-700 mt-0.5">
                    Currently ~160m from nearest stand. You must return the e-bike inside any authorized stand area.
                  </p>
                </>
              )}
            </div>
          </div>

          {/* End Ride Action */}
          <button
            onClick={handleEndRide}
            disabled={!inGeofence}
            className={`w-full py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-sm transition ${
              inGeofence
                ? 'bg-rose-600 text-white hover:bg-rose-700 active:scale-95'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            <StopCircle size={18} /> End Ride & Lock Bike
          </button>
        </div>
      </div>
    </div>
  );
}
