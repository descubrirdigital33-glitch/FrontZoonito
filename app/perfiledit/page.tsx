"use client";
import React, { useState, useContext, useRef, useEffect, ChangeEvent, FormEvent } from "react";
import Image from "next/image";
import { UserContext } from "../context/UserContext";

export default function ProfileEdit() {
    const { user, setUser } = useContext(UserContext);

    const [name, setName] = useState("");
    const [role, setRole] = useState("user");
    const [avatar, setAvatar] = useState<File | null>(null);
    const [preview, setPreview] = useState("/assets/zoonito.jpg");
    const [loading, setLoading] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (user) {
            setName(user.name || "");
            setRole(user.role || "user");
            setPreview(user.avatar || "/assets/zoonito.jpg");
        }
    }, [user]);

    // Maneja cambio de avatar
    const handleAvatarChange = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] || null;
        if (file) {
            setAvatar(file);
            setPreview(URL.createObjectURL(file));
        }
    };

    // Dispara input oculto
    const handleButtonClick = () => {
        fileInputRef.current?.click();
    };

    // Maneja submit del formulario con token JWT
    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);

        const formData = new FormData();
        formData.append("name", name);
        formData.append("role", role);
        if (avatar) formData.append("avatar", avatar);

        try {
            const token = user?.token; // ✅ obtenemos token del contexto
            if (!token) throw new Error("Usuario no autenticado");

            const res = await fetch("https://backend-zoonito-6x8h.vercel.app/api/user/profile", {
                method: "PUT",
                headers: {
                    Authorization: `Bearer ${token}`, // enviamos token en header
                },
                body: formData,
            });

            const data = await res.json();

            if (!res.ok) {
                console.error("Error backend:", data);
                throw new Error(
                    typeof data?.message === "string" ? data.message : "Error al actualizar"
                );
            }

            setUser(data); // actualiza contexto con nuevo user
            alert("Perfil actualizado ✅");
        } catch (err) {
            const message = err instanceof Error ? err.message : "Error desconocido al actualizar";
            alert(message);
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-xl mx-auto mt-10 p-6 rounded-2xl bg-black/40 backdrop-blur-md shadow-lg border border-white/20">
            <h2 className="text-2xl font-bold glow-text mb-4">Editar Perfil</h2>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                {/* Avatar */}
                <div className="flex flex-col items-center">
                    <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-white/30">
                        <img
                            src={preview}
                            alt="avatar"
                            className="w-24 h-24 rounded-full object-cover border-2 border-white/30"
                        />

                    </div>

                    {/* Botón para cambiar avatar */}
                    <button
                        type="button"
                        onClick={handleButtonClick}
                        className="mt-2 px-4 py-1 bg-indigo-600 text-white rounded-md hover:bg-indigo-500 transition-colors"
                    >
                        Cambiar Avatar
                    </button>

                    {/* Input oculto */}
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarChange}
                        className="hidden"
                    />
                </div>

                {/* Nombre */}
                <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Nombre"
                    className="px-4 py-2 rounded-md border border-white/30 bg-black/30 text-white"
                />

                {/* Rol */}
                <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="px-4 py-2 rounded-md border border-white/30 bg-black/30 text-white"
                >
                    <option value="user">Usuario</option>
                    <option value="artist">Artista</option>
                </select>

                {/* Botón submit */}
                <button
                    type="submit"
                    disabled={loading}
                    className="btn-glass btn-primary hover:shadow-[0_0_10px_#00f0ff,0_0_20px_#ff2ddb] transition-shadow"
                >
                    {loading ? "Guardando..." : "Guardar Cambios"}
                </button>
            </form>
        </div>
    );
}

