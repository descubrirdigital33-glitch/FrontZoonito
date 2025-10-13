"use client";
import Link from "next/link";
import { useContext, useState } from "react";
import { UserContext } from "../context/UserContext";

export default function Navbar() {
  const { user, logoutUser } = useContext(UserContext);
  const [isOpen, setIsOpen] = useState(false);
  return (
    <nav className="navbar-enhanced sticky top-0 z-50 bg-black/30 backdrop-blur-md border-b border-white/20 px-6 py-4 flex items-center justify-between">
      {/* Logo */}
      <Link
        href="/"
        className="font-extrabold text-2xl glow-text hover:scale-105 transition-transform"
      >
        Zoonito
      </Link>

      {/* Botón hamburguesa */}
      <div className="md:hidden">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="text-white focus:outline-none"
        >
          {isOpen ? (
            <span className="text-2xl">&times;</span> // X
          ) : (
            <span className="text-2xl">&#9776;</span> // ☰
          )}
        </button>
      </div>

      {/* Menú normal y responsive */}
      <div
        className={`${
          isOpen ? "flex" : "hidden"
        } flex-col md:flex-row md:flex md:items-center gap-4 absolute md:static top-full left-0 w-full md:w-auto bg-black/80 md:bg-transparent p-4 md:p-0 border-b md:border-none border-white/20 md:justify-end transition-all duration-300`}
      >
        {user ? (
          <>
            {/* Avatar y saludo */}
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-white/30">
                <img
                  src={user.avatar || "/assets/zoonito.jpg"}
                  alt="avatar"
                  className="w-10 h-10 rounded-full object-cover border-2 border-white/30"
                />
              </div>
              <span className="glow-secondary text-sm md:text-base">
                Hola,{" "}
                <span className="glow-text font-semibold">{user.name}</span> (
                {user.role})
              </span>
            </div>

            {/* Botones según rol */}
            {user.role === "user" && (
              <>
                <Link
                  href="/subscribe"
                  className="btn-glass btn-primary hover:shadow-[0_0_10px_#00f0ff,0_0_20px_#ff2ddb] transition-shadow"
                >
                  Suscribirse
                </Link>
                <Link
                  href="/perfiledit"
                  className="btn-glass btn-secondary hover:shadow-[0_0_10px_#ff2ddb,0_0_20px_#00f0ff] transition-shadow"
                >
                  Editar Perfil
                </Link>
              </>
            )}

            {(user.role === "artist" || user.role === "admin") && (
              <>
                <Link
                  href="/musicUp"
                  className="btn-glass btn-primary hover:shadow-[0_0_10px_#00f0ff,0_0_20px_#ff2ddb] transition-shadow"
                >
                  Subir Música
                </Link>
                <Link
                  href="/perfiledit"
                  className="btn-glass btn-secondary hover:shadow-[0_0_10px_#ff2ddb,0_0_20px_#00f0ff] transition-shadow"
                >
                  Editar Perfil
                </Link>
                <Link
                  href="/patrocinio"
                  className="btn-glass btn-secondary hover:shadow-[0_0_10px_#ff2ddb,0_0_20px_#00f0ff] transition-shadow"
                >
                  Publicidad
                </Link>
              </>
            )}

            {/* Botón exclusivo para admins */}
            {user.role === "admin" && (
              <>
                {" "}
                <Link
                  href="/testpubli"
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-red-400 to-red-800 text-white font-bold hover:scale-105 transition-transform shadow-lg"
                >
                  Patrocinio
                </Link>
              </>
            )}

            {/* Botón salir */}
            <button
              onClick={logoutUser}
              className="btn-glass btn-danger hover:shadow-[0_0_10px_#ff2ddb,0_0_20px_#00f0ff] transition-shadow"
            >
              Salir
            </button>
          </>
        ) : (
          <>
            {/* Menú para no logueados */}
            <Link
              href="/musicAll"
              className="btn-glass btn-primary hover:shadow-[0_0_10px_#00f0ff,0_0_20px_#ff2ddb] transition-shadow"
            >
              Musica estado puro
            </Link>
            <Link
              href="/login"
              className="btn-glass btn-primary hover:shadow-[0_0_10px_#00f0ff,0_0_20px_#ff2ddb] transition-shadow"
            >
              Login
            </Link>
            <Link
              href="/register"
              className="btn-glass btn-secondary hover:shadow-[0_0_10px_#ff2ddb,0_0_20px_#00f0ff] transition-shadow"
            >
              Registrate
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}


