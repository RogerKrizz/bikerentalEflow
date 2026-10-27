import { useState, useEffect, useCallback } from 'react';
import apiClient from '../api/client';
import { useAuth } from '../auth/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  Bike,
  ShieldAlert,
  BatteryCharging,
  Lock,
  Unlock,
  Radio,
  MapPin,
  Users,
  IndianRupee,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Activity,
  Wifi,
  WifiOff,
  LogOut,
  Wrench,
  Search,
  Terminal,
  Clock,
  ArrowRight,
  ExternalLink,
  Sliders,
} from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';

// DTO Interfaces
interface AdminDashboardStats {
  totalBikes: number;
  availableBikes: number;
  inUseBikes: number;
  maintenanceBikes: number;
  totalStands: number;
  activeStands: number;
  totalDevices: number;
  onlineDevices: number;
  offlineDevices: number;
  totalStudents: number;
  restrictedStudents: number;
  activeRidesCount: number;
  todayRevenue: number;
  totalRevenue: number;
  standOccupancies: StandOccupancy[];
  recentAlerts: AdminAlert[];
}

interface StandOccupancy {
  id: string;
  name: string;
  capacity: number;
  availableBikes: number;
  occupancyPercent: number;
  returnRadiusMeters: number;
  active: boolean;
}

interface AdminAlert {
  id: string;
  type: 'WARNING' | 'INFO' | 'CRITICAL';
  title: string;
  message: string;
  timestamp: string;
}

interface AdminBike {
  id: string;
  qrCode: string;
  standId: string | null;
  standName: string;
  status: 'AVAILABLE' | 'IN_USE' | 'MAINTENANCE';
  batteryLevel: number;
  lockState: 'LOCKED' | 'UNLOCKED' | 'UNKNOWN';
  deviceId: string;
  deviceOnline: boolean;
  updatedAt: string;
}

interface AdminDevice {
  id: string;
  deviceId: string;
  transport: string;
  address: string;
  online: boolean;
  lastSeen: string | null;
  bikeId: string | null;
  bikeQrCode: string;
  bikeStatus: string;
  batteryLevel: number;
  lockState: string;
}

interface AdminStudent {
  id: string;
  name: string;
  email: string;
  role: string;
  emailVerified: boolean;
  restricted: boolean;
  createdAt: string;
}

interface AuditLog {
  id: string;
  actorId: string | null;
  actorType: string;
  action: string;
  entityType: string;
  entityId: string | null;
  details: string;
  ipAddress: string | null;
  createdAt: string;
}

