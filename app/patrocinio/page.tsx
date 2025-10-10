"use client";

import React, { useState, useContext, useEffect, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { UserContext } from "../context/UserContext";
import Swal from "sweetalert2";
import { Calendar, MapPin, Music, Trash2, X, AlertCircle, ChevronLeft, ChevronRight, Share2, Rocket, Clock } from "lucide-react";

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
    codigoPromocional?: string;
    diseño: "claro" | "oscuro";
    congelar?: boolean;
    lanzar?: boolean;
}

interface FormDataEvento {
    banda: string;
    disco: string;
    fecha: string;
    hora: string;
    direccion: string;
    imagenUrl: string;
    promocionado: boolean;
    codigoPromocional: string;
    diseño: "claro" | "oscuro";
}

interface Mensaje {
    texto: string;
    tipo: "success" | "error" | "warning" | "info" | "";
}

export default function EventosManager() {
    const [eventos, setEventos] = useState<Evento[]>([]);
    const [modalAbierto, setModalAbierto] = useState(false);
    const [modoEdicion, setModoEdicion] = useState(false);
    const [eventoActual, setEventoActual] = useState<Evento | null>(null);
    const [mensaje, setMensaje] = useState<Mensaje>({ texto: "", tipo: "" });
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isTransitioning, setIsTransitioning] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const API_URL = "https://backend-zoonito-6x8h.vercel.app/api/eventos";
    const codigoBackend = "PROMO2025";
    const { user } = useContext(UserContext);
    const router = useRouter();

    const [formData, setFormData] = useState<FormDataEvento>({
        banda: "",
        disco: "",
        fecha: "",
        hora: "",
        direccion: "",
        imagenUrl: "",
        promocionado: false,
        codigoPromocional: "",
        diseño: "claro",
    });

    const userId = user?._id || "";

    const cargarEventos = async () => {
        if (!userId) return;
        try {
            const res = await fetch(`${API_URL}/${userId}`);
            if (!res.ok) throw new Error("Error al obtener los eventos");
            const data: Evento[] = await res.json();
            setEventos(data);
            setCurrentIndex(0);
        } catch (error) {
            console.error(error);
            mostrarMensaje("Error al cargar eventos", "error");
        }
    };

    useEffect(() => {
        cargarEventos();
    }, [userId]);

    const mostrarMensaje = (texto: string, tipo: Mensaje["tipo"]) => {
        setMensaje({ texto, tipo });
        setTimeout(() => setMensaje({ texto: "", tipo: "" }), 4000);
    };

    const abrirModalCrear = () => {
        setFormData({ banda: "", disco: "", fecha: "", hora: "", direccion: "", imagenUrl: "", promocionado: false, codigoPromocional: "", diseño: "claro" });
        setFile(null);
        setModoEdicion(false);
        setModalAbierto(true);
    };

    const abrirModalEditar = (evento: Evento) => {
        setFormData({
            banda: evento.banda,
            disco: evento.disco || "",
            fecha: evento.fecha.split("T")[0],
            hora: evento.hora || "",
            direccion: evento.direccion,
            imagenUrl: evento.imagenUrl,
            promocionado: evento.promocionado,
            codigoPromocional: evento.codigoPromocional || "",
            diseño: evento.diseño
        });
        setFile(null);
        setEventoActual(evento);
        setModoEdicion(true);
        setModalAbierto(true);
    };

    const cerrarModal = () => { setModalAbierto(false); setEventoActual(null); setFile(null); setIsSubmitting(false); };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        const esPromocionado = formData.promocionado && formData.codigoPromocional === codigoBackend;

        try {
            const formPayload = new FormData();
            formPayload.append("banda", formData.banda);
            formPayload.append("disco", formData.disco);
            formPayload.append("fecha", formData.fecha);
            formPayload.append("hora", formData.hora);
            formPayload.append("direccion", formData.direccion);
            formPayload.append("diseño", formData.diseño);
            formPayload.append("promocionado", String(esPromocionado));
            formPayload.append("codigoPromocional", formData.codigoPromocional);

            if (file) formPayload.append("imagen", file);
            else formPayload.append("imagenUrl", formData.imagenUrl);

            let res: Response;
            if (modoEdicion && eventoActual) {
                res = await fetch(`${API_URL}/${userId}/${eventoActual._id}`, {
                    method: "PUT",
                    body: formPayload,
                });
            } else {
                res = await fetch(`${API_URL}/${userId}`, {
                    method: "POST",
                    body: formPayload,
                });
            }

            if (res.ok) {
                const msg = modoEdicion ? "Evento actualizado exitosamente" : (esPromocionado ? "✨ Evento promocionado creado exitosamente" : "✓ Evento guardado sin promoción");
                await Swal.fire({ icon: "success", title: "¡Éxito!", text: msg, timer: 2000, showConfirmButton: false });
                await cargarEventos();
                cerrarModal();
            } else {
                const errText = modoEdicion ? "Error al actualizar el evento" : "Error al crear el evento";
                Swal.fire({ icon: "error", title: "¡Error!", text: errText });
                setIsSubmitting(false);
            }
        } catch (error) {
            Swal.fire({ icon: "error", title: "¡Error!", text: "Ocurrió un error al guardar el evento" });
            setIsSubmitting(false);
        }
    };

    const eliminarEvento = async (id: string) => {
        if (!confirm("¿Estás seguro de eliminar este evento?")) return;
        try {
            const res = await fetch(`${API_URL}/${userId}/${id}`, { method: "DELETE" });
            if (res.ok) {
                Swal.fire({ icon: "success", title: "Evento eliminado", timer: 2000, showConfirmButton: false });
                await cargarEventos();
            }
        } catch { Swal.fire({ icon: "error", title: "Error al eliminar" }); }
    };

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

            await Swal.fire({
                icon: "success",
                title: data.evento.lanzar ? "🚀 Evento Lanzado" : "Evento Deslanzado",
                text: data.mensaje || "El estado del evento ha sido actualizado correctamente",
                confirmButtonColor: "#3b82f6",
                timer: 2000,
                timerProgressBar: true,
            });

            await cargarEventos();
        } catch (error) {
            console.error("Error al lanzar evento:", error);
            Swal.fire({
                icon: "error",
                title: "Error al Lanzar",
                text: "No se pudo cambiar el estado del evento. Por favor, intenta de nuevo.",
                confirmButtonColor: "#ef4444",
            });
        }
    };

    const handlePromocionar = async (evento: Evento) => {
        const result = await Swal.fire({
            icon: "info",
            title: "Promocionar Evento",
            text: "¿Deseas promocionar este evento?",
            showCancelButton: true,
            confirmButtonText: "Sí, promocionar",
            cancelButtonText: "Cancelar",
            confirmButtonColor: "#10b981",
        });

        if (result.isConfirmed) {
            router.push("/promocionar");
        }
    };

    // Nueva función para notificar al admin sobre evento congelado
    const notificarAdmin = async (evento: Evento) => {
        try {
            const avisoData = {
                idMusico: userId,
                nombreMusico: user?.name || "Usuario",
                emailMusico: user?.email || "",
                eventoId: evento._id,
                banda: evento.banda,
                disco: evento.disco || "",
                fecha: evento.fecha,
                hora: evento.hora || "",
                direccion: evento.direccion,
                mensaje: "Mi evento está congelado y necesito ayuda para poder utilizarlo.",
            };

            const res = await fetch("https://backend-zoonito-6x8h.vercel.app/api/avisoadmin", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(avisoData),
            });

            if (res.ok) {
                await Swal.fire({
                    icon: "success",
                    title: "¡Notificación Enviada!",
                    text: "El administrador ha sido notificado. Te contactaremos pronto.",
                    confirmButtonColor: "#10b981",
                });
            } else {
                throw new Error("Error al enviar notificación");
            }
        } catch (error) {
            console.error("Error al notificar admin:", error);
            Swal.fire({
                icon: "error",
                title: "Error",
                text: "No se pudo enviar la notificación. Intenta nuevamente.",
                confirmButtonColor: "#ef4444",
            });
        }
    };

    const eventosVisibles = eventos.filter((e) => e.promocionado || new Date(e.fecha) >= new Date());
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
            setCurrentIndex((prev) => (prev - 1 + eventosVisibles.length) % eventosVisibles.length);
            setIsTransitioning(false);
        }, 300);
    };

    const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString("es-ES", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric"
    });

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 py-12 px-4">
            <p className="text-white text-center mb-4">Bienvenido, {user?.name}</p>

            {mensaje.texto && (
                <div className="max-w-7xl mx-auto px-4 mb-6">
                    <div className={`p-4 rounded-xl flex items-center gap-3 ${mensaje.tipo === "success" ? "bg-green-100 text-green-800 border border-green-300" :
                        mensaje.tipo === "error" ? "bg-red-100 text-red-800 border border-red-300" :
                            mensaje.tipo === "warning" ? "bg-yellow-100 text-yellow-800 border border-yellow-300" :
                                "bg-blue-100 text-blue-800 border border-blue-300"
                        }`}>
                        <AlertCircle className="w-5 h-5" />{mensaje.texto}
                    </div>
                </div>
            )}

            {eventosVisibles.length > 0 && currentEvento && (
                <div className="relative w-full max-w-7xl mx-auto mb-12">
                    <div className="relative h-[600px] rounded-3xl overflow-hidden shadow-2xl">
                        <div className={`absolute inset-0 transition-opacity duration-500 ${isTransitioning ? "opacity-0" : "opacity-100"}`}>
                            <img src={currentEvento.imagenUrl} alt={currentEvento.banda} className="w-full h-full object-cover" />
                            <div className={`absolute inset-0 ${currentEvento.diseño === "oscuro" ? "bg-gradient-to-t from-black via-black/70 to-transparent" : "bg-gradient-to-t from-gray-900 via-gray-900/70 to-transparent"}`} />
                        </div>

                        <div className={`relative h-full flex flex-col justify-end p-8 md:p-12 transition-all duration-500 ${isTransitioning ? "opacity-0 translate-y-4" : "opacity-100 translate-y-0"}`}>
                            {currentEvento.promocionado && (
                                <div className="absolute top-8 right-8 bg-gradient-to-r from-yellow-400 to-orange-500 text-black px-6 py-2 rounded-full font-bold text-sm shadow-lg">
                                    ⭐ DESTACADO
                                </div>
                            )}

                            {currentEvento.lanzar && (
                                <div className="absolute top-8 left-8 bg-gradient-to-r from-blue-400 to-cyan-500 text-white px-4 py-2 rounded-full font-bold text-sm shadow-lg flex items-center gap-2">
                                    <Rocket className="w-4 h-4" /> LANZADO
                                </div>
                            )}

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
                                    <p className="text-lg md:text-xl font-medium">{formatDate(currentEvento.fecha)}</p>
                                </div>
                                {currentEvento.hora && (
                                    <div className="flex items-start gap-3">
                                        <Clock className="w-6 h-6 mt-1 flex-shrink-0" />
                                        <p className="text-lg md:text-xl font-medium">{currentEvento.hora}</p>
                                    </div>
                                )}
                                <div className="flex items-start gap-3">
                                    <MapPin className="w-6 h-6 mt-1 flex-shrink-0" />
                                    <p className="text-lg md:text-xl font-medium">{currentEvento.direccion}</p>
                                </div>
                            </div>

                            {currentEvento.congelar ? (
                                <div className="bg-red-900/80 backdrop-blur-sm p-6 rounded-2xl border-2 border-red-500">
                                    <h3 className="text-white text-2xl font-bold mb-3 flex items-center gap-2">
                                        <AlertCircle className="w-6 h-6" />
                                        Evento Congelado
                                    </h3>
                                    <p className="text-gray-200 mb-4">
                                        {mensaje.tipo === "info"
                                            ? "Te avisaremos a la brevedad de qué se trata"
                                            : "Este evento está temporalmente bloqueado. Comunícate con el administrador para obtener más información."}
                                    </p>
                                    <button
                                        onClick={async () => {
                                            await notificarAdmin(currentEvento);
                                            setMensaje({ texto: "", tipo: "info" });
                                        }}
                                        className={`${mensaje.tipo === "info" ? "bg-cyan-500 hover:bg-cyan-600 text-white" : "bg-yellow-500 hover:bg-yellow-600 text-black"
                                            } font-bold text-lg px-8 py-4 rounded-full shadow-lg transition-all duration-300 w-full md:w-auto`}
                                    >
                                        {mensaje.tipo === "info" ? "Aviso en curso" : "Contactar Administrador"}
                                    </button>
                                </div>
                            ) : (
                                <div className="flex flex-wrap gap-4">
                                    <button
                                        onClick={() => abrirModalEditar(currentEvento)}
                                        className="bg-blue-500 hover:bg-blue-600 text-white font-bold text-lg px-8 py-4 rounded-full shadow-lg transition-all duration-300"
                                    >
                                        Editar
                                    </button>
                                    <button
                                        onClick={() => eliminarEvento(currentEvento._id)}
                                        className="bg-red-500 hover:bg-red-600 text-white font-bold text-lg px-8 py-4 rounded-full shadow-lg transition-all duration-300"
                                    >
                                        Eliminar
                                    </button>
                                    <button
                                        onClick={() => handlePromocionar(currentEvento)}
                                        className="bg-green-500/90 hover:bg-green-600 text-white font-bold text-lg px-8 py-4 rounded-full shadow-lg transition-all duration-300 flex items-center gap-2"
                                    >
                                        Promocionar
                                    </button>
                                    <button
                                        onClick={() => handleLanzar(currentEvento._id)}
                                        className={`${currentEvento.lanzar ? "bg-blue-600 hover:bg-blue-700" : "bg-blue-500 hover:bg-blue-600"} text-white font-bold text-lg px-8 py-4 rounded-full shadow-lg transition-all duration-300 flex items-center gap-2`}
                                    >
                                        <Rocket className="w-5 h-5" />
                                        {currentEvento.lanzar ? "Deslanzar" : "Lanzar"}
                                    </button>
                                </div>
                            )}

                            {eventosVisibles.length > 1 && (
                                <>
                                    <button onClick={prevSlide} className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/30 text-white p-3 rounded-full transition-all duration-300 hover:scale-110">
                                        <ChevronLeft className="w-8 h-8" />
                                    </button>
                                    <button onClick={nextSlide} className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/30 text-white p-3 rounded-full transition-all duration-300 hover:scale-110">
                                        <ChevronRight className="w-8 h-8" />
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}

            <div className="mt-8 text-center">
                <button onClick={abrirModalCrear} className="bg-green-500 px-6 py-3 rounded-full font-bold text-white hover:bg-green-600 transition">
                    Crear Nuevo Evento
                </button>
            </div>

            {modalAbierto && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-gray-800 rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="sticky top-0 bg-gradient-to-r from-purple-600 to-pink-600 text-white p-6 flex justify-between items-center rounded-t-3xl">
                            <h2 className="text-2xl font-bold">{modoEdicion ? "Editar Evento" : "Nuevo Evento"}</h2>
                            <button onClick={cerrarModal} className="hover:bg-white hover:bg-opacity-20 p-2 rounded-lg transition-colors">
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-white">
                            <input
                                type="text"
                                placeholder="Banda / Artista *"
                                value={formData.banda}
                                onChange={(e) => setFormData({ ...formData, banda: e.target.value })}
                                className="w-full p-3 rounded-lg bg-gray-700 text-white"
                                required
                            />
                            <input
                                type="text"
                                placeholder="Álbum / Disco"
                                value={formData.disco}
                                onChange={(e) => setFormData({ ...formData, disco: e.target.value })}
                                className="w-full p-3 rounded-lg bg-gray-700 text-white"
                            />
                            <input
                                type="date"
                                value={formData.fecha}
                                onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
                                className="w-full p-3 rounded-lg bg-gray-700 text-white"
                                required
                            />
                            <input
                                type="time"
                                placeholder="Hora (opcional)"
                                value={formData.hora}
                                onChange={(e) => setFormData({ ...formData, hora: e.target.value })}
                                className="w-full p-3 rounded-lg bg-gray-700 text-white"
                            />
                            <input
                                type="text"
                                placeholder="Dirección / Lugar"
                                value={formData.direccion}
                                onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                                className="w-full p-3 rounded-lg bg-gray-700 text-white"
                                required
                            />
                            <input
                                type="url"
                                placeholder="URL de la imagen"
                                value={formData.imagenUrl}
                                onChange={(e) => setFormData({ ...formData, imagenUrl: e.target.value })}
                                className="w-full p-3 rounded-lg bg-gray-700 text-white"
                            />
                            <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => setFile(e.target.files?.[0] || null)}
                                className="w-full p-3 rounded-lg bg-gray-700 text-white"
                            />

                            <div className="flex gap-4">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        value="claro"
                                        checked={formData.diseño === "claro"}
                                        onChange={(e) => setFormData({ ...formData, diseño: e.target.value as "claro" | "oscuro" })}
                                        className="w-4 h-4 text-purple-600"
                                    /> Claro
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        value="oscuro"
                                        checked={formData.diseño === "oscuro"}
                                        onChange={(e) => setFormData({ ...formData, diseño: e.target.value as "claro" | "oscuro" })}
                                        className="w-4 h-4 text-purple-600"
                                    /> Oscuro
                                </label>
                            </div>

                            <label className="flex items-center gap-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={formData.promocionado}
                                    onChange={(e) => setFormData({ ...formData, promocionado: e.target.checked })}
                                    className="w-5 h-5 text-purple-600 rounded"
                                />
                                Quiero promocionar este evento
                            </label>

                            {formData.promocionado && (
                                <input
                                    type="text"
                                    placeholder="Código Promocional"
                                    value={formData.codigoPromocional}
                                    onChange={(e) => setFormData({ ...formData, codigoPromocional: e.target.value })}
                                    className="w-full p-3 rounded-lg bg-gray-700 text-white"
                                />
                            )}

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={cerrarModal}
                                    className="flex-1 px-6 py-3 rounded-full bg-gray-500 hover:bg-gray-600 transition"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className={`flex-1 px-6 py-3 rounded-full ${isSubmitting ? "bg-gray-400 cursor-not-allowed" : "bg-blue-500 hover:bg-blue-600"} transition`}
                                >
                                    {isSubmitting ? "Subiendo..." : (modoEdicion ? "Actualizar" : "Crear Evento")}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}