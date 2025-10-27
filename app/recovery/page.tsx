'use client';
import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';

type Step = 'email' | 'code' | 'password' | 'success';

export default function RecoveryPage() {
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState<string>('');
  const [code, setCode] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const router = useRouter();

  const handleRequestCode = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const res = await fetch('https://backend-zoonito-6x8h.vercel.app/api/auth/request-password-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (res.ok) {
        setStep('code');
      } else {
        setError(data.message ?? 'Error al enviar código');
      }
    } catch (err) {
      setError('Error en el servidor');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCode = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    if (code.length !== 6) {
      setError('El código debe tener 6 dígitos');
      return;
    }
    setStep('password');
  };

  const handleResetPassword = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    if (newPassword !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      setIsLoading(false);
      return;
    }

    if (newPassword.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch('https://backend-zoonito-6x8h.vercel.app/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code, newPassword }),
      });
      const data = await res.json();
      if (res.ok) {
        setStep('success');
      } else {
        setError(data.message ?? 'Error al restablecer contraseña');
      }
    } catch (err) {
      setError('Error en el servidor');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async (): Promise<void> => {
    setIsLoading(true);
    setError('');

    try {
      const res = await fetch('https://backend-zoonito-6x8h.vercel.app/api/auth/request-password-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (res.ok) {
        setError('');
        alert('Código reenviado correctamente');
      } else {
        setError(data.message ?? 'Error al reenviar código');
      }
    } catch (err) {
      setError('Error en el servidor');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen animate-gradient-x relative overflow-hidden flex items-center justify-center p-4">
      {/* Overlay para contraste */}
      <div className="absolute inset-0 bg-black/60 z-0"></div>

      {/* Efectos de fondo */}
      <div className="absolute top-20 left-20 w-72 h-72 bg-purple-500/20 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-20 right-20 w-96 h-96 bg-pink-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      
      {/* Contenedor del formulario */}
      <div className="relative z-10 w-full max-w-md">
        {/* Card principal */}
        <div className="glass-card p-8 space-y-6">
          {/* Header */}
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold glow-text">
              {step === 'email' && '🔑 Recuperar Contraseña'}
              {step === 'code' && '📧 Verificar Código'}
              {step === 'password' && '🔒 Nueva Contraseña'}
              {step === 'success' && '✅ ¡Listo!'}
            </h1>
            <p className="text-sm glow-secondary">
              {step === 'email' && 'Ingresa tu email para recibir el código'}
              {step === 'code' && 'Ingresa el código enviado a tu correo'}
              {step === 'password' && 'Crea una nueva contraseña segura'}
              {step === 'success' && 'Tu contraseña fue actualizada correctamente'}
            </p>
          </div>

          {/* Indicador de progreso */}
          {step !== 'success' && (
            <div className="progress-container">
              <div className="progress-bar">
                <div 
                  className="progress-fill"
                  style={{ 
                    width: step === 'email' ? '33%' : step === 'code' ? '66%' : '100%' 
                  }}
                ></div>
              </div>
              <div className="progress-labels">
                <span className={step === 'email' ? 'active' : 'inactive'}>Email</span>
                <span className={step === 'code' || step === 'password' ? 'active' : 'inactive'}>Código</span>
                <span className={step === 'password' ? 'active' : 'inactive'}>Contraseña</span>
              </div>
            </div>
          )}

          {/* Error message */}
          {error && (
            <div className="error-box">
              <span className="text-xl">⚠️</span>
              <p className="text-sm">{error}</p>
            </div>
          )}

          {/* STEP 1: Email */}
          {step === 'email' && (
            <form onSubmit={handleRequestCode} className="space-y-5">
              <div className="input-group">
                <label htmlFor="email" className="input-label">Email</label>
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

              <button type="submit" className="submit-btn" disabled={isLoading}>
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="loading-spinner"></span>
                    Enviando...
                  </span>
                ) : (
                  'Enviar Código'
                )}
              </button>
            </form>
          )}

          {/* STEP 2: Código */}
          {step === 'code' && (
            <form onSubmit={handleVerifyCode} className="space-y-5">
              <div className="input-group">
                <label htmlFor="code" className="input-label">Código de Verificación</label>
                <div className="input-wrapper">
                  <span className="input-icon">🔢</span>
                  <input
                    id="code"
                    type="text"
                    placeholder="000000"
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className="input-field code-input"
                    required
                    maxLength={6}
                    disabled={isLoading}
                  />
                </div>
              </div>

              <button type="submit" className="submit-btn" disabled={isLoading || code.length !== 6}>
                Verificar Código
              </button>

              <button 
                type="button" 
                onClick={handleResendCode}
                className="text-btn"
                disabled={isLoading}
              >
                ¿No recibiste el código? Reenviar
              </button>
            </form>
          )}

          {/* STEP 3: Nueva Contraseña */}
          {step === 'password' && (
            <form onSubmit={handleResetPassword} className="space-y-5">
              <div className="input-group">
                <label htmlFor="newPassword" className="input-label">Nueva Contraseña</label>
                <div className="input-wrapper">
                  <span className="input-icon">🔒</span>
                  <input
                    id="newPassword"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="input-field"
                    required
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="password-toggle"
                    disabled={isLoading}
                  >
                    {showPassword ? '👁️' : '👁️‍🗨️'}
                  </button>
                </div>
              </div>

              <div className="input-group">
                <label htmlFor="confirmPassword" className="input-label">Confirmar Contraseña</label>
                <div className="input-wrapper">
                  <span className="input-icon">🔒</span>
                  <input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="input-field"
                    required
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="password-toggle"
                    disabled={isLoading}
                  >
                    {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
                  </button>
                </div>
              </div>

              <button type="submit" className="submit-btn" disabled={isLoading}>
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="loading-spinner"></span>
                    Actualizando...
                  </span>
                ) : (
                  'Restablecer Contraseña'
                )}
              </button>
            </form>
          )}

          {/* STEP 4: Éxito */}
          {step === 'success' && (
            <div className="success-container">
              <div className="success-icon">✨</div>
              <p className="success-text">
                Tu contraseña ha sido actualizada exitosamente. Ya puedes iniciar sesión con tu nueva contraseña.
              </p>
              <button 
                onClick={() => router.push('/login')}
                className="submit-btn"
              >
                Ir al Login
              </button>
            </div>
          )}

          {/* Footer */}
          {step !== 'success' && (
            <div className="text-center space-y-3 pt-4 border-t border-white/10">
              <p className="text-sm glow-secondary">
                ¿Recordaste tu contraseña?{' '}
                <a href="/login" className="link-highlight">
                  Inicia sesión
                </a>
              </p>
            </div>
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

        .code-input {
          text-align: center;
          letter-spacing: 0.5rem;
          font-size: 1.5rem;
          font-weight: bold;
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

        .text-btn {
          width: 100%;
          padding: 0.75rem;
          background: transparent;
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 0.75rem;
          color: rgba(255, 255, 255, 0.8);
          font-size: 0.875rem;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .text-btn:hover:not(:disabled) {
          background: rgba(255, 255, 255, 0.05);
          border-color: rgba(255, 255, 255, 0.3);
        }

        .text-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

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

        .progress-container {
          margin: 1rem 0;
        }

        .progress-bar {
          width: 100%;
          height: 4px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 2px;
          overflow: hidden;
        }

        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #00d4ff, #ff00dd);
          transition: width 0.5s ease;
        }

        .progress-labels {
          display: flex;
          justify-content: space-between;
          margin-top: 0.5rem;
          font-size: 0.75rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .progress-labels .active {
          color: #ff00dd;
          font-weight: 600;
        }

        .progress-labels .inactive {
          color: rgba(255, 255, 255, 0.3);
        }

        .success-container {
          text-align: center;
          padding: 2rem 0;
        }

        .success-icon {
          font-size: 4rem;
          animation: bounce 1s ease infinite;
        }

        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }

        .success-text {
          margin: 1.5rem 0;
          color: rgba(255, 255, 255, 0.9);
          line-height: 1.6;
        }

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