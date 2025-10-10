'use client';
import { useState, useContext, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { UserContext } from '../context/UserContext';

interface RegisterResponse {
  _id: string;
  name: string;
  email: string;
  role: 'user' | 'musico';
  token: string;
  message?: string;
}

export default function RegisterPage() {
  const { loginUser } = useContext(UserContext);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'user' | 'artist'>('user');
  const [error, setError] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [needsVerification, setNeedsVerification] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleRegister = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const res = await fetch('https://backend-zoonito-6x8h.vercel.app/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, role }),
      });
      const data: RegisterResponse = await res.json();

      if (res.ok) {
        setNeedsVerification(true);
        alert(data.message ?? 'Se envió un código a tu email');
      } else {
        setError(data.message ?? 'Error en el registro');
      }
    } catch (err) {
      console.error(err);
      setError('Error en el servidor');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const res = await fetch('https://backend-zoonito-6x8h.vercel.app/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code: verificationCode }),
      });
      const data = await res.json();
      if (res.ok) {
        // Hacer login automático
        const loginRes = await fetch('https://backend-zoonito-6x8h.vercel.app/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });
        const userData: RegisterResponse = await loginRes.json();
        if (loginRes.ok) {
          loginUser(userData);
          router.push('/');
        }
      } else {
        setError(data.message ?? 'Código inválido');
      }
    } catch (err) {
      console.error(err);
      setError('Error en la verificación');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen animate-gradient-x relative overflow-hidden flex items-start justify-center p-4 pt-20">
      {/* Overlay para contraste */}
      <div className="absolute inset-0 bg-black/60 z-0"></div>

      {/* Efectos de fondo */}
      <div className="absolute top-20 left-20 w-72 h-72 bg-purple-500/20 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-20 right-20 w-96 h-96 bg-pink-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      
      {/* Contenedor del formulario */}
      <div className="relative z-10 w-full max-w-md">
        {/* Card principal */}
        <div className="glass-card p-8 space-y-6">
          {!needsVerification ? (
            <>
              {/* Header */}
              <div className="text-center space-y-2">
                <h1 className="text-3xl font-bold glow-text">Crear Cuenta</h1>
                <p className="text-sm glow-secondary">Únete a nuestra comunidad musical</p>
              </div>

              {/* Error message */}
              {error && (
                <div className="error-box">
                  <span className="text-xl">⚠️</span>
                  <p className="text-sm">{error}</p>
                </div>
              )}

              {/* Formulario */}
              <form onSubmit={handleRegister} className="space-y-5">
                {/* Name input */}
                <div className="input-group">
                  <label htmlFor="name" className="input-label">
                    Nombre
                  </label>
                  <div className="input-wrapper">
                    <span className="input-icon">👤</span>
                    <input
                      id="name"
                      type="text"
                      placeholder="Tu nombre completo"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="input-field"
                      required
                      disabled={isLoading}
                    />
                  </div>
                </div>

                {/* Email input */}
                <div className="input-group">
                  <label htmlFor="email" className="input-label">
                    Email
                  </label>
                  <div className="input-wrapper">
                    <span className="input-icon">📧</span>
                    <input
                      id="email"
                      type="email"
                      placeholder="tu@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="input-field"
                      required
                      disabled={isLoading}
                    />
                  </div>
                </div>

                {/* Password input */}
                <div className="input-group">
                  <label htmlFor="password" className="input-label">
                    Contraseña
                  </label>
                  <div className="input-wrapper">
                    <span className="input-icon">🔒</span>
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="input-field"
                      required
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="password-toggle"
                      disabled={isLoading}
                      aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                    >
                      {showPassword ? '👁️' : '👁️‍🗨️'}
                    </button>
                  </div>
                </div>

                {/* Role select */}
                <div className="input-group">
                  <label htmlFor="role" className="input-label">
                    Tipo de Cuenta
                  </label>
                  <div className="input-wrapper">
                    <span className="input-icon">🎭</span>
                    <select
                      id="role"
                      value={role}
                      onChange={(e) => setRole(e.target.value as 'user' | 'artist')}
                      className="input-field"
                      disabled={isLoading}
                    >
                      <option value="user">👥 Usuario</option>
                      <option value="artist">🎸 Músico</option>
                    </select>
                  </div>
                </div>

                {/* Botón submit */}
                <button 
                  type="submit" 
                  className="submit-btn"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="loading-spinner"></span>
                      Registrando...
                    </span>
                  ) : (
                    'Registrarse'
                  )}
                </button>
              </form>

              {/* Footer */}
              <div className="text-center space-y-3 pt-4 border-t border-white/10">
                <p className="text-sm glow-secondary">
                  ¿Ya tienes cuenta?{' '}
                  <a href="/login" className="link-highlight">
                    Inicia sesión aquí
                  </a>
                </p>
              </div>
            </>
          ) : (
            <>
              {/* Header Verificación */}
              <div className="text-center space-y-2">
                <h1 className="text-3xl font-bold glow-text">Verificación</h1>
                <p className="text-sm glow-secondary">Revisa tu email e ingresa el código</p>
              </div>

              {/* Error message */}
              {error && (
                <div className="error-box">
                  <span className="text-xl">⚠️</span>
                  <p className="text-sm">{error}</p>
                </div>
              )}

              {/* Formulario de Verificación */}
              <form onSubmit={handleVerify} className="space-y-5">
                {/* Verification code input */}
                <div className="input-group">
                  <label htmlFor="code" className="input-label">
                    Código de Verificación
                  </label>
                  <div className="input-wrapper">
                    <span className="input-icon">🔑</span>
                    <input
                      id="code"
                      type="text"
                      placeholder="123456"
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value)}
                      className="input-field"
                      required
                      disabled={isLoading}
                    />
                  </div>
                </div>

                {/* Botón verificar */}
                <button 
                  type="submit" 
                  className="submit-btn"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="loading-spinner"></span>
                      Verificando...
                    </span>
                  ) : (
                    'Verificar Código'
                  )}
                </button>
              </form>
            </>
          )}
        </div>
      </div>

      <style jsx>{`
        /* Input Groups */
        .input-group {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .input-label {
          font-size: 0.875rem;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.9);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .input-wrapper {
          position: relative;
          display: flex;
          align-items: center;
        }

        .input-icon {
          position: absolute;
          left: 1rem;
          font-size: 1.25rem;
          z-index: 10;
          pointer-events: none;
        }

        .input-field {
          width: 100%;
          padding: 0.875rem 3rem 0.875rem 3rem;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 0.75rem;
          color: white;
          font-size: 0.95rem;
          transition: all 0.3s ease;
          backdrop-filter: blur(8px);
        }

        .input-field::placeholder {
          color: rgba(255, 255, 255, 0.4);
        }

        .input-field:focus {
          outline: none;
          background: rgba(255, 255, 255, 0.08);
          border-color: #ff00dd;
          box-shadow: 
            0 0 0 3px rgba(255, 0, 221, 0.1),
            0 0 20px rgba(255, 0, 221, 0.3);
        }

        .input-field:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        /* Select styling */
        select.input-field {
          cursor: pointer;
          appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23ffffff' d='M6 9L1 4h10z'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 1rem center;
          padding-right: 3rem;
        }

        select.input-field option {
          background: #1a1a2e;
          color: white;
        }

        /* Password Toggle Button */
        .password-toggle {
          position: absolute;
          right: 1rem;
          background: transparent;
          border: none;
          font-size: 1.25rem;
          cursor: pointer;
          z-index: 10;
          padding: 0.25rem;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: opacity 0.3s ease;
        }

        .password-toggle:hover:not(:disabled) {
          opacity: 0.7;
        }

        .password-toggle:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }

        .password-toggle:active:not(:disabled) {
          transform: scale(0.95);
        }

        /* Submit Button */
        .submit-btn {
          width: 100%;
          padding: 1rem;
          background: linear-gradient(135deg, #00d4ff, #ff00dd);
          border: none;
          border-radius: 0.75rem;
          color: white;
          font-size: 1rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          cursor: pointer;
          transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          position: relative;
          overflow: hidden;
        }

        .submit-btn::before {
          content: '';
          position: absolute;
          inset: -2px;
          background: linear-gradient(135deg, #00d4ff, #ff00dd);
          opacity: 0;
          filter: blur(12px);
          transition: opacity 0.3s ease;
          z-index: -1;
        }

        .submit-btn:hover::before {
          opacity: 0.8;
        }

        .submit-btn:hover:not(:disabled) {
          transform: translateY(-3px) scale(1.02);
          box-shadow: 
            0 0 30px rgba(255, 0, 221, 0.6),
            0 0 50px rgba(0, 212, 255, 0.4),
            0 10px 25px rgba(0, 0, 0, 0.5);
        }

        .submit-btn:active:not(:disabled) {
          transform: translateY(0) scale(0.98);
        }

        .submit-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        /* Error Box */
        .error-box {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 1rem;
          background: rgba(239, 68, 68, 0.15);
          border: 1px solid rgba(239, 68, 68, 0.3);
          border-radius: 0.75rem;
          color: #fca5a5;
          backdrop-filter: blur(8px);
        }

        /* Link Highlight */
        .link-highlight {
          color: #ff00dd;
          text-decoration: none;
          font-weight: 600;
          transition: all 0.3s ease;
          position: relative;
        }

        .link-highlight::after {
          content: '';
          position: absolute;
          bottom: -2px;
          left: 0;
          width: 100%;
          height: 2px;
          background: linear-gradient(90deg, #00d4ff, #ff00dd);
          transform: scaleX(0);
          transition: transform 0.3s ease;
        }

        .link-highlight:hover {
          text-shadow: 0 0 10px rgba(255, 0, 221, 0.8);
        }

        .link-highlight:hover::after {
          transform: scaleX(1);
        }

        /* Loading Spinner */
        .loading-spinner {
          display: inline-block;
          width: 16px;
          height: 16px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        /* Animaciones de entrada */
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .glass-card {
          animation: fadeInUp 0.6s ease;
        }
      `}</style>
    </div>
  );
}