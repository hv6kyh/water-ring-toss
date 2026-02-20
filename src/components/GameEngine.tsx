import Matter from 'matter-js';
import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { useSensor } from '../hooks/useSensor';
import {
    createRing,
    initPhysics,
    PEG_DIAMETER,
    PEG_HEIGHT,
    RING_OUTER_RADIUS,
    rings,
    updateGravity
} from '../physics';

import {
    SCREEN_HEIGHT,
    SCREEN_WIDTH,
    TANK_HEIGHT,
    TANK_OFFSET_X,
    TANK_OFFSET_Y,
    TANK_WIDTH
} from '../../constants/layout';

interface GameEngineProps {
    isPlay: boolean;
    onSuccess: () => void;
    ringColors: string[];
}

export interface GameEngineRef {
    emitBubbles: (x: number, y: number) => void;
}

interface BodyState {
    x: number;
    y: number;
    angle: number;
}

interface Bubble {
    id: number;
    x: Animated.Value;
    y: Animated.Value;
    size: number;
    opacity: Animated.Value;
}

export const GameEngine = forwardRef<GameEngineRef, GameEngineProps>(({ isPlay, onSuccess, ringColors }, ref) => {
    const engineRef = useRef<Matter.Engine | null>(null);
    const renderFrameRef = useRef<number>(0);
    const bubbleIdCounter = useRef(0);

    // State for rendering positions
    const [ringPositions, setRingPositions] = useState<BodyState[]>([]);
    const [pegPosition, setPegPosition] = useState<BodyState>({
        x: TANK_OFFSET_X + TANK_WIDTH / 2,
        y: TANK_OFFSET_Y + TANK_HEIGHT / 2 + 50,
        angle: 0
    });
    const [bubbles, setBubbles] = useState<Bubble[]>([]);

    const { x, y } = useSensor();
    const sensorData = { x, y };

    // Bubble emitter function exposed to parent
    useImperativeHandle(ref, () => ({
        emitBubbles: (x: number, y: number) => {
            const newBubbles: Bubble[] = [];
            for (let i = 0; i < 8; i++) {
                const id = bubbleIdCounter.current++;
                const size = Math.random() * 12 + 4;
                const bubbleX = new Animated.Value(x + (Math.random() - 0.5) * 40);
                const bubbleY = new Animated.Value(y);
                const opacity = new Animated.Value(0.8);

                newBubbles.push({ id, x: bubbleX, y: bubbleY, size, opacity });

                Animated.parallel([
                    Animated.timing(bubbleY, {
                        toValue: y - (300 + Math.random() * 400),
                        duration: 1200 + Math.random() * 800,
                        useNativeDriver: true,
                    }),
                    Animated.timing(opacity, {
                        toValue: 0,
                        duration: 1200 + Math.random() * 800,
                        useNativeDriver: true,
                    }),
                    Animated.timing(bubbleX, {
                        toValue: x + (Math.random() - 0.5) * 120,
                        duration: 1500,
                        useNativeDriver: true,
                    })
                ]).start(() => {
                    setBubbles(prev => prev.filter(b => b.id !== id));
                });
            }
            setBubbles(prev => [...prev, ...newBubbles]);
        }
    }));

    // Initialize physics world once
    useEffect(() => {
        const { engine } = initPhysics(
            SCREEN_WIDTH,
            SCREEN_HEIGHT,
            TANK_WIDTH,
            TANK_HEIGHT,
            TANK_OFFSET_X,
            TANK_OFFSET_Y
        );
        engineRef.current = engine;

        // Spread rings at the bottom of the tank
        ringColors.forEach((color, index) => {
            createRing(
                TANK_OFFSET_X + TANK_WIDTH / 2 + (index * 20 - 40),
                TANK_OFFSET_Y + TANK_HEIGHT - 50 - index * 10,
                color
            );
        });

        setRingPositions(rings.map(r => ({ x: r.position.x, y: r.position.y, angle: r.angle })));

        // Setup global callback for physics events
        // @ts-ignore
        global.onRingSuccess = () => {
            onSuccess();
        };

        return () => {
            Matter.Engine.clear(engine);
            Matter.World.clear(engine.world, false);
            cancelAnimationFrame(renderFrameRef.current);
            rings.length = 0;
            // @ts-ignore
            global.onRingSuccess = null;
        };
    }, []);

    // Sync Gyro sensor data with physics gravity
    useEffect(() => {
        updateGravity(sensorData.x, sensorData.y);
    }, [sensorData.x, sensorData.y]);

    // Main rendering loop
    useEffect(() => {
        if (!isPlay || !engineRef.current) return;

        const loop = () => {
            Matter.Engine.update(engineRef.current!, 1000 / 60);

            setRingPositions(rings.map(r => ({
                x: r.position.x - RING_OUTER_RADIUS,
                y: r.position.y - RING_OUTER_RADIUS,
                angle: r.angle
            })));

            const pegBody = engineRef.current!.world.bodies.find(b => b.label === 'peg');
            if (pegBody) {
                setPegPosition({
                    x: pegBody.position.x - PEG_DIAMETER / 2,
                    y: pegBody.position.y - PEG_HEIGHT / 2,
                    angle: pegBody.angle
                });
            }

            renderFrameRef.current = requestAnimationFrame(loop);
        };

        renderFrameRef.current = requestAnimationFrame(loop);

        return () => {
            cancelAnimationFrame(renderFrameRef.current);
        };
    }, [isPlay]);

    return (
        <View style={styles.container}>
            {/* Render Peg */}
            <View
                style={[
                    styles.peg,
                    {
                        width: PEG_DIAMETER + 4,
                        height: PEG_HEIGHT,
                        left: pegPosition.x - 2,
                        top: pegPosition.y,
                        transform: [{ rotate: `${pegPosition.angle}rad` }],
                    },
                ]}
            >
                <View style={styles.pegCap} />
                <View style={styles.pegHighlight} />
            </View>

            {/* Render Bubbles */}
            {bubbles.map(bubble => (
                <Animated.View
                    key={bubble.id}
                    style={[
                        styles.bubble,
                        {
                            width: bubble.size,
                            height: bubble.size,
                            borderRadius: bubble.size / 2,
                            transform: [
                                { translateX: bubble.x },
                                { translateY: bubble.y }
                            ],
                            opacity: bubble.opacity,
                        }
                    ]}
                >
                    <View style={styles.bubbleDot} />
                </Animated.View>
            ))}

            {/* Render Rings */}
            {ringColors.map((color, index) => {
                const pos = ringPositions[index];
                if (!pos) return null;
                return (
                    <View
                        key={`ring-${index}-${color}`}
                        style={[
                            styles.ring,
                            {
                                width: RING_OUTER_RADIUS * 2,
                                height: RING_OUTER_RADIUS * 2,
                                borderRadius: RING_OUTER_RADIUS,
                                borderColor: color,
                                left: pos.x,
                                top: pos.y,
                                transform: [{ rotate: `${pos.angle}rad` }],
                                shadowColor: color,
                            },
                        ]}
                    >
                        <View style={styles.ringInnerShadow} />
                        <View style={styles.ringGlow} />
                        <View style={styles.ringHighlight} />
                    </View>
                );
            })}
        </View>
    );
});

