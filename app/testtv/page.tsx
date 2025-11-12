"use client";
import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';

// ========================================
// DECLARACIONES DE TIPOS PARA PRESENTATION API
// ========================================
declare global {
  interface Window {
    PresentationRequest: {
      new (urls: string | string[]): PresentationRequest;
      prototype: PresentationRequest;
    };
  }

  interface PresentationConnectionAvailableEvent extends Event {
    readonly connection: PresentationConnection;
  }

  interface PresentationAvailability extends EventTarget {
    readonly value: boolean;
    onchange: ((this: PresentationAvailability, ev: Event) => void) | null;
  }

  interface PresentationConnection extends EventTarget {
    readonly id: string;
    readonly state: 'connecting' | 'connected' | 'closed' | 'terminated';
    onconnect: ((this: PresentationConnection, ev: Event) => void) | null;
    onclose: ((this: PresentationConnection, ev: Event) => void) | null;
    onterminate: ((this: PresentationConnection, ev: Event) => void) | null;
    onmessage: ((this: PresentationConnection, ev: MessageEvent) => void) | null;
    close(): void;
    terminate(): void;
    send(message: string | ArrayBuffer | Blob): void;
  }

  interface PresentationRequest extends EventTarget {
    onconnectionavailable: ((this: PresentationRequest, ev: PresentationConnectionAvailableEvent) => void) | null;
    start(): Promise<PresentationConnection>;
    reconnect(presentationId: string): Promise<PresentationConnection>;
    getAvailability(): Promise<PresentationAvailability>;
  }
}

// ========================================
// INTERFACES DEL COMPONENTE
// ========================================
interface PresentationDevice {
  id: string;
  name: string;
  type: 'chromecast' | 'miracast' | 'airplay' | 'unknown';
  connected: boolean;
}