type TabType = 'overview' | 'fleet' | 'stands' | 'devices' | 'students' | 'logs';

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
  const [bikes, setBikes] = useState<AdminBike[]>([]);
  const [stands, setStands] = useState<StandOccupancy[]>([]);
  const [devices, setDevices] = useState<AdminDevice[]>([]);
  const [students, setStudents] = useState<AdminStudent[]>([]);
  const [logs, setLogs] = useState<AuditLog[]>([]);

  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState<boolean>(true);
  const [currentTime, setCurrentTime] = useState<string>('');

  // Fleet search & filters
  const [bikeSearch, setBikeSearch] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Simulator Console command log
  const [consoleLogs, setConsoleLogs] = useState<Array<{ text: string; time: string; type: string }>>([
    { text: 'E-FLOW IoT Gateway initialized in SIMULATOR mode.', time: new Date().toLocaleTimeString(), type: 'info' },
    { text: 'Heartbeat daemon listening for ESP32 lock pings.', time: new Date().toLocaleTimeString(), type: 'info' },
  ]);

  // Stand edit modal
  const [editingStand, setEditingStand] = useState<StandOccupancy | null>(null);
  const [standCapacity, setStandCapacity] = useState<number>(10);
  const [standRadius, setStandRadius] = useState<number>(40);
  const [standActive, setStandActive] = useState<boolean>(true);

  // Bike relocate modal
  const [relocatingBike, setRelocatingBike] = useState<AdminBike | null>(null);
  const [targetStandId, setTargetStandId] = useState<string>('');

  // Live clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  const addConsoleLog = (text: string, type: 'info' | 'success' | 'warn' | 'error' = 'info') => {
    setConsoleLogs((prev) => [
      { text, time: new Date().toLocaleTimeString(), type },
      ...prev.slice(0, 49),
    ]);
  };

  const loadData = useCallback(async (isSilent = false) => {
    if (!isSilent) setRefreshing(true);
    setError(null);
    try {
      const [statsRes, bikesRes, standsRes, devicesRes, studentsRes, logsRes] = await Promise.all([
        apiClient.get<AdminDashboardStats>('/admin/dashboard'),
        apiClient.get<AdminBike[]>('/admin/bikes'),
        apiClient.get<StandOccupancy[]>('/admin/stands'),
        apiClient.get<AdminDevice[]>('/admin/devices'),
        apiClient.get<AdminStudent[]>('/admin/students'),
        apiClient.get<AuditLog[]>('/admin/audit-logs'),
      ]);

      setStats(statsRes.data);
      setBikes(bikesRes.data);
      setStands(standsRes.data);
      setDevices(devicesRes.data);
      setStudents(studentsRes.data);
      setLogs(logsRes.data);
    } catch (err: any) {
      if (!isSilent) {
        setError(err.response?.data?.message || 'Failed to sync live operational telemetry.');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Auto-refresh interval (10 seconds)
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      loadData(true);
    }, 10000);
    return () => clearInterval(interval);
  }, [autoRefresh, loadData]);

  // Bike Operations
  const handleUpdateBikeStatus = async (bikeId: string, newStatus: string) => {
    try {
      const res = await apiClient.put<AdminBike>(`/admin/bikes/${bikeId}/status`, {
        status: newStatus,
        reason: 'Updated from Fleet Operations Control',
      });
      setBikes((prev) => prev.map((b) => (b.id === bikeId ? res.data : b)));
      addConsoleLog(`[FLEET] Bike ${res.data.qrCode} status changed to ${newStatus}`, 'warn');
      loadData(true);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update bike status');
    }
  };

  const handleRechargeBattery = async (bikeId: string) => {
    try {
      const res = await apiClient.put<AdminBike>(`/admin/bikes/${bikeId}/battery`, { batteryLevel: 100 });
      setBikes((prev) => prev.map((b) => (b.id === bikeId ? res.data : b)));
      addConsoleLog(`[ENERGY] Fast charged bike ${res.data.qrCode} battery to 100%`, 'success');
      loadData(true);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update battery level');
    }
  };

  const handleRelocateBike = async () => {
    if (!relocatingBike || !targetStandId) return;
    try {
      const res = await apiClient.put<AdminBike>(`/admin/bikes/${relocatingBike.id}/stand`, {
        standId: targetStandId,
      });
      setBikes((prev) => prev.map((b) => (b.id === relocatingBike.id ? res.data : b)));
      addConsoleLog(`[DISPATCH] Relocated bike ${res.data.qrCode} to stand ${res.data.standName}`, 'info');
      setRelocatingBike(null);
      loadData(true);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to relocate bike');
    }
  };

  // Device / Smart Lock Operations
  const handleToggleDevice = async (deviceId: string, devCode: string) => {
    try {
      const res = await apiClient.post<AdminDevice>(`/admin/devices/${deviceId}/toggle-online`);
      setDevices((prev) => prev.map((d) => (d.id === deviceId ? res.data : d)));
      addConsoleLog(
        `[IOT-GATEWAY] Device ${devCode} connectivity flipped -> ${res.data.online ? 'ONLINE' : 'OFFLINE'}`,
        res.data.online ? 'success' : 'warn'
      );
      loadData(true);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to toggle device');
    }
  };

  const handleSendDeviceCommand = async (deviceId: string, devCode: string, commandType: 'UNLOCK' | 'LOCK' | 'PING') => {
    addConsoleLog(`[COMMAND] Transmitting ${commandType} command to ${devCode} with HMAC signature...`, 'info');
    try {
      const res = await apiClient.post<AdminDevice>(`/admin/devices/${deviceId}/command`, {
        commandType,
      });
      setDevices((prev) => prev.map((d) => (d.id === deviceId ? res.data : d)));
      addConsoleLog(
        `[ACK-RECEIVED] ${devCode} confirmed ${commandType}. Sensor State: ${res.data.lockState}`,
        'success'
      );
      loadData(true);
    } catch (err: any) {
      addConsoleLog(`[TIMEOUT] Failed to dispatch command to ${devCode}: ${err.message}`, 'error');
    }
  };

  // Stand Operations
  const handleSaveStand = async () => {
    if (!editingStand) return;
    try {
      const res = await apiClient.put<StandOccupancy>(`/admin/stands/${editingStand.id}`, {
        capacity: standCapacity,
        returnRadiusMeters: standRadius,
        active: standActive,
      });
      setStands((prev) => prev.map((s) => (s.id === editingStand.id ? res.data : s)));
      addConsoleLog(`[GEOFENCE] Updated stand ${res.data.name} configuration (Radius: ${res.data.returnRadiusMeters}m)`, 'info');
      setEditingStand(null);
      loadData(true);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update stand');
    }
  };

  // Student Operations
  const handleToggleStudentRestriction = async (student: AdminStudent) => {
    const newRestricted = !student.restricted;
    const reason = newRestricted ? 'Admin manual safety hold' : 'Restrictions cleared';
    try {
      const res = await apiClient.put<AdminStudent>(`/admin/students/${student.id}/restrict`, {
        restricted: newRestricted,
        reason,
      });
      setStudents((prev) => prev.map((s) => (s.id === student.id ? res.data : s)));
      addConsoleLog(`[SECURITY] Student ${student.email} restricted status set to: ${newRestricted}`, newRestricted ? 'warn' : 'success');
      loadData(true);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update student restriction');
    }
  };

  // Filtered bikes list
  const filteredBikes = bikes.filter((b) => {
    const matchesSearch =
      b.qrCode.toLowerCase().includes(bikeSearch.toLowerCase()) ||
      b.standName.toLowerCase().includes(bikeSearch.toLowerCase()) ||
      b.deviceId.toLowerCase().includes(bikeSearch.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || b.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans">
      {/* Top Navigation & Status Bar */}
      <header className="bg-slate-950/80 border-b border-slate-800 backdrop-blur sticky top-0 z-30 px-4 py-3">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-3">
          <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-start">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-blue-600/20 text-blue-400 border border-blue-500/30 rounded-xl">
                <Bike size={22} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="font-extrabold text-base tracking-tight text-white">E-FLOW</h1>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-950 text-blue-300 border border-blue-800 font-semibold">
                    COMMAND CENTER
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">SSN College Campus Fleet Telemetry • v1.0-LIVE</p>
              </div>
            </div>

            <div className="flex items-center gap-2 md:hidden">
              <button
                onClick={() => navigate('/dashboard')}
                className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 px-2.5 py-1.5 rounded-lg border border-slate-700"
              >
                Student View
              </button>
            </div>
          </div>

          {/* Real-time telemetry indicators */}
          <div className="flex items-center gap-3 text-xs w-full md:w-auto justify-between md:justify-end">
            <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="font-mono text-emerald-400 font-bold">SYSTEM ONLINE</span>
              <span className="text-slate-500">|</span>
              <span className="font-mono text-slate-300">{currentTime || '--:--:--'}</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={`px-2.5 py-1.5 rounded-lg border text-xs font-medium flex items-center gap-1.5 transition ${
                  autoRefresh
                    ? 'bg-blue-950/60 border-blue-700 text-blue-300'
                    : 'bg-slate-800 border-slate-700 text-slate-400'
                }`}
                title="Toggle 10-second automatic polling"
              >
                <Activity size={13} className={autoRefresh ? 'text-blue-400 animate-pulse' : ''} />
                <span>{autoRefresh ? 'Auto-Sync On' : 'Auto-Sync Off'}</span>
              </button>

              <button
                onClick={() => loadData(false)}
                disabled={refreshing}
                className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 transition"
                title="Refresh All Operational Metrics"
              >
                <RefreshCw size={15} className={refreshing ? 'animate-spin text-blue-400' : ''} />
              </button>

              <button
                onClick={() => navigate('/dashboard')}
                className="hidden sm:flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-lg border border-slate-700 font-medium text-xs transition"
              >
                <ExternalLink size={13} /> Student App
              </button>

              {user?.name && (
                <span className="hidden lg:inline text-xs font-semibold text-slate-300 px-2 py-1 bg-slate-900 border border-slate-800 rounded-lg">
                  {user.name}
                </span>
              )}

              <button
                onClick={logout}
                className="p-1.5 bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 rounded-lg border border-rose-800 transition"
                title="Logout"
              >
                <LogOut size={15} />
              </button>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="max-w-7xl mx-auto mt-3 flex items-center gap-1 overflow-x-auto border-t border-slate-800/80 pt-2.5 scrollbar-none">
          {[
            { id: 'overview', label: 'Live Operations', icon: Activity },
            { id: 'fleet', label: `E-Bike Fleet (${bikes.length})`, icon: Bike },
            { id: 'stands', label: `Stands & Zones (${stands.length})`, icon: MapPin },
            { id: 'devices', label: `IoT Smart Locks (${devices.length})`, icon: Radio },
            { id: 'students', label: `Students (${students.length})`, icon: Users },
            { id: 'logs', label: 'Security & Audit Logs', icon: Terminal },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Icon size={14} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </header>

      {/* Main Command Center Body */}
      <main className="max-w-7xl mx-auto w-full p-4 sm:p-6 flex-1 space-y-6">
        {error && (
          <div className="p-3 bg-rose-950/60 border border-rose-700 text-rose-200 rounded-xl text-xs flex items-center justify-between">
            <span className="flex items-center gap-2">
              <AlertTriangle size={16} className="text-rose-400 shrink-0" />
              {error}
            </span>
            <button onClick={() => loadData(false)} className="underline font-bold">
              Retry
            </button>
          </div>
        )}

        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center">
            <LoadingSpinner size={32} message="Initializing E-FLOW Fleet Command Center..." />
          </div>
        ) : (
          <>
            {/* TAB 1: OVERVIEW & LIVE OPS */}
            {activeTab === 'overview' && stats && (
              <div className="space-y-6">
                {/* Primary Metric KPI Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
                  {/* Total Fleet */}
                  <div className="bg-slate-800/80 border border-slate-700/80 p-4 rounded-xl">
                    <div className="flex justify-between items-start">
                      <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Total Fleet</span>
                      <Bike size={18} className="text-blue-400" />
                    </div>
                    <div className="mt-2 flex items-baseline gap-2">
                      <span className="text-2xl font-extrabold text-white">{stats.totalBikes}</span>
                      <span className="text-xs text-emerald-400 font-semibold">{stats.availableBikes} Ready</span>
                    </div>
                    <div className="mt-2 text-[10px] text-slate-400 flex justify-between">
                      <span>In Use: {stats.inUseBikes}</span>
                      <span>Maint: {stats.maintenanceBikes}</span>
                    </div>
                  </div>

                  {/* Active Rides */}
                  <div className="bg-slate-800/80 border border-slate-700/80 p-4 rounded-xl">
                    <div className="flex justify-between items-start">
                      <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Active Rides</span>
                      <Activity size={18} className="text-emerald-400" />
                    </div>
                    <div className="mt-2 flex items-baseline gap-2">
                      <span className="text-2xl font-extrabold text-white">{stats.activeRidesCount}</span>
                      <span className="text-xs text-slate-400">On Campus</span>
                    </div>
                    <div className="mt-2 text-[10px] text-slate-400">
                      Live GPS Geofenced Session Tracking
                    </div>
                  </div>

                  {/* Smart Locks Online */}
                  <div className="bg-slate-800/80 border border-slate-700/80 p-4 rounded-xl">
                    <div className="flex justify-between items-start">
                      <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">IoT Locks</span>
                      <Radio size={18} className={stats.offlineDevices > 0 ? 'text-amber-400' : 'text-emerald-400'} />
                    </div>
                    <div className="mt-2 flex items-baseline gap-2">
                      <span className="text-2xl font-extrabold text-white">
                        {stats.onlineDevices}/{stats.totalDevices}
                      </span>
                      <span className="text-xs text-emerald-400">Online</span>
                    </div>
                    <div className="mt-2 text-[10px] text-slate-400">
                      {stats.offlineDevices > 0 ? (
                        <span className="text-amber-400 font-bold">{stats.offlineDevices} offline device(s)</span>
                      ) : (
                        <span className="text-emerald-400">All 100% reachable</span>
                      )}
                    </div>
                  </div>

                  {/* Today Revenue */}
                  <div className="bg-slate-800/80 border border-slate-700/80 p-4 rounded-xl">
                    <div className="flex justify-between items-start">
                      <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Today's Revenue</span>
                      <IndianRupee size={18} className="text-green-400" />
                    </div>
                    <div className="mt-2 flex items-baseline gap-1">
                      <span className="text-2xl font-extrabold text-emerald-400">₹{stats.todayRevenue}</span>
                    </div>
                    <div className="mt-2 text-[10px] text-slate-400">
                      Total: ₹{stats.totalRevenue}
                    </div>
                  </div>

                  {/* Campus Stands */}
                  <div className="bg-slate-800/80 border border-slate-700/80 p-4 rounded-xl">
                    <div className="flex justify-between items-start">
                      <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Campus Stands</span>
                      <MapPin size={18} className="text-purple-400" />
                    </div>
                    <div className="mt-2 flex items-baseline gap-2">
                      <span className="text-2xl font-extrabold text-white">{stats.activeStands}</span>
                      <span className="text-xs text-purple-300">Active</span>
                    </div>
                    <div className="mt-2 text-[10px] text-slate-400">
                      Default Radius: 40.0m
                    </div>
                  </div>

                  {/* Student Directory */}
                  <div className="bg-slate-800/80 border border-slate-700/80 p-4 rounded-xl">
                    <div className="flex justify-between items-start">
                      <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Students</span>
                      <Users size={18} className="text-blue-400" />
                    </div>
                    <div className="mt-2 flex items-baseline gap-2">
                      <span className="text-2xl font-extrabold text-white">{stats.totalStudents}</span>
                      {stats.restrictedStudents > 0 ? (
                        <span className="text-xs text-rose-400 font-bold">{stats.restrictedStudents} on hold</span>
                      ) : (
                        <span className="text-xs text-emerald-400">Verified</span>
                      )}
                    </div>
                    <div className="mt-2 text-[10px] text-slate-400">
                      @ssn.edu.in Institutional
                    </div>
                  </div>
                </div>

                {/* Operations Grid: Stands Occupancy & Real-Time Alerts */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Stand Distribution & Balancing */}
                  <div className="lg:col-span-2 bg-slate-800/60 border border-slate-700 rounded-2xl p-5 space-y-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <h2 className="font-bold text-sm text-white flex items-center gap-2">
                          <MapPin size={16} className="text-blue-400" /> Campus Stand Balancing & Live Occupancy
                        </h2>
                        <p className="text-xs text-slate-400 mt-0.5">Real-time dock capacity vs available e-bikes across SSN</p>
                      </div>
                      <button
                        onClick={() => setActiveTab('stands')}
                        className="text-xs text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-1"
                      >
                        Manage Stands <ArrowRight size={13} />
                      </button>
                    </div>

                    <div className="space-y-3.5 pt-2">
                      {stats.standOccupancies.map((stand) => (
                        <div key={stand.id} className="bg-slate-900/70 border border-slate-800 p-3.5 rounded-xl space-y-2">
                          <div className="flex justify-between items-center text-xs">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-white">{stand.name}</span>
                              <span className="text-[10px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
                                Geofence: {stand.returnRadiusMeters}m
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-200">
                                {stand.availableBikes} / {stand.capacity} Bikes
                              </span>
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                                  stand.availableBikes === 0
                                    ? 'bg-rose-950 text-rose-300 border border-rose-800'
                                    : stand.occupancyPercent >= 70
                                    ? 'bg-amber-950 text-amber-300 border border-amber-800'
                                    : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                                }`}
                              >
                                {stand.occupancyPercent}% Occupancy
                              </span>
                            </div>
                          </div>

                          {/* Occupancy Progress Bar */}
                          <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden flex">
                            <div
                              className={`h-full transition-all duration-500 ${
                                stand.availableBikes === 0
                                  ? 'bg-rose-500'
                                  : stand.occupancyPercent >= 70
                                  ? 'bg-amber-500'
                                  : 'bg-emerald-500'
                              }`}
                              style={{ width: `${Math.min(100, Math.max(5, stand.occupancyPercent))}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Operational Alerts & System Health */}
                  <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-5 space-y-4">
                    <div className="flex justify-between items-center">
                      <h2 className="font-bold text-sm text-white flex items-center gap-2">
                        <ShieldAlert size={16} className="text-amber-400" /> Operational Alerts & Incidents
                      </h2>
                      <span className="text-[10px] font-mono text-slate-400">
                        {stats.recentAlerts.length} Active
                      </span>
                    </div>

                    <div className="space-y-2.5 max-h-[340px] overflow-y-auto pr-1">
                      {stats.recentAlerts.length === 0 ? (
                        <div className="p-6 text-center text-slate-500 text-xs">
                          <CheckCircle2 size={32} className="mx-auto mb-2 text-emerald-500" />
                          <p>All fleet sensors & geofences reporting 100% normal.</p>
                        </div>
                      ) : (
                        stats.recentAlerts.map((alert) => (
                          <div
                            key={alert.id}
                            className={`p-3 rounded-xl border text-xs space-y-1 ${
                              alert.type === 'CRITICAL'
                                ? 'bg-rose-950/40 border-rose-800 text-rose-200'
                                : alert.type === 'WARNING'
                                ? 'bg-amber-950/40 border-amber-800 text-amber-200'
                                : 'bg-blue-950/40 border-blue-800 text-blue-200'
                            }`}
                          >
                            <div className="flex items-center justify-between font-bold">
                              <span>{alert.title}</span>
                              <span className="text-[10px] text-slate-400 font-normal">Just now</span>
                            </div>
                            <p className="text-[11px] text-slate-300 leading-relaxed">{alert.message}</p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: BIKE FLEET MANAGEMENT */}
            {activeTab === 'fleet' && (
              <div className="space-y-4">
                {/* Search & Filter Bar */}
                <div className="flex flex-col sm:flex-row justify-between gap-3 bg-slate-800/60 p-4 rounded-xl border border-slate-700">
                  <div className="relative flex-1 max-w-md">
                    <Search size={16} className="absolute left-3 top-3 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search QR code, stand name, or lock ID..."
                      value={bikeSearch}
                      onChange={(e) => setBikeSearch(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400 font-medium">Status Filter:</span>
                    {['ALL', 'AVAILABLE', 'IN_USE', 'MAINTENANCE'].map((status) => (
                      <button
                        key={status}
                        onClick={() => setStatusFilter(status)}
                        className={`text-xs px-2.5 py-1.5 rounded-lg font-semibold transition ${
                          statusFilter === status
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-900 border border-slate-700 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {status}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Bike Fleet Table */}
                <div className="bg-slate-800/60 border border-slate-700 rounded-xl overflow-hidden shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-900/90 text-slate-400 border-b border-slate-700 uppercase tracking-wider text-[10px]">
                        <tr>
                          <th className="p-3.5">Bike QR Code</th>
                          <th className="p-3.5">Current Stand</th>
                          <th className="p-3.5">Battery</th>
                          <th className="p-3.5">Ride Status</th>
                          <th className="p-3.5">Smart Lock</th>
                          <th className="p-3.5">Linked Device</th>
                          <th className="p-3.5 text-right">Fleet Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800">
                        {filteredBikes.map((bike) => (
                          <tr key={bike.id} className="hover:bg-slate-800/40 transition">
                            <td className="p-3.5 font-bold font-mono text-white flex items-center gap-2">
                              <Bike size={16} className="text-blue-400" />
                              {bike.qrCode}
                            </td>
                            <td className="p-3.5 text-slate-300">
                              <span className="flex items-center gap-1.5">
                                <MapPin size={13} className="text-purple-400" />
                                {bike.standName}
                              </span>
                            </td>
                            <td className="p-3.5">
                              <div className="flex items-center gap-2">
                                <div className="w-16 h-2 bg-slate-700 rounded-full overflow-hidden">
                                  <div
                                    className={`h-full ${
                                      bike.batteryLevel >= 50
                                        ? 'bg-emerald-500'
                                        : bike.batteryLevel >= 25
                                        ? 'bg-amber-500'
                                        : 'bg-rose-500'
                                    }`}
                                    style={{ width: `${bike.batteryLevel}%` }}
                                  />
                                </div>
                                <span className="font-mono text-slate-200 font-semibold">{bike.batteryLevel}%</span>
                              </div>
                            </td>
                            <td className="p-3.5">
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                  bike.status === 'AVAILABLE'
                                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                                    : bike.status === 'IN_USE'
                                    ? 'bg-blue-950 text-blue-300 border border-blue-800'
                                    : 'bg-rose-950 text-rose-300 border border-rose-800'
                                }`}
                              >
                                {bike.status}
                              </span>
                            </td>
                            <td className="p-3.5">
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1 w-fit ${
                                  bike.lockState === 'LOCKED'
                                    ? 'bg-slate-800 text-slate-300'
                                    : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                                }`}
                              >
                                {bike.lockState === 'LOCKED' ? <Lock size={11} /> : <Unlock size={11} />}
                                {bike.lockState}
                              </span>
                            </td>
                            <td className="p-3.5 font-mono text-[11px] text-slate-400">
                              <span className="flex items-center gap-1">
                                <span
                                  className={`w-1.5 h-1.5 rounded-full ${
                                    bike.deviceOnline ? 'bg-emerald-400' : 'bg-rose-400'
                                  }`}
                                />
                                {bike.deviceId}
                              </span>
                            </td>
                            <td className="p-3.5 text-right space-x-1.5">
                              <button
                                onClick={() =>
                                  handleUpdateBikeStatus(
                                    bike.id,
                                    bike.status === 'MAINTENANCE' ? 'AVAILABLE' : 'MAINTENANCE'
                                  )
                                }
                                className={`px-2.5 py-1 rounded text-[11px] font-semibold border transition ${
                                  bike.status === 'MAINTENANCE'
                                    ? 'bg-emerald-950/60 border-emerald-700 text-emerald-300 hover:bg-emerald-900/60'
                                    : 'bg-amber-950/60 border-amber-700 text-amber-300 hover:bg-amber-900/60'
                                }`}
                                title="Toggle Maintenance Mode"
                              >
                                <Wrench size={12} className="inline mr-1" />
                                {bike.status === 'MAINTENANCE' ? 'Restore' : 'Service'}
                              </button>

                              <button
                                onClick={() => handleRechargeBattery(bike.id)}
                                className="px-2.5 py-1 rounded text-[11px] font-semibold bg-blue-950/60 border border-blue-700 text-blue-300 hover:bg-blue-900/60"
                                title="Set Battery to 100%"
                              >
                                <BatteryCharging size={12} className="inline mr-1" /> Charge
                              </button>

                              <button
                                onClick={() => {
                                  setRelocatingBike(bike);
                                  setTargetStandId(stands[0]?.id || '');
                                }}
                                className="px-2.5 py-1 rounded text-[11px] font-semibold bg-slate-800 border border-slate-700 text-slate-200 hover:bg-slate-700"
                              >
                                Relocate
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: STANDS & GEOFENCES */}
            {activeTab === 'stands' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {stands.map((stand) => (
                    <div key={stand.id} className="bg-slate-800/60 border border-slate-700 rounded-2xl p-5 space-y-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-bold text-white text-base">{stand.name}</h3>
                          <span className="text-xs text-slate-400">Authorized Campus Geofence</span>
                        </div>
                        <span
                          className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${
                            stand.active ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-slate-800 text-slate-500'
                          }`}
                        >
                          {stand.active ? 'ACTIVE' : 'DISABLED'}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-xs bg-slate-900/60 p-3.5 rounded-xl border border-slate-800">
                        <div>
                          <span className="text-slate-400 block text-[11px]">Dock Capacity</span>
                          <strong className="text-white text-sm">{stand.capacity} E-Bikes</strong>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[11px]">Return Radius</span>
                          <strong className="text-blue-400 text-sm font-mono">{stand.returnRadiusMeters} meters</strong>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[11px]">Available Now</span>
                          <strong className="text-emerald-400 text-sm">{stand.availableBikes} Bikes</strong>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[11px]">Occupancy</span>
                          <strong className="text-slate-200 text-sm">{stand.occupancyPercent}%</strong>
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          setEditingStand(stand);
                          setStandCapacity(stand.capacity);
                          setStandRadius(Number(stand.returnRadiusMeters));
                          setStandActive(stand.active);
                        }}
                        className="btn-outline w-full py-2 text-xs font-bold text-center border-slate-700 text-slate-200 hover:bg-slate-700 hover:text-white"
                      >
                        <Sliders size={13} className="inline mr-1.5" /> Adjust Capacity & Geofence
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 4: IOT HARDWARE & SIMULATOR CONSOLE */}
            {activeTab === 'devices' && (
              <div className="space-y-6">
                {/* Simulator Console Banner */}
                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 sm:p-5">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-800 pb-3">
                    <div className="flex items-center gap-2">
                      <Terminal size={18} className="text-emerald-400" />
                      <h2 className="font-bold text-sm text-white">Smart Lock Device Simulator Console</h2>
                      <span className="text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-800 px-2 py-0.5 rounded font-mono font-bold">
                        ESP32 PROTOCOL READY
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Simulate smart lock hardware signals, timeouts, and sensor confirmations for faculty demos.
                    </p>
                  </div>

                  {/* Terminal Event Stream */}
                  <div className="mt-3 bg-slate-900 border border-slate-800/80 rounded-xl p-3 font-mono text-[11px] max-h-40 overflow-y-auto space-y-1">
                    {consoleLogs.map((log, idx) => (
                      <div key={idx} className="flex items-start gap-2">
                        <span className="text-slate-500 shrink-0">[{log.time}]</span>
                        <span
                          className={
                            log.type === 'success'
                              ? 'text-emerald-400'
                              : log.type === 'warn'
                              ? 'text-amber-400'
                              : log.type === 'error'
                              ? 'text-rose-400'
                              : 'text-slate-300'
                          }
                        >
                          {log.text}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Hardware Devices List */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {devices.map((dev) => (
                    <div key={dev.id} className="bg-slate-800/60 border border-slate-700 rounded-xl p-4 space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="text-[10px] uppercase font-mono text-slate-400 tracking-wider">Device ID</span>
                          <h3 className="font-bold text-sm font-mono text-white flex items-center gap-1.5 mt-0.5">
                            <Radio size={14} className={dev.online ? 'text-emerald-400' : 'text-rose-400'} />
                            {dev.deviceId}
                          </h3>
                        </div>
                        <button
                          onClick={() => handleToggleDevice(dev.id, dev.deviceId)}
                          className={`text-[10px] font-bold px-2 py-0.5 rounded border transition flex items-center gap-1 ${
                            dev.online
                              ? 'bg-emerald-950/80 border-emerald-700 text-emerald-300 hover:bg-emerald-900'
                              : 'bg-rose-950/80 border-rose-700 text-rose-300 hover:bg-rose-900'
                          }`}
                          title="Click to simulate device connection disconnect/reconnect"
                        >
                          {dev.online ? <Wifi size={10} /> : <WifiOff size={10} />}
                          {dev.online ? 'ONLINE' : 'OFFLINE'}
                        </button>
                      </div>

                      <div className="text-[11px] space-y-1 bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
                        <div className="flex justify-between">
                          <span className="text-slate-400">Linked Bike:</span>
                          <strong className="text-slate-200 font-mono">{dev.bikeQrCode}</strong>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Transport:</span>
                          <span className="font-mono text-blue-400">{dev.transport}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Lock Sensor:</span>
                          <strong className={dev.lockState === 'LOCKED' ? 'text-slate-300' : 'text-emerald-400'}>
                            {dev.lockState}
                          </strong>
                        </div>
                      </div>

                      {/* Direct Hardware Commands */}
                      <div className="grid grid-cols-2 gap-2 pt-1">
                        <button
                          onClick={() => handleSendDeviceCommand(dev.id, dev.deviceId, 'UNLOCK')}
                          disabled={!dev.online}
                          className="py-1.5 bg-emerald-950/70 hover:bg-emerald-900/80 disabled:opacity-40 text-emerald-300 border border-emerald-700 rounded text-[11px] font-bold transition flex items-center justify-center gap-1"
                        >
                          <Unlock size={12} /> Force Unlock
                        </button>
                        <button
                          onClick={() => handleSendDeviceCommand(dev.id, dev.deviceId, 'LOCK')}
                          disabled={!dev.online}
                          className="py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 border border-slate-700 rounded text-[11px] font-bold transition flex items-center justify-center gap-1"
                        >
                          <Lock size={12} /> Force Lock
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 5: STUDENT DIRECTORY & SAFETY */}
            {activeTab === 'students' && (
              <div className="space-y-4">
                <div className="bg-slate-800/60 border border-slate-700 rounded-xl overflow-hidden shadow-sm">
                  <div className="p-4 border-b border-slate-700 flex justify-between items-center">
                    <div>
                      <h2 className="font-bold text-sm text-white">SSN Registered Students Directory</h2>
                      <p className="text-xs text-slate-400">Manage user verification, roles, and safety ride restrictions</p>
                    </div>
                    <span className="text-xs text-slate-400 bg-slate-900 px-3 py-1 rounded-lg border border-slate-800 font-semibold">
                      Total Accounts: {students.length}
                    </span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-900/90 text-slate-400 border-b border-slate-700 uppercase tracking-wider text-[10px]">
                        <tr>
                          <th className="p-3.5">Student Name</th>
                          <th className="p-3.5">Email (@ssn.edu.in)</th>
                          <th className="p-3.5">Role</th>
                          <th className="p-3.5">OTP Verified</th>
                          <th className="p-3.5">Safety Status</th>
                          <th className="p-3.5 text-right">Access Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800">
                        {students.map((student) => (
                          <tr key={student.id} className="hover:bg-slate-800/40 transition">
                            <td className="p-3.5 font-bold text-white">{student.name}</td>
                            <td className="p-3.5 font-mono text-slate-300">{student.email}</td>
                            <td className="p-3.5">
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                                  student.role === 'ADMIN'
                                    ? 'bg-purple-950 text-purple-300 border border-purple-800'
                                    : 'bg-slate-800 text-slate-300'
                                }`}
                              >
                                {student.role}
                              </span>
                            </td>
                            <td className="p-3.5">
                              {student.emailVerified ? (
                                <span className="text-emerald-400 font-semibold flex items-center gap-1">
                                  <CheckCircle2 size={13} /> Verified
                                </span>
                              ) : (
                                <span className="text-amber-400 font-semibold flex items-center gap-1">
                                  <Clock size={13} /> Pending OTP
                                </span>
                              )}
                            </td>
                            <td className="p-3.5">
                              {student.restricted ? (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800">
                                  RESTRICTED (BLOCKED)
                                </span>
                              ) : (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                                  ACTIVE (CLEARED)
                                </span>
                              )}
                            </td>
                            <td className="p-3.5 text-right">
                              {student.role !== 'ADMIN' && (
                                <button
                                  onClick={() => handleToggleStudentRestriction(student)}
                                  className={`px-3 py-1 rounded text-[11px] font-bold border transition ${
                                    student.restricted
                                      ? 'bg-emerald-950/70 border-emerald-700 text-emerald-300 hover:bg-emerald-900'
                                      : 'bg-rose-950/70 border-rose-700 text-rose-300 hover:bg-rose-900'
                                  }`}
                                >
                                  {student.restricted ? 'Unrestrict Student' : 'Restrict from Rides'}
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 6: AUDIT TRAIL & SYSTEM LOGS */}
            {activeTab === 'logs' && (
              <div className="space-y-4">
                <div className="bg-slate-800/60 border border-slate-700 rounded-xl overflow-hidden shadow-sm">
                  <div className="p-4 border-b border-slate-700 flex justify-between items-center">
                    <div>
                      <h2 className="font-bold text-sm text-white">Security & Hardware Audit Trail</h2>
                      <p className="text-xs text-slate-400">Immutable ledger of sensitive lock, ride, and admin operations</p>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400">Latest 50 Entries</span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-900/90 text-slate-400 border-b border-slate-700 uppercase tracking-wider text-[10px]">
                        <tr>
                          <th className="p-3.5">Timestamp</th>
                          <th className="p-3.5">Actor</th>
                          <th className="p-3.5">Action Code</th>
                          <th className="p-3.5">Target Entity</th>
                          <th className="p-3.5">Operation Details</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800 font-mono text-[11px]">
                        {logs.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="p-8 text-center text-slate-500">
                              No security events logged yet. Operations will appear here live.
                            </td>
                          </tr>
                        ) : (
                          logs.map((log) => (
                            <tr key={log.id} className="hover:bg-slate-800/40 transition">
                              <td className="p-3.5 text-slate-400 whitespace-nowrap">
                                {new Date(log.createdAt).toLocaleTimeString()}
                              </td>
                              <td className="p-3.5">
                                <span className="font-bold text-blue-400">[{log.actorType}]</span>
                              </td>
                              <td className="p-3.5 font-bold text-white">{log.action}</td>
                              <td className="p-3.5 text-purple-300">{log.entityType || 'SYSTEM'}</td>
                              <td className="p-3.5 text-slate-300 font-sans text-xs">{log.details}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* Stand Configuration Modal */}
      {editingStand && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <h3 className="font-bold text-base text-white">Configure Stand: {editingStand.name}</h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Dock Capacity (Total E-Bikes)</label>
                <input
                  type="number"
                  min={1}
                  max={50}
                  value={standCapacity}
                  onChange={(e) => setStandCapacity(parseInt(e.target.value, 10))}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Authorized Return Geofence Radius (Meters)</label>
                <input
                  type="number"
                  min={10}
                  max={100}
                  value={standRadius}
                  onChange={(e) => setStandRadius(parseFloat(e.target.value))}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
                />
                <span className="text-[10px] text-slate-500 mt-1 block">
                  Recommended: 40m (accounts for consumer smartphone GPS inaccuracy)
                </span>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="standActiveCheck"
                  checked={standActive}
                  onChange={(e) => setStandActive(e.target.checked)}
                  className="rounded border-slate-700 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="standActiveCheck" className="text-slate-300 cursor-pointer">
                  Stand is Active for Student Rentals & Returns
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                onClick={() => setEditingStand(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveStand}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg shadow-sm"
              >
                Save Configuration
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bike Relocate Modal */}
      {relocatingBike && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <h3 className="font-bold text-base text-white">Relocate Bike: {relocatingBike.qrCode}</h3>
            <p className="text-xs text-slate-400">
              Currently assigned to: <strong className="text-white">{relocatingBike.standName}</strong>
            </p>

            <div className="text-xs">
              <label className="block text-slate-400 mb-1">Target Campus Stand</label>
              <select
                value={targetStandId}
                onChange={(e) => setTargetStandId(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
              >
                {stands.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.availableBikes}/{s.capacity} docked)
                  </option>
                ))}
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                onClick={() => setRelocatingBike(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleRelocateBike}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg"
              >
                Confirm Dispatch
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
