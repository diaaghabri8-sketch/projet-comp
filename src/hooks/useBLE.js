import { useState, useRef, useCallback } from 'react';

const SERVICE_UUID = '4fafc201-1fb5-459e-8fcc-c5c9c331914b';
const CHARACTERISTIC_UUID = 'beb5483e-36e1-4688-b7f5-ea07361b26a8';

export default function useBLE() {
  const [isConnected, setIsConnected] = useState(false);
  const [device, setDevice] = useState(null);
  const [error, setError] = useState(null);
  const characteristicRef = useRef(null);
  const onDataRef = useRef(null);

  const connect = async () => {
    try {
      console.log('Ouverture de la recherche (Mode Tolérant)...');
      
      // We use acceptAllDevices: true to ensure "PulseLink_V1" shows up 
      // even if it does not explicitly advertise its service UUID.
      const bleDevice = await navigator.bluetooth.requestDevice({
        acceptAllDevices: true, 
        optionalServices: [SERVICE_UUID] 
      });

      console.log('Appareil sélectionné : ' + bleDevice.name);

      // Clean up previous sessions
      if (bleDevice.gatt.connected) {
          console.log('Fermeture de l\'ancienne session GATT...');
          bleDevice.gatt.disconnect();
          await new Promise(resolve => setTimeout(resolve, 500));
      }

      bleDevice.addEventListener('gattserverdisconnected', onDisconnected);
      
      console.log('Établissement du lien GATT...');
      const server = await bleDevice.gatt.connect();
      
      console.log('Lien établi. Phase de stabilisation (1.5s)...');
      await new Promise(resolve => setTimeout(resolve, 1500)); 

      if (!bleDevice.gatt.connected) {
        throw new Error("La déconnexion est survenue avant la lecture du service. Vérifiez la batterie.");
      }

      console.log('Récupération du service ECG ' + SERVICE_UUID + '...');
      const service = await server.getPrimaryService(SERVICE_UUID);
      
      console.log('Récupération de la caractéristique notify...');
      const characteristic = await service.getCharacteristic(CHARACTERISTIC_UUID);
      characteristicRef.current = characteristic;
      
      console.log('Activation de la télémétrie...');
      await characteristic.startNotifications();
      characteristic.addEventListener('characteristicvaluechanged', handleNotifications);

      setDevice(bleDevice);
      setIsConnected(true);
      setError(null);
      console.log('✅ Appareil prêt et synchronisé !');

    } catch (err) {
      console.error('Bluetooth Logic Trace:', err);
      setIsConnected(false);
      setError(err.name === 'NotFoundError' ? "Appairage annulé par l'utilisateur." : err.message);
    }
  };

  const disconnect = () => {
    if (device && device.gatt.connected) device.gatt.disconnect();
  };

  const onDisconnected = () => {
    console.log('Statut : Signal Bluetooth Perdu.');
    setIsConnected(false);
    setDevice(null);
    characteristicRef.current = null;
  };

  const handleNotifications = (event) => {
    try {
      const value = event.target.value;
      const decoder = new TextDecoder('utf-8');
      const dataString = decoder.decode(value).trim();
      
      let signalHP = 0;
      let pulse = 0;

      // Handle simple peak trigger (e.g. "P" or "1")
      if (dataString === 'P' || dataString === '1') {
        pulse = 800; // Map trigger to highest visibility value
      } else {
        // Fallback to CSV parse: [signalHP, pulse]
        const parts = dataString.split(',');
        if (parts.length >= 2) {
          signalHP = parseFloat(parts[0]);
          pulse = parseInt(parts[1], 10);
        }
      }

      if (onDataRef.current) {
        onDataRef.current({ signalHP, pulse: pulse || 0 });
      }
    } catch (e) {
      console.error('Reception error:', e);
    }
  };

  const onData = useCallback((callback) => {
    onDataRef.current = callback;
  }, []);

  return {
    isConnected,
    error,
    connect,
    disconnect,
    onData
  };
}
