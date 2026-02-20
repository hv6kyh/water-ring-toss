import { useAudioPlayer } from 'expo-audio';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef, useState } from 'react';
import { Alert, ImageBackground, StatusBar, StyleSheet, Text, View } from 'react-native';
import {
    FRAME_COLOR,
    FRAME_HIGHLIGHT,
    FRAME_SHADOW,
    SCREEN_HEIGHT,
    SCREEN_WIDTH,
    SIDE_BEZEL,
    TANK_HEIGHT,
    TANK_WIDTH,
    TOP_BEZEL
} from './constants/layout';
import { Controls } from './src/components/Controls';
import { GameEngine, GameEngineRef } from './src/components/GameEngine';
import { rings } from './src/physics';

const RING_COLORS = ['#FF595E', '#FFCA3A', '#8AC926', '#1982C4', '#6A4C93'];

export default function App() {
    const [isPlay, setIsPlay] = useState(true);
    const [successCount, setSuccessCount] = useState(0);
    const gameEngineRef = useRef<GameEngineRef>(null);

    // Audio players
    const bubblePlayer = useAudioPlayer(require('./assets/sounds/Hit.wav'));
    const successPlayer = useAudioPlayer(require('./assets/sounds/success.mp3'));
    const bgmPlayer = useAudioPlayer(require('./assets/sounds/bgm.mp3'));

    useEffect(() => {
        if (bgmPlayer) {
            bgmPlayer.loop = true;
            bgmPlayer.volume = 0.3;
            bgmPlayer.play();
        }
    }, [bgmPlayer]);

    const playBubbleSound = async (x: number, y: number) => {
        if (gameEngineRef.current) {
            gameEngineRef.current.emitBubbles(x, y);
        }
        if (bubblePlayer) {
            bubblePlayer.seekTo(0);
            bubblePlayer.play();
        }
    };

    const playSuccessSound = () => {
        if (successPlayer) {
            successPlayer.seekTo(0);
            successPlayer.play();
        }
    };

    useEffect(() => {
        const successInterval = setInterval(() => {
            if (!isPlay) return;

            const currentPeggedCount = rings.filter(r => r.plugin.isPegged).length;

            if (currentPeggedCount !== successCount) {
                setSuccessCount(currentPeggedCount);
                if (currentPeggedCount > successCount) {
                    playSuccessSound();
                }
            }

            if (currentPeggedCount === RING_COLORS.length && isPlay) {
                setTimeout(() => {
                    setIsPlay(false);
                    Alert.alert(
                        "🎉 SUCCESS! 🎉",
                        "Great job! All rings are on the peg!",
                        [{ text: "Play Again", onPress: () => handleRestart() }]
                    );
                }, 500);
            }
        }, 500);

        return () => clearInterval(successInterval);
    }, [isPlay, successCount]);

    const handleRestart = () => {
        setSuccessCount(0);
        setIsPlay(true);
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />

            <View style={styles.outerBackground} />

            {/* Main Console Frame with 3D Effect */}
            <View style={styles.frameWrapper}>
                <LinearGradient
                    colors={[FRAME_HIGHLIGHT, FRAME_COLOR, FRAME_SHADOW]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.frame}
                >
                    {/* Inner frame bevel for depth */}
                    <View style={styles.innerBezel} />

                    {/* Window Container */}
                    <View style={styles.tankContainer}>
                        {/* Glass Layer with Reflections */}
                        <View style={styles.glassLayer}>
                            <View style={styles.reflectionTop} />
                            <View style={styles.reflectionBottom} />
                        </View>

                        <View style={styles.tankWindow}>
                            <ImageBackground
                                source={require('./assets/images/underwater.png')}
                                style={styles.tankBackground}
                                resizeMode="cover"
                            >
                                <GameEngine
                                    ref={gameEngineRef}
                                    isPlay={isPlay}
                                    onSuccess={() => { }}
                                    ringColors={RING_COLORS}
                                />

                                {/* Polished Score Badge */}
                                <View style={styles.hud}>
                                    <View style={styles.scoreBadge}>
                                        <Text style={styles.scoreLabel}>PEG STATUS</Text>
                                        <Text style={styles.scoreValue}>
                                            {successCount}
                                            <Text style={styles.scoreTotal}> / {RING_COLORS.length}</Text>
                                        </Text>
                                    </View>
                                </View>
                            </ImageBackground>
                        </View>
                    </View>

                    {/* Branding 디테일 */}
                    <View style={styles.brandArea}>
                        <View style={styles.logoRow}>
                            <View style={styles.logoLight} />
                            <Text style={styles.logoText}>WATER WIZARD</Text>
                        </View>
                        <View style={styles.vent} />
                    </View>

                    <Controls onPressBubble={playBubbleSound} />
                </LinearGradient>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#111',
        alignItems: 'center',
        justifyContent: 'center',
    },
    outerBackground: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: '#050505',
    },
    frameWrapper: {
        width: SCREEN_WIDTH,
        height: SCREEN_HEIGHT,
        borderRadius: 50,
        backgroundColor: '#000',
        padding: 4, // Dark border around the frame
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 25 },
        shadowOpacity: 0.8,
        shadowRadius: 35,
        elevation: 30,
    },
    frame: {
        flex: 1,
        borderRadius: 46,
        overflow: 'hidden',
    },
    innerBezel: {
        ...StyleSheet.absoluteFillObject,
        borderWidth: 3,
        borderColor: 'rgba(255, 255, 255, 0.25)',
        borderRadius: 46,
    },
    tankContainer: {
        position: 'absolute',
        top: TOP_BEZEL,
        left: SIDE_BEZEL,
        width: TANK_WIDTH,
        height: TANK_HEIGHT,
        borderRadius: 24,
        backgroundColor: '#000',
        padding: 4, // Thick black bezel for the glass
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.6,
        shadowRadius: 10,
    },
    tankWindow: {
        flex: 1,
        borderRadius: 20,
        overflow: 'hidden',
        backgroundColor: '#001a33',
    },
    tankBackground: {
        width: '100%',
        height: '100%',
    },
    glassLayer: {
        ...StyleSheet.absoluteFillObject,
        zIndex: 45,
        borderRadius: 20,
        overflow: 'hidden',
        pointerEvents: 'none',
    },
    reflectionTop: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '40%',
        backgroundColor: 'rgba(255, 255, 255, 0.08)',
    },
    reflectionBottom: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: '20%',
        backgroundColor: 'rgba(255, 255, 255, 0.03)',
    },
    hud: {
        position: 'absolute',
        top: 15,
        width: '100%',
        alignItems: 'center',
    },
    scoreBadge: {
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.15)',
        alignItems: 'center',
    },
    scoreLabel: {
        fontSize: 10,
        fontWeight: '900',
        color: 'rgba(255, 255, 255, 0.5)',
        letterSpacing: 1.5,
        marginBottom: 2,
    },
    scoreValue: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
    },
    scoreTotal: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.4)',
    },
    brandArea: {
        position: 'absolute',
        top: TOP_BEZEL - 40,
        width: '100%',
        alignItems: 'center',
    },
    logoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        opacity: 0.6,
    },
    logoLight: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#FF5252',
        marginRight: 10,
        shadowColor: '#FF5252',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 4,
    },
    logoText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: 'bold',
        letterSpacing: 3,
    },
    vent: {
        width: 40,
        height: 4,
        backgroundColor: 'rgba(0, 0, 0, 0.2)',
        borderRadius: 2,
        marginTop: 6,
    }
});
