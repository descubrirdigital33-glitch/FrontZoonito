"use client";
import React, { createContext, useState, useContext, ReactNode, useEffect, Dispatch, SetStateAction } from "react";
import { Cancion } from "../components/Reproductor";
import { UserContext } from "./UserContext";
interface ReproductorContextProps {
  lista: Cancion[];
  setLista: Dispatch<SetStateAction<Cancion[]>>;
  agregarCancion: (c: Cancion) => void;
  eliminarCancion: (id: string) => void;
  indiceActual: number;
  setIndiceActual: (i: number) => void;
  reproduciendo: boolean;
  togglePlay: () => void;
  siguiente: () => void;
  anterior: () => void;
  minimizar: boolean;
  toggleMinimizar: () => void;
}

const ReproductorContext = createContext<ReproductorContextProps | undefined>(undefined);

export const ReproductorProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useContext(UserContext);
  
  const [lista, setLista] = useState<Cancion[]>(() => {
    if (typeof window !== "undefined" && user) {
      const userKey = `playlist_${user.id}`;
      const stored = localStorage.getItem(userKey);
      return stored ? JSON.parse(stored) : [];
    }
    return [];
  });
  
  const [indiceActual, setIndiceActual] = useState<number>(0);
  const [reproduciendo, setReproduciendo] = useState<boolean>(false);
  const [minimizar, setMinimizar] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window !== "undefined" && user) {
      const userKey = `playlist_${user.id}`;
      localStorage.setItem(userKey, JSON.stringify(lista));
    }
  }, [lista, user]);

  useEffect(() => {
    if (!user) {
      setLista([]);
      setIndiceActual(0);
      setReproduciendo(false);
    }
  }, [user]);

  const agregarCancion = (cancion: Cancion) => {
    setLista((prev) => {
      if (prev.some(c => c.id === cancion.id)) {
        return prev;
      }
      return [...prev, cancion];
    });
  };

  const eliminarCancion = (id: string) => {
    setLista((prev) => {
      const nuevaLista = prev.filter((c) => c.id !== id);
      if (indiceActual >= nuevaLista.length && nuevaLista.length > 0) {
        setIndiceActual(nuevaLista.length - 1);
      } else if (nuevaLista.length === 0) {
        setIndiceActual(0);
        setReproduciendo(false);
      }
      return nuevaLista;
    });
  };

  const togglePlay = () => setReproduciendo((prev) => !prev);
  
  const siguiente = () => {
    if (lista.length > 0) {
      setIndiceActual((prev) => (prev + 1) % lista.length);
    }
  };
  
  const anterior = () => {
    if (lista.length > 0) {
      setIndiceActual((prev) => (prev - 1 + lista.length) % lista.length);
    }
  };
  
  const toggleMinimizar = () => setMinimizar((prev) => !prev);

  return (
    <ReproductorContext.Provider
      value={{
        lista,
        setLista,
        agregarCancion,
        eliminarCancion,
        indiceActual,
        setIndiceActual,
        reproduciendo,
        togglePlay,
        siguiente,
        anterior,
        minimizar,
        toggleMinimizar,
      }}
    >
      {children}
    </ReproductorContext.Provider>
  );
};
export const useReproductor = () => {
  const context = useContext(ReproductorContext);
  if (!context) throw new Error("useReproductor debe usarse dentro de ReproductorProvider");
  return context;
};

