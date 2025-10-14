"use client";

import React, { useState, useEffect, useContext } from "react";
import {
    Calendar,
    MapPin,
    Music,
    Share2,
    ShoppingCart,
    X,
} from "lucide-react";
import { UserContext } from "../context/UserContext";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";

interface Evento {
    _id: string;
    idMusico: string;
    banda: string;
    disco?: string;
    fecha: string;
    hora?: string;
    direccion: string;
    imagenUrl: string;
    promocionado: boolean;
    diseño: "claro" | "oscuro";
    congelar?: boolean;
    lanzar?: boolean;
}

interface Sponsor {
    _id: string;
    nombre: string;
    logo: string;
    descripcion: string;
    enlace: string;
    eventoId: string;
}

export default function EventosFanView() {
    const [eventos, setEventos] = useState<Evento[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isTransitioning, setIsTransitioning] = useState(false);
    const [sponsors, setSponsors] = useState<Sponsor[]>([]);
    const [sponsorsVisibles, setSponsorsVisibles] = useState<string[]>([]);
    const [todosEventos, setTodosEventos] = useState<Evento[]>([]);

    const { user } = useContext(UserContext);
    const router = useRouter();

    const API_URL = "https://backend-zoonito-6x8h.vercel.app/api/eventos";
    const SPONSORS_API_URL = "https://backend-zoonito-6x8h.vercel.app/api/sponsors";

    const eventoActivo = (evento: Evento) => {
        const hoy = new Date();
        const fechaEvento = new Date(evento.fecha);
        return fechaEvento >= hoy || evento.promocionado;
    };

    // ========================================
    // 1️⃣ Cargar todos los eventos en estado general
    // ========================================
    useEffect(() => {
        const cargarTodosEventos = async () => {
            try {
                const res = await fetch(API_URL);
                if (!res.ok) throw new Error("Error al obtener eventos");
                const data: Evento[] = await res.json();
                setTodosEventos(data);
            } catch (error) {
                console.error(error);
            }
        };
        cargarTodosEventos();
    }, []);

    // ========================================
    // 2️⃣ Cargar eventos del sponsor
    // ========================================
    useEffect(() => {
        const cargarEventosDeSponsor = async () => {
            const sponsorEventoId = localStorage.getItem("sponsorEventoId");
            if (!sponsorEventoId) return;

            try {
                const res = await fetch(`${API_URL}/musico/${sponsorEventoId}`);
                if (!res.ok) throw new Error("Error al obtener eventos del músico");
                const eventosData: Evento[] = await res.json();

                if (eventosData.length === 0) {
                    Swal.fire({
                        icon: "info",
                        title: "Sin eventos",
                        text: "El músico no tiene eventos publicados actualmente.",
                        timer: 2500,
                        showConfirmButton: false,
                    });
                    return;
                }

                setEventos(eventosData);
                setCurrentIndex(0);

                Swal.fire({
                    icon: "success",
                    title: "Eventos del Músico",
                    text: `Mostrando ${eventosData.length} evento${eventosData.length > 1 ? "s" : ""} de ${eventosData[0].banda}`,
                    timer: 2500,
                    timerProgressBar: true,
                    showConfirmButton: false,
                });

                localStorage.removeItem("sponsorEventoId");
            } catch (error) {
                console.error("Error al cargar eventos del sponsor:", error);
                Swal.fire({
                    icon: "error",
                    title: "Error",
                    text: "No se pudieron cargar los eventos del músico patrocinado.",
                    confirmButtonColor: "#ef4444",
                });
            }
        };

        cargarEventosDeSponsor();
    }, []);

    // ========================================
    // 3️⃣ Cargar sponsors cerrados
    // ========================================
    useEffect(() => {
        const cargarSponsors = async () => {
            try {
                const closedSponsorsStr = localStorage.getItem("closedSponsors");
                if (closedSponsorsStr) {
                    const closedSponsorsArray: string[] = JSON.parse(closedSponsorsStr);
                    setSponsorsVisibles(closedSponsorsArray);

                    const sponsorsPromises = closedSponsorsArray.map(async (sponsorId) => {
                        try {
                            const res = await fetch(`${SPONSORS_API_URL}/${sponsorId}`);
                            if (res.ok) return await res.json();
                            return null;
                        } catch (error) {
                            console.error(`Error al cargar sponsor ${sponsorId}:`, error);
                            return null;
                        }
                    });

                    const sponsorsData = await Promise.all(sponsorsPromises);
                    const sponsorsValidos = sponsorsData.filter((s): s is Sponsor => s !== null);
                    setSponsors(sponsorsValidos);
                }
            } catch (error) {
                console.error("Error al leer closedSponsors:", error);
            }
        };

        cargarSponsors();
    }, []);

    // ========================================
    // 4️⃣ Cargar todos los eventos para el carousel (reordenando destacados primero)
    // ========================================
    const cargarEventos = async () => {
        const sponsorEventoId = localStorage.getItem("sponsorEventoId");
        if (sponsorEventoId) return; // Bloquea si hay sponsor

        try {
            const res = await fetch(API_URL);
            if (!res.ok) throw new Error("Error al obtener los eventos");
            const data: Evento[] = await res.json();

            // Filtrar eventos activos
            const activos = data.filter(eventoActivo);

            // Reordenar: destacados primero
            const destacados = activos.filter(e => e.promocionado);
            const normales = activos.filter(e => !e.promocionado);

            setEventos([...destacados, ...normales]);
            setCurrentIndex(0);
        } catch (error) {
            console.error("Error al cargar eventos:", error);
        }
    };

    useEffect(() => {
        cargarEventos();
    }, []);

    // ========================================
    // Funciones generales
    // ========================================
    const cerrarSponsor = (sponsorId: string) => {
        setSponsors((prev) => prev.filter((s) => s._id !== sponsorId));
        const nuevosSponsors = sponsorsVisibles.filter((id) => id !== sponsorId);
        localStorage.setItem("closedSponsors", JSON.stringify(nuevosSponsors));
        setSponsorsVisibles(nuevosSponsors);
    };

    const eventosVisibles = eventos; // ya están reordenados

    const eventoMostrado =
        eventosVisibles.length > 0
            ? eventosVisibles[currentIndex % eventosVisibles.length]
            : null;

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

    const formatDate = (dateString: string, hora?: string) => {
        const fecha = new Date(dateString).toLocaleDateString("es-ES", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
        });
        return hora ? `${fecha} a las ${hora}` : fecha;
    };

    const handleEstarAhi = () => {
        Swal.fire({
            icon: "info",
            title: "🎟️ Comprar Entrada",
            text: "Serás redirigido a la página de compra de entradas",
            showCancelButton: true,
            confirmButtonText: "Continuar",
            cancelButtonText: "Cancelar",
            confirmButtonColor: "#10b981",
            cancelButtonColor: "#6b7280",
        }).then((result) => {
            if (result.isConfirmed) {
                router.push("/comprar-entrada");
            }
        });
    };

    const handleCompartir = (evento: Evento) => {
        const mensaje = `🎵 *${evento.banda}* ${evento.disco ? `- ${evento.disco}` : ""}\n\n📅 ${formatDate(evento.fecha, evento.hora)}\n📍 ${evento.direccion}\n\n¡No te lo pierdas! 🔥`;
        const url = `https://wa.me/?text=${encodeURIComponent(mensaje)}`;
        window.open(url, "_blank");
    };

    // ========================================
    // Render principal
    // ========================================
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 py-12 px-4">
            {/* Sponsors flotantes */}
            {sponsors.length > 0 && (
                <div className="fixed top-4 right-4 z-50 space-y-4 max-w-sm">
                    {sponsors.map((sponsor) => (
                        <div
                            key={sponsor._id}
                            className="bg-white rounded-2xl shadow-2xl overflow-hidden transform transition-all duration-300 hover:scale-105"
                        >
                            <div className="relative">
                                <button
                                    onClick={() => cerrarSponsor(sponsor._id)}
                                    className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-2 transition-colors duration-200 z-10"
                                >
                                    <X className="w-4 h-4" />
                                </button>

                                <div className="bg-gradient-to-br from-purple-500 to-pink-500 p-6">
                                    <img
                                        src={sponsor.logo}
                                        alt={sponsor.nombre}
                                        className="w-24 h-24 rounded-full mx-auto object-cover border-4 border-white shadow-lg"
                                    />
                                </div>

                                <div className="p-6 text-center">
                                    <h3 className="text-xl font-bold text-gray-800 mb-2">
                                        {sponsor.nombre}
                                    </h3>
                                    <p className="text-gray-600 text-sm mb-4">
                                        {sponsor.descripcion}
                                    </p>

                                    <div className="flex gap-3">
                                        <button
                                            onClick={() => cerrarSponsor(sponsor._id)}
                                            className="flex-1 bg-white/20 hover:bg-white/30 text-gray-700 py-3 px-6 rounded-full font-semibold transition-all duration-300 hover:scale-105"
                                        >
                                            Cerrar
                                        </button>
                                        <button
                                            onClick={() => router.push(`/evento/${sponsor.eventoId}`)}
                                            className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white py-3 px-6 rounded-full font-bold shadow-lg hover:shadow-pink-400/50 transition-all duration-300 hover:scale-105"
                                        >
                                            Ver más
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Carousel de eventos */}
            {eventoMostrado ? (
                <div className="relative w-full max-w-7xl mx-auto mb-12">
                    <div className="relative h-[600px] rounded-3xl overflow-hidden shadow-2xl">
                        <img
                            src={eventoMostrado.imagenUrl}
                            alt={eventoMostrado.banda}
                            className="w-full h-full object-cover"
                        />
                        <div
                            className={`absolute inset-0 ${eventoMostrado.diseño === "oscuro"
                                ? "bg-gradient-to-t from-black via-black/70 to-transparent"
                                : "bg-gradient-to-t from-gray-900 via-gray-900/70 to-transparent"
                                }`}
                        />
                        <div className="absolute inset-0 flex flex-col justify-end p-8 md:p-12">
                            {eventoMostrado.promocionado && (
                                <div className="absolute top-8 right-8 bg-gradient-to-r from-yellow-400 to-orange-500 text-black px-6 py-2 rounded-full font-bold text-sm shadow-lg">
                                    ⭐ DESTACADO
                                </div>
                            )}

                            <h2 className="text-5xl md:text-7xl font-black text-white mb-2 drop-shadow-2xl">
                                {eventoMostrado.banda}
                            </h2>

                            {eventoMostrado.disco && (
                                <div className="flex items-center gap-2 text-xl md:text-2xl text-gray-300 mb-4">
                                    <Music className="w-6 h-6" />
                                    <span className="font-semibold">{eventoMostrado.disco}</span>
                                </div>
                            )}

                            <div className="space-y-3 mb-6 text-white">
                                <div className="flex items-start gap-3">
                                    <Calendar className="w-6 h-6 mt-1 flex-shrink-0" />
                                    <p className="text-lg md:text-xl font-medium">
                                        {formatDate(eventoMostrado.fecha, eventoMostrado.hora)}
                                    </p>
                                </div>
                                <div className="flex items-start gap-3">
                                    <MapPin className="w-6 h-6 mt-1 flex-shrink-0" />
                                    <p className="text-lg md:text-xl font-medium">
                                        {eventoMostrado.direccion}
                                    </p>
                                </div>
                            </div>

                            <div className="flex flex-wrap gap-4">
                                <button
                                    onClick={handleEstarAhi}
                                    className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold text-lg px-8 py-4 rounded-full shadow-lg transition-all duration-300 flex items-center gap-2"
                                >
                                    <ShoppingCart className="w-5 h-5" /> Estar Ahí
                                </button>

                                <button
                                    onClick={() => handleCompartir(eventoMostrado)}
                                    className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-bold text-lg px-8 py-4 rounded-full shadow-lg transition-all duration-300 flex items-center gap-2"
                                >
                                    <Share2 className="w-5 h-5" /> Compartir
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
            ) : (
                <div className="text-center text-white text-2xl mt-20">
                    🎵 No hay eventos disponibles en este momento
                </div>
            )}
        </div>
    );
}
