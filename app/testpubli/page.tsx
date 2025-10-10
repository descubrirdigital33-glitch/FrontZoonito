"use client";

import React, { useState, useEffect, useContext } from "react";
import { Calendar, MapPin, Music, Share2, Snowflake, Rocket } from "lucide-react";
import { UserContext } from "../context/UserContext";
import Swal from "sweetalert2";

interface Evento {
    _id: string;
    idMusico: string;
    banda: string;
    disco?: string;
    fecha: string;
    direccion: string;
    imagenUrl: string;
    promocionado: boolean;
    diseño: "claro" | "oscuro";
    congelar?: boolean;
    lanzar?: boolean;
}

export default function EventosFanView() {
    const [eventos, setEventos] = useState<Evento[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isTransitioning, setIsTransitioning] = useState(false);

    const { user } = useContext(UserContext);
    const userId = user?._id || "";
    const API_URL = "https://backend-zoonito-6x8h.vercel.app/api/eventos";

    // ✅ Cargar eventos (diferenciando por rol)
    const cargarEventos = async () => {
        if (!user) return;

        try {
            const url =
                user.role === "admin"
                    ? `${API_URL}?role=admin`
                    : `${API_URL}/${userId}`;

            const res = await fetch(url);

            if (!res.ok) throw new Error("Error al obtener los eventos");

            const data: Evento[] = await res.json();
            setEventos(data);
            setCurrentIndex(0);
        } catch (error) {
            console.error("Error al cargar eventos:", error);
        }
    };

    useEffect(() => {
        cargarEventos();
    }, [userId, user?.role]);

    // ------------------- Carousel -------------------
    const eventosVisibles = eventos.filter(
        (e) => e.promocionado || new Date(e.fecha) >= new Date()
    );
    const currentEvento = eventosVisibles[currentIndex];

    useEffect(() => {
        if (!eventosVisibles.length) return;
        const interval = setInterval(() => nextSlide(), 5000);
        return () => clearInterval(interval);
    }, [currentIndex, eventosVisibles.length]);

    const nextSlide = () => {
        if (!eventosVisibles.length) return;
        setIsTransitioning(true);
        setTimeout(() => {
            setCurrentIndex((prev) => (prev + 1) % eventosVisibles.length);
            setIsTransitioning(false);
        }, 300);
    };

    const prevSlide = () => {
        if (!eventosVisibles.length) return;
        setIsTransitioning(true);
        setTimeout(() => {
            setCurrentIndex(
                (prev) => (prev - 1 + eventosVisibles.length) % eventosVisibles.length
            );
            setIsTransitioning(false);
        }, 300);
    };

    const formatDate = (dateString: string) =>
        new Date(dateString).toLocaleDateString("es-ES", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });

    // ✅ Nueva función para LANZAR (toggle lanzar)
    const handleLanzar = async (eventoId: string) => {
        try {
            const res = await fetch(`${API_URL}/lanzar/${eventoId}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
            });

            if (!res.ok) throw new Error("Error al lanzar evento");

            const data = await res.json();
            console.log("Evento lanzado:", data);
            
            // SweetAlert de éxito
            await Swal.fire({
                icon: "success",
                title: data.evento.lanzar ? "🚀 Evento Lanzado" : "Evento Deslanzado",
                text: data.mensaje || "El estado del evento ha sido actualizado correctamente",
                confirmButtonColor: "#3b82f6",
                timer: 2000,
                timerProgressBar: true,
            });
            
            // Recargar eventos para actualizar el estado
            await cargarEventos();
        } catch (error) {
            console.error("Error al lanzar evento:", error);
            
            // SweetAlert de error
            Swal.fire({
                icon: "error",
                title: "Error al Lanzar",
                text: "No se pudo cambiar el estado del evento. Por favor, intenta de nuevo.",
                confirmButtonColor: "#ef4444",
            });
        }
    };

    // ✅ Nueva función para CONGELAR (toggle congelar)
    const handleCongelar = async (eventoId: string) => {
        try {
            const res = await fetch(`${API_URL}/congelar/${eventoId}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
            });

            if (!res.ok) throw new Error("Error al congelar evento");

            const data = await res.json();
            console.log("Evento congelado:", data);
            
            // SweetAlert de éxito
            await Swal.fire({
                icon: "success",
                title: data.evento.congelar ? "❄️ Evento Congelado" : "Evento Descongelado",
                text: data.mensaje || "El estado del evento ha sido actualizado correctamente",
                confirmButtonColor: "#06b6d4",
                timer: 2000,
                timerProgressBar: true,
            });
            
            // Recargar eventos para actualizar el estado
            await cargarEventos();
        } catch (error) {
            console.error("Error al congelar evento:", error);
            
            // SweetAlert de error
            Swal.fire({
                icon: "error",
                title: "Error al Congelar",
                text: "No se pudo cambiar el estado del evento. Por favor, intenta de nuevo.",
                confirmButtonColor: "#ef4444",
            });
        }
    };

    // ------------------- Render -------------------
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 py-12 px-4">
            {eventosVisibles.length > 0 && currentEvento && (
                <div className="relative w-full max-w-7xl mx-auto mb-12">
                    <div className="relative h-[600px] rounded-3xl overflow-hidden shadow-2xl">
                        <img
                            src={currentEvento.imagenUrl}
                            alt={currentEvento.banda}
                            className="w-full h-full object-cover"
                        />
                        <div
                            className={`absolute inset-0 ${currentEvento.diseño === "oscuro"
                                    ? "bg-gradient-to-t from-black via-black/70 to-transparent"
                                    : "bg-gradient-to-t from-gray-900 via-gray-900/70 to-transparent"
                                }`}
                        />
                        <div className="absolute inset-0 flex flex-col justify-end p-8 md:p-12">
                            {currentEvento.promocionado && (
                                <div className="absolute top-8 right-8 bg-gradient-to-r from-yellow-400 to-orange-500 text-black px-6 py-2 rounded-full font-bold text-sm shadow-lg">
                                    ⭐ DESTACADO
                                </div>
                            )}
                            
                            {/* Indicadores de estado */}
                            <div className="absolute top-8 left-8 flex gap-2">
                                {currentEvento.lanzar && (
                                    <div className="bg-gradient-to-r from-blue-400 to-cyan-500 text-white px-4 py-2 rounded-full font-bold text-sm shadow-lg flex items-center gap-2">
                                        <Rocket className="w-4 h-4" /> LANZADO
                                    </div>
                                )}
                                {currentEvento.congelar && (
                                    <div className="bg-gradient-to-r from-cyan-400 to-blue-500 text-white px-4 py-2 rounded-full font-bold text-sm shadow-lg flex items-center gap-2">
                                        <Snowflake className="w-4 h-4" /> CONGELADO
                                    </div>
                                )}
                            </div>

                            <h2 className="text-5xl md:text-7xl font-black text-white mb-2 drop-shadow-2xl">
                                {currentEvento.banda}
                            </h2>
                            {currentEvento.disco && (
                                <div className="flex items-center gap-2 text-xl md:text-2xl text-gray-300 mb-4">
                                    <Music className="w-6 h-6" />
                                    <span className="font-semibold">{currentEvento.disco}</span>
                                </div>
                            )}
                            <div className="space-y-3 mb-6 text-white">
                                <div className="flex items-start gap-3">
                                    <Calendar className="w-6 h-6 mt-1 flex-shrink-0" />
                                    <p className="text-lg md:text-xl font-medium">
                                        {formatDate(currentEvento.fecha)}
                                    </p>
                                </div>
                                <div className="flex items-start gap-3">
                                    <MapPin className="w-6 h-6 mt-1 flex-shrink-0" />
                                    <p className="text-lg md:text-xl font-medium">
                                        {currentEvento.direccion}
                                    </p>
                                </div>
                            </div>
                            <div className="flex flex-wrap gap-4">
                                <button
                                    onClick={() => handleLanzar(currentEvento._id)}
                                    className={`${
                                        currentEvento.lanzar 
                                            ? "bg-blue-600 hover:bg-blue-700" 
                                            : "bg-blue-500 hover:bg-blue-600"
                                    } text-white font-bold text-lg px-8 py-4 rounded-full shadow-lg transition-all duration-300 flex items-center gap-2`}
                                >
                                    <Rocket className="w-5 h-5" /> 
                                    {currentEvento.lanzar ? "Deslanzar" : "Lanzar"}
                                </button>
                                <button
                                    onClick={() => handleCongelar(currentEvento._id)}
                                    className={`${
                                        currentEvento.congelar 
                                            ? "bg-cyan-600 hover:bg-cyan-700" 
                                            : "bg-cyan-500 hover:bg-cyan-600"
                                    } text-white font-bold text-lg px-8 py-4 rounded-full shadow-lg transition-all duration-300 flex items-center gap-2`}
                                >
                                    <Snowflake className="w-5 h-5" /> 
                                    {currentEvento.congelar ? "Descongelar" : "Congelar"}
                                </button>
                            </div>
                            {eventosVisibles.length > 1 && (
                                <>
                                    <button
                                        onClick={prevSlide}
                                        className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/30 text-white p-3 rounded-full transition-all duration-300 hover:scale-110"
                                    >
                                        &lt;
                                    </button>
                                    <button
                                        onClick={nextSlide}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/30 text-white p-3 rounded-full transition-all duration-300 hover:scale-110"
                                    >
                                        &gt;
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}