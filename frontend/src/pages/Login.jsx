import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import gsap from 'gsap';
import { Lock, Mail, Loader2, BarChart2, TrendingUp, ShieldCheck, Zap } from 'lucide-react';
import API from '../utils/api';

const features = [
  { icon: TrendingUp, title: 'Real-time Analytics', desc: 'Live revenue & inventory tracking' },
  { icon: ShieldCheck, title: 'Secure Access',       desc: 'JWT-protected admin dashboard' },
  { icon: Zap,         title: 'Lightning Fast',      desc: 'Optimized MERN stack performance' },
];

const Login = () => {
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');

  const navigate    = useNavigate();
  const formRef     = useRef(null);
  const leftRef     = useRef(null);

  useEffect(() => {
    if (localStorage.getItem('userInfo')) { navigate('/'); return; }

    gsap.fromTo(leftRef.current,
      { opacity: 0, x: -40 },
      { opacity: 1, x: 0, duration: 0.8, ease: 'power3.out' }
    );
    gsap.fromTo(formRef.current,
      { opacity: 0, y: 30 },
      { opacity: 1, y: 0, duration: 0.7, ease: 'power3.out', delay: 0.15 }
    );
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const { data } = await API.post('/auth/login', { email, password });
      localStorage.setItem('userInfo', JSON.stringify(data));
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--bg-page)' }}>

      
      <div
        ref={leftRef}
        className="hidden lg:flex flex-col justify-between w-[480px] flex-shrink-0 p-12 relative overflow-hidden"
        style={{ background: '#111827' }}
      >
      
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />

      
        <div className="flex items-center gap-3 z-10">
          <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center">
            <BarChart2 size={20} className="text-white" />
          </div>
          <span className="font-bold text-white text-lg">Vortex Control</span>
        </div>

      
        <div className="z-10 space-y-6">
          <div className="space-y-2">
            <h2 className="text-3xl font-bold text-white leading-tight">
              Manage everything<br />in one place.
            </h2>
            <p className="text-gray-400 text-sm">
              Your all-in-one inventory & order management terminal.
            </p>
          </div>
          <div className="space-y-4">
            {features.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Icon size={15} className="text-white" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{title}</p>
                  <p className="text-xs text-gray-400">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="text-xs text-gray-500 z-10">
          MERN Stack Platform · v4.0 · {new Date().getFullYear()}
        </p>
      </div>

      
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12">
        <div ref={formRef} className="w-full max-w-sm">

          
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: 'var(--accent)' }}
            >
              <BarChart2 size={18} className="text-white" />
            </div>
            <span className="font-bold text-base" style={{ color: 'var(--text-primary)' }}>Vortex Control</span>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>Welcome back</h2>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Sign in to your admin account</p>
          </div>

          {error && (
            <div
              className="mb-5 px-4 py-3 rounded-xl text-sm flex items-center gap-2"
              style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c' }}
            >
              <span className="font-medium">Error:</span> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Email Address
              </label>
              <div className="relative">
                <Mail size={15} className="absolute left-3.5 top-3" style={{ color: 'var(--text-muted)' }} />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-base"
                  style={{ paddingLeft: '36px' }}
                  placeholder="admin@vortex.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Password
              </label>
              <div className="relative">
                <Lock size={15} className="absolute left-3.5 top-3" style={{ color: 'var(--text-muted)' }} />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-base"
                  style={{ paddingLeft: '36px' }}
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full justify-center mt-2"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign in to Dashboard'
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-sm" style={{ color: 'var(--text-secondary)' }}>
            Don't have an account?{' '}
            <Link to="/register" className="font-semibold underline" style={{ color: 'var(--text-primary)' }}>
              Create one
            </Link>
          </p>
        </div>
      </div>

    </div>
  );
};

export default Login;