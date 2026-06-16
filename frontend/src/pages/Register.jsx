import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import gsap from 'gsap';
import { User, Mail, Lock, Loader2, BarChart2, ArrowLeft } from 'lucide-react';
import API from '../utils/api';

const Register = () => {
  const [name,     setName]     = useState('');
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');

  const navigate = useNavigate();
  const cardRef  = useRef(null);

  useEffect(() => {
    gsap.fromTo(
      cardRef.current,
      { opacity: 0, y: 30 },
      { opacity: 1, y: 0, duration: 0.7, ease: 'power3.out' }
    );
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await API.post('/auth/register', { name, email, password });
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-6"
      style={{ background: 'var(--bg-page)' }}
    >
      <div ref={cardRef} className="w-full max-w-md">

        
        <div className="flex items-center gap-3 mb-8">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: 'var(--accent)' }}
          >
            <BarChart2 size={20} className="text-white" />
          </div>
          <div>
            <p className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>Vortex Control</p>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Admin Panel</p>
          </div>
        </div>

        
        <div className="card p-8">
          <div className="mb-6">
            <h2 className="text-2xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
              Create an account
            </h2>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Register a new admin or manager account
            </p>
          </div>

          {error && (
            <div
              className="mb-5 px-4 py-3 rounded-xl text-sm"
              style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c' }}
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Full Name
              </label>
              <div className="relative">
                <User size={15} className="absolute left-3.5 top-3" style={{ color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="input-base"
                  style={{ paddingLeft: '36px' }}
                  placeholder="John Doe"
                />
              </div>
            </div>

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
                  placeholder="john@company.com"
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
                  placeholder="Min. 6 characters"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full justify-center"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Creating account...
                </>
              ) : (
                'Create Account'
              )}
            </button>
          </form>

          <p className="mt-5 text-center text-sm" style={{ color: 'var(--text-secondary)' }}>
            Already have an account?{' '}
            <Link to="/login" className="font-semibold underline inline-flex items-center gap-1" style={{ color: 'var(--text-primary)' }}>
              <ArrowLeft size={13} />
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
