// 'use client';
// import { useState, useContext, FormEvent } from 'react';
// import { useRouter } from 'next/navigation';
// import { UserContext } from '../context/UserContext';

// interface LoginResponse {
//   name: string;
//   email: string;
//   token?: string;
// }

// export default function LoginPage() {
//   const { loginUser } = useContext(UserContext);
//   const [email, setEmail] = useState<string>('');
//   const [password, setPassword] = useState<string>('');
//   const [showPassword, setShowPassword] = useState<boolean>(false);
//   const [error, setError] = useState<string>('');
//   const [isLoading, setIsLoading] = useState<boolean>(false);
//   const router = useRouter();

// const handleLogin = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
//   e.preventDefault();
//   setIsLoading(true);
//   setError('');

//   try {
//     const res = await fetch('https://backend-zoonito-6x8h.vercel.app/api/auth/login', {
//       method: 'POST',
//       headers: { 'Content-Type': 'application/json' },
//       body: JSON.stringify({ email, password }),
//     });
//     const data: LoginResponse & { message?: string } = await res.json();
//     if (res.ok) {
//       loginUser(data);
//       window.location.href = '/'; 
//     } else {
//       setError(data.message ?? 'Error al iniciar sesión');
//     }
//   } catch (err) {
//     setError('Error en el servidor');
//     console.error(err);
//   } finally {
//     setIsLoading(false);
//   }
// };

//   return (
//     <div className="min-h-screen animate-gradient-x relative overflow-hidden flex items-center justify-center p-4">
//       {/* Overlay para contraste */}
//       <div className="absolute inset-0 bg-black/60 z-0"></div>

//       {/* Efectos de fondo */}
//       <div className="absolute top-20 left-20 w-72 h-72 bg-purple-500/20 rounded-full blur-3xl animate-pulse"></div>
//       <div className="absolute bottom-20 right-20 w-96 h-96 bg-pink-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      
//       {/* Contenedor del formulario */}
//       <div className="relative z-10 w-full max-w-md">
//         {/* Card principal */}
//         <div className="glass-card p-8 space-y-6">
//           {/* Header */}
//           <div className="text-center space-y-2">
//             <p className="text-sm glow-secondary">Ingresa a tu cuenta para continuar</p>
//           </div>

//           {/* Error message */}
//           {error && (
//             <div className="error-box">
//               <span className="text-xl">⚠️</span>
//               <p className="text-sm">{error}</p>
//             </div>
//           )}

//           {/* Formulario */}
//           <form onSubmit={handleLogin} className="space-y-5">
//             {/* Email input */}
//             <div className="input-group">
//               <label htmlFor="email" className="input-label">
//                 Email
//               </label>
//               <div className="input-wrapper">
//                 <span className="input-icon">📧</span>
//                 <input
//                   id="email"
//                   type="email"
//                   placeholder="tu@email.com"
//                   value={email}
//                   onChange={(e) => setEmail(e.target.value)}
//                   className="input-field"
//                   required
//                   disabled={isLoading}
//                 />
//               </div>
//             </div>

//             {/* Password input */}
//             <div className="input-group">
//               <label htmlFor="password" className="input-label">
//                 Contraseña
//               </label>
//               <div className="input-wrapper">
//                 <span className="input-icon">🔒</span>
//                 <input
//                   id="password"
//                   type={showPassword ? "text" : "password"}
//                   placeholder="••••••••"
//                   value={password}
//                   onChange={(e) => setPassword(e.target.value)}
//                   className="input-field"
//                   required
//                   disabled={isLoading}
//                 />
//                 <button
//                   type="button"
//                   onClick={() => setShowPassword(!showPassword)}
//                   className="password-toggle"
//                   disabled={isLoading}
//                   aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
//                 >
//                   {showPassword ? '👁️' : '👁️‍🗨️'}
//                 </button>
//               </div>
//             </div>

//             {/* Botón submit */}
//             <button 
//               type="submit" 
//               className="submit-btn"
//               disabled={isLoading}
//             >
//               {isLoading ? (
//                 <span className="flex items-center justify-center gap-2">
//                   <span className="loading-spinner"></span>
//                   Ingresando...
//                 </span>
//               ) : (
//                 'Ingresar'
//               )}
//             </button>
//           </form>

//           {/* Footer */}
//           <div className="text-center space-y-3 pt-4 border-t border-white/10">
//             <p className="text-sm glow-secondary">
//               ¿No tienes cuenta?{' '}
//               <a href="/register" className="link-highlight">
//                 Regístrate aquí
//               </a>
//             </p>
//              <a href="/recovery" className="link-highlight">
//               ¿Olvidaste tu contraseña?
//             </a>
//           </div>
//         </div>
//       </div>

