import { Bike, MapPin, Shield, Zap } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-[var(--color-primary)] text-white px-4 py-4">
        <div className="max-w-6xl mx-auto flex items-center gap-2">
          <Bike size={28} />
          <h1 className="text-xl font-bold">E-FLOW</h1>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-4 py-12">
        <div className="max-w-2xl text-center">
          <h2 className="text-4xl font-bold text-[var(--color-primary)] mb-4">
            Campus E-Bike Rental
          </h2>
          <p className="text-lg text-[var(--color-text-secondary)] mb-8">
            Rent an e-bike from any stand on campus. Fast, affordable,
            and eco-friendly transportation for SSN College of Engineering.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <a href="/login" className="btn-primary text-lg px-8 py-3 text-center">
              Log In
            </a>
            <a href="/register" className="btn-outline text-lg px-8 py-3 text-center">
              Register
            </a>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-8">
            <div className="card flex flex-col items-center p-6">
              <MapPin className="text-[var(--color-accent)] mb-3" size={32} />
              <h3 className="font-semibold mb-1">Find Nearby Stands</h3>
              <p className="text-sm text-[var(--color-text-secondary)]">
                Locate available bikes at stands across campus
              </p>
            </div>
            <div className="card flex flex-col items-center p-6">
              <Zap className="text-[var(--color-accent)] mb-3" size={32} />
              <h3 className="font-semibold mb-1">Instant Unlock</h3>
              <p className="text-sm text-[var(--color-text-secondary)]">
                Start your ride with one tap — smart locks do the rest
              </p>
            </div>
            <div className="card flex flex-col items-center p-6">
              <Shield className="text-[var(--color-accent)] mb-3" size={32} />
              <h3 className="font-semibold mb-1">Secure & Affordable</h3>
              <p className="text-sm text-[var(--color-text-secondary)]">
                Pay only for what you use. Transparent pricing.
              </p>
            </div>
          </div>
        </div>
      </main>

      <footer className="bg-gray-100 border-t border-[var(--color-border)] px-4 py-4">
        <div className="max-w-6xl mx-auto text-center text-sm text-[var(--color-text-secondary)]">
          E-FLOW &copy; {new Date().getFullYear()} — SSN College of Engineering
        </div>
      </footer>
    </div>
  );
}
