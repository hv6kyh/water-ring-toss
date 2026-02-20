import { Accelerometer } from 'expo-sensors';
import { useCallback, useEffect, useState } from 'react';
import { Platform } from 'react-native';

const ALPHA = 0.2;

export const useSensor = () => {
    const [filteredData, setFilteredData] = useState({ x: 0, y: 0 });
    const [permissionGranted, setPermissionGranted] = useState(Platform.OS !== 'web');

    const initSensor = useCallback(async () => {
        try {
            const isAvailable = await Accelerometer.isAvailableAsync().catch(() => false);
            if (!isAvailable) return;

            Accelerometer.setUpdateInterval(16);

            let lastX = 0;
            let lastY = 0;

            const subscription = Accelerometer.addListener((accelerometerData) => {
                const { x, y } = accelerometerData;
                // Filter data to smooth out noise
                const newX = lastX + ALPHA * (x - lastX);
                const newY = lastY + ALPHA * (y - lastY);

                lastX = newX;
                lastY = newY;

                setFilteredData({ x: newX, y: newY });
            });

            return subscription;
        } catch (e) {
            console.warn('Sensor not available', e);
            return null;
        }
    }, []);

    const requestPermission = async () => {
        if (Platform.OS === 'web' &&
            typeof DeviceMotionEvent !== 'undefined' &&
            typeof (DeviceMotionEvent as any).requestPermission === 'function') {
            try {
                const result = await (DeviceMotionEvent as any).requestPermission();
                if (result === 'granted') {
                    setPermissionGranted(true);
                    return true;
                }
            } catch (e) {
                console.error('DeviceMotion permission error:', e);
            }
            return false;
        }
        setPermissionGranted(true);
        return true;
    };

    useEffect(() => {
        let subscription: any;

        if (permissionGranted) {
            initSensor().then(sub => {
                subscription = sub;
            });
        }

        return () => {
            if (subscription) {
                subscription.remove();
            }
        };
    }, [permissionGranted, initSensor]);

    return { ...filteredData, requestPermission, permissionGranted };
};