//       <style jsx>{`
//         /* Input Groups */
//         .input-group {
//           display: flex;
//           flex-direction: column;
//           gap: 0.5rem;
//         }

//         .input-label {
//           font-size: 0.875rem;
//           font-weight: 600;
//           color: rgba(255, 255, 255, 0.9);
//           text-transform: uppercase;
//           letter-spacing: 0.05em;
//         }

//         .input-wrapper {
//           position: relative;
//           display: flex;
//           align-items: center;
//         }

//         .input-icon {
//           position: absolute;
//           left: 1rem;
//           font-size: 1.25rem;
//           z-index: 10;
//           pointer-events: none;
//         }

//         .input-field {
//           width: 100%;
//           padding: 0.875rem 3rem 0.875rem 3rem;
//           background: rgba(255, 255, 255, 0.05);
//           border: 1px solid rgba(255, 255, 255, 0.1);
//           border-radius: 0.75rem;
//           color: white;
//           font-size: 0.95rem;
//           transition: all 0.3s ease;
//           backdrop-filter: blur(8px);
//         }

//         .input-field::placeholder {
//           color: rgba(255, 255, 255, 0.4);
//         }

//         .input-field:focus {
//           outline: none;
//           background: rgba(255, 255, 255, 0.08);
//           border-color: #ff00dd;
//           box-shadow: 
//             0 0 0 3px rgba(255, 0, 221, 0.1),
//             0 0 20px rgba(255, 0, 221, 0.3);
//         }

//         .input-field:disabled {
//           opacity: 0.6;
//           cursor: not-allowed;
//         }

//         /* Password Toggle Button */
//         .password-toggle {
//           position: absolute;
//           right: 1rem;
//           background: transparent;
//           border: none;
//           font-size: 1.25rem;
//           cursor: pointer;
//           z-index: 10;
//           padding: 0.25rem;
//           display: flex;
//           align-items: center;
//           justify-content: center;
//           transition: opacity 0.3s ease;
//         }

//         .password-toggle:hover:not(:disabled) {
//           opacity: 0.7;
//         }

//         .password-toggle:disabled {
//           opacity: 0.4;
//           cursor: not-allowed;
//         }

//         .password-toggle:active:not(:disabled) {
//           transform: scale(0.95);
//         }

//         /* Submit Button */
//         .submit-btn {
//           width: 100%;
//           padding: 1rem;
//           background: linear-gradient(135deg, #00d4ff, #ff00dd);
//           border: none;
//           border-radius: 0.75rem;
//           color: white;
//           font-size: 1rem;
//           font-weight: 700;
//           text-transform: uppercase;
//           letter-spacing: 0.05em;
//           cursor: pointer;
//           transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
//           position: relative;
//           overflow: hidden;
//         }

//         .submit-btn::before {
//           content: '';
//           position: absolute;
//           inset: -2px;
//           background: linear-gradient(135deg, #00d4ff, #ff00dd);
//           opacity: 0;
//           filter: blur(12px);
//           transition: opacity 0.3s ease;
//           z-index: -1;
//         }

//         .submit-btn:hover::before {
//           opacity: 0.8;
//         }

//         .submit-btn:hover:not(:disabled) {
//           transform: translateY(-3px) scale(1.02);
//           box-shadow: 
//             0 0 30px rgba(255, 0, 221, 0.6),
//             0 0 50px rgba(0, 212, 255, 0.4),
//             0 10px 25px rgba(0, 0, 0, 0.5);
//         }

//         .submit-btn:active:not(:disabled) {
//           transform: translateY(0) scale(0.98);
//         }

//         .submit-btn:disabled {
//           opacity: 0.7;
//           cursor: not-allowed;
//         }

//         /* Error Box */
//         .error-box {
//           display: flex;
//           align-items: center;
//           gap: 0.75rem;
//           padding: 1rem;
//           background: rgba(239, 68, 68, 0.15);
//           border: 1px solid rgba(239, 68, 68, 0.3);
//           border-radius: 0.75rem;
//           color: #fca5a5;
//           backdrop-filter: blur(8px);
//           {/* animation: shake 0.5s ease; */}
//         }

//         @keyframes shake {
//           0%, 100% { transform: translateX(0); }
//           25% { transform: translateX(-10px); }
//           75% { transform: translateX(10px); }
//         }

//         /* Link Highlight */
//         .link-highlight {
//           color: #ff00dd;
//           text-decoration: none;
//           font-weight: 600;
//           transition: all 0.3s ease;
//           position: relative;
//         }

