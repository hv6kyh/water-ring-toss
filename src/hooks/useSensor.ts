import { Accelerometer } from 'expo-sensors';
import { useEffect, useState } from 'react';
import { Platform } from 'react-native';

const ALPHA = 0.2;

export const useSensor = () => {
    const [filteredData, setFilteredData] = useState({ x: 0, y: 0 });

    useEffect(() => {
        let subscription: any;

        const initSensor = async () => {
            if (Platform.OS === 'web') {
                return;
            }

            try {
                const isAvailable = await Accelerometer.isAvailableAsync().catch(() => false);
                if (!isAvailable) return;

                Accelerometer.setUpdateInterval(16);

                let lastX = 0;
                let lastY = 0;

                subscription = Accelerometer.addListener((accelerometerData) => {
                    const { x, y } = accelerometerData;
                    const newX = lastX + ALPHA * (x - lastX);
                    const newY = lastY + ALPHA * (y - lastY);

                    lastX = newX;
                    lastY = newY;
                    setFilteredData({ x: newX, y: newY });
                });
            } catch (e) {
                console.warn('Sensor not available', e);
            }
        };

        initSensor();

        return () => {
            if (subscription) {
                subscription.remove();
            }
        };
    }, []);

    return filteredData;
};