const ScreenCastDeviceSelector: React.FC = () => {
  const [devices, setDevices] = useState<PresentationDevice[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [presentationRequest, setPresentationRequest] = useState<PresentationRequest | null>(null);
  const [connection, setConnection] = useState<PresentationConnection | null>(null);
  const [apiSupported, setApiSupported] = useState<boolean>(true);
  const [stream, setStream] = useState<MediaStream | null>(null);

  // Verificar soporte de APIs
  useEffect(() => {
    const checkSupport = (): void => {
      if (!window.PresentationRequest) {
        setApiSupported(false);
        Swal.fire({
          title: 'API No Soportada',
          html: `
            <div class="text-left">
              <p class="mb-3">Tu navegador no soporta Presentation API.</p>
              <p class="font-semibold mb-2">✅ Funciona en:</p>
              <ul class="text-sm space-y-1 ml-4">
                <li>• Chrome/Edge en Android (con Chromecast cerca)</li>
                <li>• Chrome en Windows/Mac (con Chromecast)</li>
              </ul>
              <p class="font-semibold mt-3 mb-2">❌ NO funciona en:</p>
              <ul class="text-sm space-y-1 ml-4">
                <li>• Safari (iOS/Mac)</li>
                <li>• Firefox</li>
                <li>• Navegadores móviles (excepto Chrome Android)</li>
              </ul>
              <div class="mt-4 p-3 bg-blue-50 rounded">
                <p class="text-xs text-blue-800">
                  <strong>💡 Para Miracast real:</strong> Necesitas una app nativa (no web)
                </p>
              </div>
            </div>
          `,
          icon: 'warning',
          confirmButtonColor: '#3b82f6',
          width: '600px',
        });
      }
    };
    checkSupport();
  }, []);

  // Inicializar Presentation Request
  useEffect(() => {
    if (window.PresentationRequest) {
      try {
        // URL de presentación (en producción, necesitas una página real)
        const presentationUrl = window.location.origin + '/presentation-display';
        const request = new window.PresentationRequest([presentationUrl]);
        setPresentationRequest(request);

        // Escuchar disponibilidad de dispositivos usando onconnectionavailable
        request.onconnectionavailable = (event: PresentationConnectionAvailableEvent) => {
          const conn = event.connection;
          setConnection(conn);
          handleConnectionEstablished(conn);
        };

      } catch (error) {
        console.error('Error al inicializar Presentation API:', error);
      }
    }
  }, []);

  const handleConnectionEstablished = (conn: PresentationConnection): void => {
    conn.onconnect = () => {
      console.log('Conexión establecida');
    };

    conn.onclose = () => {
      setIsConnected(false);
      Swal.fire({
        title: 'Conexión cerrada',
        text: 'La transmisión ha finalizado',
        icon: 'info',
        confirmButtonColor: '#3b82f6',
      });
    };

    conn.onterminate = () => {
      setIsConnected(false);
    };
  };

  // Escanear dispositivos disponibles
  const scanDevices = async (): Promise<void> => {
    if (!presentationRequest) {
      await Swal.fire({
        title: 'API no disponible',
        text: 'Tu navegador no soporta Presentation API',
        icon: 'error',
        confirmButtonColor: '#ef4444',
      });
      return;
    }

    setIsScanning(true);
    
    try {
      // Obtener disponibilidad
      const availability = await presentationRequest.getAvailability();
      
      const updateDevices = (): void => {
        if (availability.value) {
          // En la práctica, la API no da lista exacta de dispositivos
          // Solo indica si HAY dispositivos disponibles
          const detectedDevices: PresentationDevice[] = [
            { id: 'cast-device-1', name: 'Dispositivo Compatible Detectado', type: 'chromecast', connected: false },
          ];
          setDevices(detectedDevices);
          Swal.fire({
            title: '✅ Dispositivos encontrados',
            text: 'Se detectaron dispositivos compatibles cerca',
            icon: 'success',
            confirmButtonColor: '#10b981',
          });
        } else {
          setDevices([]);
          Swal.fire({
            title: 'No hay dispositivos',
            text: 'No se encontraron dispositivos compatibles cerca. Verifica que tu Chromecast esté encendido.',
            icon: 'info',
            confirmButtonColor: '#3b82f6',
          });
        }
      };

      availability.onchange = updateDevices;
      updateDevices(); // Ejecutar inmediatamente

    } catch (error) {
      console.error('Error al escanear:', error);
      Swal.fire({
        title: 'Error de escaneo',
        text: 'No se pudo buscar dispositivos. Verifica los permisos.',
        icon: 'error',
        confirmButtonColor: '#ef4444',
      });
    } finally {
      setIsScanning(false);
    }
  };

  // Capturar pantalla local
  const captureScreen = async (): Promise<MediaStream | null> => {
    try {
      const mediaStream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          displaySurface: 'monitor',
        } as MediaTrackConstraints,
        audio: true,
      });
      return mediaStream;
    } catch (error) {
      console.error('Error al capturar pantalla:', error);
      return null;
    }
  };

  // Conectar y transmitir
  const handleConnect = async (): Promise<void> => {
    if (!selectedDeviceId) {
      await Swal.fire({
        title: 'Selecciona un dispositivo',
        text: 'Por favor selecciona un dispositivo para conectar',
        icon: 'warning',
        confirmButtonColor: '#3b82f6',
      });
      return;
    }

    if (!presentationRequest) {
      await Swal.fire({
        title: 'Error',
        text: 'Presentation API no está disponible',
        icon: 'error',
        confirmButtonColor: '#ef4444',
      });
      return;
    }

    try {
      // Capturar pantalla
      const mediaStream = await captureScreen();
      if (!mediaStream) {
        await Swal.fire({
          title: 'Cancelado',
          text: 'No se seleccionó ninguna pantalla para compartir',
          icon: 'info',
          confirmButtonColor: '#3b82f6',
        });
        return;
      }
      
      setStream(mediaStream);

      // Iniciar presentación
      const conn = await presentationRequest.start();
      setConnection(conn);
      handleConnectionEstablished(conn);

      await Swal.fire({
        title: 'Conexión establecida',
        text: 'Transmisión iniciada con éxito.',
        icon: 'success',
        confirmButtonColor: '#10b981',
      });

      setIsConnected(true);
      setDevices((prevDevices) =>
        prevDevices.map((device) =>
          device.id === selectedDeviceId
            ? { ...device, connected: true }
            : device
        )
      );

    } catch (error) {
      console.error('Error al conectar:', error);
      await Swal.fire({
        title: 'Error de conexión',
        text: 'No se pudo establecer la conexión con el dispositivo',
        icon: 'error',
        confirmButtonColor: '#ef4444',
      });
    }
  };

  // Desconectar
  const handleDisconnect = async (): Promise<void> => {
    const result = await Swal.fire({
      title: '¿Cancelar conexión?',
      text: 'Se detendrá la transmisión actual',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Sí, desconectar',
      cancelButtonText: 'Cancelar',
    });

    if (result.isConfirmed) {
      // Detener stream
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
        setStream(null);
      }

      // Cerrar conexión
      if (connection) {
        connection.close();
        setConnection(null);
      }

      setIsConnected(false);
      setDevices((prevDevices) =>
        prevDevices.map((device) => ({ ...device, connected: false }))
      );
      setSelectedDeviceId('');

      await Swal.fire({
        title: 'Conexión finalizada',
        text: 'La transmisión ha sido detenida',
        icon: 'info',
        confirmButtonColor: '#3b82f6',
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-2xl w-full">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-3xl font-bold text-gray-800">
            Screen Mirroring
          </h2>
          <div className="flex items-center gap-3">
            <div
              className={`w-4 h-4 rounded-full transition-all duration-300 ${
                isConnected
                  ? 'bg-red-500 animate-pulse shadow-lg shadow-red-500/50'
                  : 'bg-green-500 shadow-lg shadow-green-500/50'
              }`}
            />
            <span
              className={`font-semibold text-sm ${
                isConnected ? 'text-red-600' : 'text-green-600'
              }`}
            >
              {isConnected ? 'Transmitiendo' : 'Disponible'}
            </span>
          </div>
        </div>

        {/* Alerta de compatibilidad */}
        {!apiSupported && (
          <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-700">
                  <strong>Navegador no compatible.</strong> Usa Chrome en Android o Desktop con Chromecast.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Indicador ON AIR */}
        {isConnected && (
          <div className="bg-red-50 border-2 border-red-500 rounded-lg p-4 mb-6 flex items-center justify-center gap-3">
            <div className="relative">
              <div className="w-6 h-6 bg-red-500 rounded-full animate-ping absolute" />
              <div className="w-6 h-6 bg-red-600 rounded-full relative" />
            </div>
            <span className="text-2xl font-bold text-red-600 tracking-wider">
              ON AIR
            </span>
          </div>
        )}

        {/* Botón escanear */}
        {devices.length === 0 && !isScanning && (
          <div className="text-center py-8">
            <button
              onClick={scanDevices}
              disabled={!apiSupported}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold py-3 px-8 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              🔍 Buscar Dispositivos
            </button>
            <p className="mt-4 text-sm text-gray-500">
              Asegúrate de tener un Chromecast o dispositivo compatible cerca
            </p>
          </div>
        )}

        {/* Escaneando */}
        {isScanning && (
          <div className="text-center py-8">
            <div className="inline-block w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <p className="mt-4 text-gray-600">Buscando dispositivos cercanos...</p>
            <p className="mt-2 text-xs text-gray-500">Esto puede tardar unos segundos</p>
          </div>
        )}

        {/* Lista de dispositivos */}
        {devices.length > 0 && (
          <div className="space-y-3 mb-6">
            {devices.map((device) => (
              <label
                key={device.id}
                className={`flex items-center gap-4 p-4 rounded-lg border-2 transition-all duration-200 cursor-pointer ${
                  selectedDeviceId === device.id
                    ? 'border-blue-500 bg-blue-50 shadow-md'
                    : 'border-gray-200 bg-gray-50 hover:border-blue-300 hover:shadow'
                } ${isConnected && !device.connected ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <input
                  type="radio"
                  name="device"
                  value={device.id}
                  checked={selectedDeviceId === device.id}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setSelectedDeviceId(e.target.value)
                  }
                  disabled={isConnected && !device.connected}
                  className="w-5 h-5 text-blue-600 focus:ring-2 focus:ring-blue-500"
                />
                <div className="flex-1">
                  <p className="font-semibold text-gray-800">{device.name}</p>
                  <p className="text-sm text-gray-500 capitalize">{device.type}</p>
                </div>
                {device.connected && (
                  <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
                    Conectado
                  </span>
                )}
              </label>
            ))}
          </div>
        )}

        {/* Botones de acción */}
        {devices.length > 0 && (
          <div className="flex gap-4">
            {!isConnected ? (
              <>
                <button
                  onClick={handleConnect}
                  disabled={!selectedDeviceId}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                  📡 Conectar y Transmitir
                </button>
                <button
                  onClick={scanDevices}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-3 px-6 rounded-lg transition-all duration-200"
                  title="Volver a escanear"
                >
                  🔄
                </button>
              </>
            ) : (
              <button
                onClick={handleDisconnect}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                ❌ Cancelar conexión
              </button>
            )}
          </div>
        )}

        {/* Footer informativo */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <p className="text-xs text-gray-500 text-center mb-2">
            Usa <strong>Presentation API</strong> + <strong>Screen Capture API</strong>
          </p>
          <p className="text-xs text-gray-400 text-center">
            Requiere dispositivos compatibles (Chromecast, Smart TV con soporte)
          </p>
          <div className="mt-3 p-2 bg-blue-50 rounded text-center">
            <p className="text-xs text-blue-600">
              💡 Solo frontend - No requiere backend
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScreenCastDeviceSelector;