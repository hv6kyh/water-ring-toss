import Matter from 'matter-js';
import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { Animated, Dimensions, StyleSheet, View } from 'react-native';
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

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

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
    const [pegPosition, setPegPosition] = useState<BodyState>({ x: SCREEN_WIDTH / 2, y: SCREEN_HEIGHT / 2 + 50, angle: 0 });
    const [bubbles, setBubbles] = useState<Bubble[]>([]);

    const sensorData = useSensor();

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
        const { engine } = initPhysics(SCREEN_WIDTH, SCREEN_HEIGHT);
        engineRef.current = engine;

        ringColors.forEach((color, index) => {
            createRing(SCREEN_WIDTH / 2 + (index * 15 - 30), 100 - index * 60, color);
        });

        setRingPositions(rings.map(r => ({ x: r.position.x, y: r.position.y, angle: r.angle })));

        return () => {
            Matter.Engine.clear(engine);
            Matter.World.clear(engine.world, false);
            cancelAnimationFrame(renderFrameRef.current);
            rings.length = 0;
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
                        width: PEG_DIAMETER,
                        height: PEG_HEIGHT,
                        left: pegPosition.x,
                        top: pegPosition.y,
                        transform: [{ rotate: `${pegPosition.angle}rad` }],
                    },
                ]}
            >
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
                />
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
                        <View style={styles.ringInner} />
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
        backgroundColor: 'transparent', // Background is handled in App.tsx
        overflow: 'hidden',
    },
    peg: {
        position: 'absolute',
        backgroundColor: '#f1c40f', // Bright yellow for contrast
        borderRadius: 5,
        borderWidth: 1,
        borderColor: '#d4ac0d',
    },
    pegHighlight: {
        width: 2,
        height: '100%',
        backgroundColor: 'rgba(255, 255, 255, 0.4)',
        position: 'absolute',
        left: 2,
    },
    ring: {
        position: 'absolute',
        borderWidth: 7, // Slightly thinner than before for better proportions
        backgroundColor: 'transparent',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.5,
        shadowRadius: 5,
        elevation: 5,
    },
    ringInner: {
        ...StyleSheet.absoluteFillObject,
        borderRadius: RING_OUTER_RADIUS,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.3)',
    },
    ringHighlight: {
        position: 'absolute',
        top: 4,
        left: 4,
        width: 10,
        height: 6,
        backgroundColor: 'rgba(255, 255, 255, 0.5)',
        borderRadius: 5,
        transform: [{ rotate: '-45deg' }],
    },
    bubble: {
        position: 'absolute',
        backgroundColor: 'rgba(255, 255, 255, 0.3)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.6)',
    }
});