const styles = StyleSheet.create({
    container: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'transparent',
        overflow: 'hidden',
    },
    peg: {
        position: 'absolute',
        backgroundColor: '#FFD700', // Gold/Yellow
        borderRadius: 4,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.2)',
        shadowColor: '#000',
        shadowOffset: { width: 2, height: 0 },
        shadowOpacity: 0.3,
        shadowRadius: 2,
    },
    pegCap: {
        width: '100%',
        height: 10,
        backgroundColor: '#FFD700',
        borderRadius: 5,
        position: 'absolute',
        top: -5,
    },
    pegHighlight: {
        width: 3,
        height: '90%',
        backgroundColor: 'rgba(255, 255, 255, 0.5)',
        position: 'absolute',
        left: 2,
        top: '5%',
        borderRadius: 2,
    },
    ring: {
        position: 'absolute',
        borderWidth: 8,
        backgroundColor: 'transparent',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.4,
        shadowRadius: 4,
        elevation: 6,
    },
    ringInnerShadow: {
        ...StyleSheet.absoluteFillObject,
        borderRadius: RING_OUTER_RADIUS,
        borderWidth: 1,
        borderColor: 'rgba(0, 0, 0, 0.2)',
    },
    ringGlow: {
        ...StyleSheet.absoluteFillObject,
        borderRadius: RING_OUTER_RADIUS,
        borderWidth: 2,
        borderColor: 'rgba(255, 255, 255, 0.2)',
        margin: -1,
    },
    ringHighlight: {
        position: 'absolute',
        top: 6,
        left: 6,
        width: 12,
        height: 8,
        backgroundColor: 'rgba(255, 255, 255, 0.6)',
        borderRadius: 6,
        transform: [{ rotate: '-45deg' }],
    },
    bubble: {
        position: 'absolute',
        backgroundColor: 'rgba(255, 255, 255, 0.25)',
        borderWidth: 0.5,
        borderColor: 'rgba(255, 255, 255, 0.5)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    bubbleDot: {
        width: '30%',
        height: '30%',
        backgroundColor: 'rgba(255, 255, 255, 0.6)',
        borderRadius: 10,
        position: 'absolute',
        top: '20%',
        left: '20%',
    }
});