//         .link-highlight::after {
//           content: '';
//           position: absolute;
//           bottom: -2px;
//           left: 0;
//           width: 100%;
//           height: 2px;
//           background: linear-gradient(90deg, #00d4ff, #ff00dd);
//           transform: scaleX(0);
//           transition: transform 0.3s ease;
//         }

//         .link-highlight:hover {
//           text-shadow: 0 0 10px rgba(255, 0, 221, 0.8);
//         }

//         .link-highlight:hover::after {
//           transform: scaleX(1);
//         }

//         /* Loading Spinner */
//         .loading-spinner {
//           display: inline-block;
//           width: 16px;
//           height: 16px;
//           border: 2px solid rgba(255, 255, 255, 0.3);
//           border-top-color: white;
//           border-radius: 50%;
//           animation: spin 0.8s linear infinite;
//         }

//         @keyframes spin {
//           to { transform: rotate(360deg); }
//         }

//         /* Animaciones de entrada */
//         @keyframes fadeInUp {
//           from {
//             opacity: 0;
//             transform: translateY(20px);
//           }
//           to {
//             opacity: 1;
//             transform: translateY(0);
//           }
//         }

//         .glass-card {
//           animation: fadeInUp 0.6s ease;
//         }
//       `}</style>
//     </div>
//   );

// }



"use client";
import React, { useState, ChangeEvent, FormEvent, useEffect } from "react";
import { Eye, EyeOff } from "lucide-react";
import Swal from "sweetalert2";
import { useRouter } from "next/navigation";
import { useUser, User } from "../components/userContext";
import Link from "next/link";

interface LoginFormData {
  email: string;
  password: string;
}

interface LoginResponse {
  user: User;
  token: string;
  success?: boolean;
}

export default function Login() {
  const router = useRouter();
  const { loginUser, user } = useUser();
  const [formData, setFormData] = useState<LoginFormData>({
    email: "",
    password: ""
  });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // ✅ Redirigir automáticamente si ya está logueado
  useEffect(() => {
    if (user) {
      if (user.rol === "admin" || user.rol === "vendedor") {
        router.replace(`/dashboard/${user.id}`);
      } else {
        router.replace("/");
      }
    }
  }, [user, router]);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError("");
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("https://europadel-back.vercel.app/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(formData),
      });

      const data: LoginResponse = await response.json();

      if (!response.ok || !data.success) {
        const errorMsg = data?.user?.nombre || "Credenciales incorrectas";
        setError(errorMsg);
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "Usuario o contraseña incorrectos",
        });
        return;
      }

      // ✅ CORRECCIÓN CRÍTICA: Guardar token correctamente
      const token = data.token;
      
      // 1. Guardar en localStorage (para persistencia)
      localStorage.setItem("token", token);
      localStorage.setItem("rol", data.user.rol);
      localStorage.setItem("userId", data.user.id);
      
      // 2. Guardar en sessionStorage (para dashboard admin)
      sessionStorage.setItem("authTokenAdmin", token);
      sessionStorage.setItem("isAuthenticatedAdmin", "true");

      // 3. Actualizar contexto (SIN prefijo "token")
      loginUser(data.user, token);

      Swal.fire({
        icon: "success",
        title: "Bienvenido",
        text: `Hola ${data.user.nombre}!`,
        showConfirmButton: false,
        timer: 1500,
      });

      // ✅ Redirigir según rol
      setTimeout(() => {
        if (data.user.rol === "admin" || data.user.rol === "vendedor") {
          router.push(`/dashboard/${data.user.id}`);
        } else {
          router.push("/");
        }
      }, 1600);

    } catch (err) {
      console.error("❌ Error en login:", err);
      setError("Error de conexión. Intenta nuevamente.");
      Swal.fire({
        icon: "error",
        title: "Oops...",
        text: "Error de conexión. Intenta nuevamente.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md border border-purple-100">
        <h1 className="text-3xl font-bold text-center mb-2 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
          🔐 Iniciar Sesión
        </h1>
        
        {error && (
          <div className="bg-red-50 border border-red-300 text-red-700 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold mb-2 text-gray-700">
              Email
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 outline-none transition text-gray-900"
              placeholder="tu@email.com"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2 text-gray-700">
              Contraseña
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 outline-none transition text-gray-900 pr-12"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl font-bold transition shadow-lg disabled:opacity-50"
          >
            {isLoading ? "Cargando..." : "Iniciar sesión"}
          </button>

          <Link 
            href="/recuperar-password"
            className="block text-center text-purple-600 hover:text-purple-800 text-sm font-semibold mt-4"
          >
            Recuperar contraseña
          </Link>
        </form>
      </div>
    </div>
  );
}

