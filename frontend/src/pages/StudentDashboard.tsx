import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api/client';
import { useAuth } from '../auth/AuthContext';
import StandMap from '../components/StandMap';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import { Bike, MapPin, Battery, ShieldCheck, LogOut, Navigation, AlertTriangle } from 'lucide-react';

interface Stand {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  capacity: number;
  returnRadiusMeters: number;
  availableBikes: number;
  inUseBikes: number;
  maintenanceBikes: number;
  distanceMeters: number | null;
}

interface AvailableBike {
  id: string;
  qrCode: string;
  standId: string;
  standName: string;
  status: string;
  batteryLevel: number;
  lockState: string;
}

export default function StudentDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [stands, setStands] = useState<Stand[]>([]);
  const [selectedStandId, setSelectedStandId] = useState<string | null>(null);
  const [bikesAtStand, setBikesAtStand] = useState<AvailableBike[]>([]);
  const [selectedBike, setSelectedBike] = useState<AvailableBike | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationDenied, setLocationDenied] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [bikesLoading, setBikesLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Request GPS position
  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setUserLocation(loc);
          fetchStands(loc.lat, loc.lng);
        },
        () => {
          setLocationDenied(true);
          fetchStands();
        },
        { enableHighAccuracy: true, timeout: 8000 }
      );
    } else {
      setLocationDenied(true);
      fetchStands();
    }
  }, []);

  const fetchStands = async (lat?: number, lng?: number) => {
    setLoading(true);
    setError(null);
    try {
      const params: any = {};
      if (lat && lng) {
        params.lat = lat;
        params.lng = lng;
      }
      const res = await apiClient.get<Stand[]>('/stands', { params });
      setStands(res.data);
      if (res.data.length > 0 && !selectedStandId) {
        setSelectedStandId(res.data[0].id);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load stands');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedStandId) {
      fetchBikesForStand(selectedStandId);
    }
  }, [selectedStandId]);

  const fetchBikesForStand = async (standId: string) => {
    setBikesLoading(true);
    setSelectedBike(null);
    try {
      const res = await apiClient.get<AvailableBike[]>(`/stands/${standId}/bikes`);
      setBikesAtStand(res.data);
    } catch (err: any) {
      setBikesAtStand([]);
    } finally {
      setBikesLoading(false);
    }
  };

  const selectedStand = stands.find((s) => s.id === selectedStandId);

  return (
    <div className="min-h-screen bg-[var(--color-bg)] flex flex-col">
      {/* Header */}
      <header className="bg-[var(--color-primary)] text-white px-4 py-3 shadow-sm">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Bike size={24} />
            <h1 className="font-bold text-lg tracking-wide">E-FLOW</h1>
          </div>
          <div className="flex items-center gap-3">
            {user?.role === 'ADMIN' && (
              <button
                onClick={() => navigate('/admin')}
                className="bg-blue-600/80 hover:bg-blue-500 text-white text-xs px-3 py-1.5 rounded-lg font-bold border border-blue-400/40 transition flex items-center gap-1.5"
              >
                <span>Command Center</span> &rarr;
              </button>
            )}
            <div className="text-right hidden sm:block">
              <p className="text-sm font-semibold">{user?.name}</p>
              <p className="text-xs text-blue-200">{user?.email}</p>
            </div>
            <button
              onClick={logout}
              className="p-2 hover:bg-[var(--color-primary-light)] rounded-lg text-white transition"
              title="Logout"
            >
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-6xl mx-auto w-full p-4 sm:p-6 flex-1 space-y-6">
        {locationDenied && (
          <div className="card bg-amber-50 border-amber-200 p-3 flex items-center gap-3 text-amber-800 text-sm">
            <AlertTriangle size={18} className="shrink-0 text-amber-600" />
            <p>GPS permission not granted or unavailable. You can manually select stands below.</p>
          </div>
        )}

        {error && <ErrorMessage message={error} onRetry={() => fetchStands()} />}

        {loading ? (
          <LoadingSpinner message="Locating nearest SSN e-bike stands..." />
        ) : (
          <>
            {/* Map Overview */}
            <StandMap
              stands={stands.map((s) => ({
                id: s.id,
                name: s.name,
                latitude: Number(s.latitude),
                longitude: Number(s.longitude),
                capacity: s.capacity,
                returnRadiusMeters: Number(s.returnRadiusMeters),
                availableBikes: s.availableBikes,
              }))}
              userLocation={userLocation}
              onSelectStand={(id) => setSelectedStandId(id)}
            />

            {/* Stands & Bikes Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Stand Selection List */}
              <div className="md:col-span-1 space-y-3">
                <h2 className="font-bold text-gray-800 text-base flex items-center gap-1.5">
                  <MapPin size={18} className="text-[var(--color-primary)]" />
                  Campus Stands ({stands.length})
                </h2>
                <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                  {stands.map((stand) => {
                    const isSelected = stand.id === selectedStandId;
                    return (
                      <div
                        key={stand.id}
                        onClick={() => setSelectedStandId(stand.id)}
                        className={`card cursor-pointer transition-all p-3.5 border ${
                          isSelected
                            ? 'border-[var(--color-primary)] bg-blue-50/50 shadow-sm'
                            : 'hover:border-gray-300'
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <h3 className="font-semibold text-sm text-[var(--color-primary)]">{stand.name}</h3>
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                              stand.availableBikes > 0
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {stand.availableBikes} bikes
                          </span>
                        </div>
                        <div className="mt-2 flex items-center justify-between text-xs text-[var(--color-text-secondary)]">
                          <span>Capacity: {stand.capacity}</span>
                          {stand.distanceMeters != null && (
                            <span className="flex items-center gap-1">
                              <Navigation size={12} />
                              {Math.round(stand.distanceMeters)} m away
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Available Bikes at Stand */}
              <div className="md:col-span-2 space-y-4">
                <div className="flex justify-between items-center">
                  <h2 className="font-bold text-gray-800 text-base flex items-center gap-1.5">
                    <Bike size={20} className="text-[var(--color-accent)]" />
                    Available Bikes at {selectedStand?.name || 'Selected Stand'}
                  </h2>
                </div>

                {bikesLoading ? (
                  <LoadingSpinner message="Fetching bikes..." />
                ) : bikesAtStand.length === 0 ? (
                  <div className="card text-center py-10 text-gray-500">
                    <Bike size={36} className="mx-auto mb-2 text-gray-400" />
                    <p className="font-medium">No bikes currently available at this stand.</p>
                    <p className="text-xs mt-1 text-gray-400">Please choose another stand on the map.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {bikesAtStand.map((bike) => {
                      const isSelected = selectedBike?.id === bike.id;
                      return (
                        <div
                          key={bike.id}
                          className={`card p-4 transition-all border ${
                            isSelected ? 'border-[var(--color-accent)] bg-green-50/30 ring-2 ring-[var(--color-accent)]/20' : 'hover:shadow-md'
                          }`}
                        >
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <span className="text-xs font-mono font-bold text-gray-700 bg-gray-100 px-2 py-0.5 rounded">
                                {bike.qrCode}
                              </span>
                              <div className="flex items-center gap-1 text-xs text-green-700 mt-1">
                                <ShieldCheck size={14} /> Ready for Ride
                              </div>
                            </div>
                            <div className="flex items-center gap-1 text-xs font-semibold text-gray-700">
                              <Battery size={16} className="text-green-600" />
                              {bike.batteryLevel}%
                            </div>
                          </div>

                          <div className="mt-4 pt-3 border-t border-gray-100 flex justify-between items-center">
                            <span className="text-xs text-gray-500 font-medium">Smart Lock: Locked</span>
                            <button
                              onClick={() =>
                                navigate('/ride/confirm', {
                                  state: {
                                    bike: {
                                      id: bike.id,
                                      qrCode: bike.qrCode,
                                      standName: selectedStand?.name,
                                      batteryLevel: bike.batteryLevel,
                                    },
                                  },
                                })
                              }
                              className="btn-accent text-xs py-1.5 px-3 font-semibold flex items-center gap-1"
                            >
                              Select Bike &rarr;
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Bike Confirmation Card */}
                {selectedBike && (
                  <div className="card border-[var(--color-accent)] bg-emerald-50/40 p-4 mt-6">
                    <h3 className="font-bold text-[var(--color-primary)] text-sm mb-2">
                      Ready to Start Ride with {selectedBike.qrCode}
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs text-gray-700 mb-4">
                      <div>
                        <span className="text-gray-500 block">Base Fare:</span>
                        <strong className="text-gray-800">₹10.00 (incl. 5m grace)</strong>
                      </div>
                      <div>
                        <span className="text-gray-500 block">Rate:</span>
                        <strong className="text-gray-800">₹2.00 / minute</strong>
                      </div>
                      <div>
                        <span className="text-gray-500 block">Battery:</span>
                        <strong className="text-green-700">{selectedBike.batteryLevel}%</strong>
                      </div>
                    </div>
                    <button
                      className="btn-primary w-full py-2.5 text-sm font-semibold flex items-center justify-center gap-2"
                      onClick={() =>
                        navigate('/ride/confirm', {
                          state: {
                            bike: {
                              id: selectedBike.id,
                              qrCode: selectedBike.qrCode,
                              standName: selectedStand?.name,
                              batteryLevel: selectedBike.batteryLevel,
                            },
                          },
                        })
                      }
                    >
                      <span>Proceed to Ride & Unlock</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
