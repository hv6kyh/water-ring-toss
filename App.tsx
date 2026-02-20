import { useAudioPlayer } from 'expo-audio';
import React, { useEffect, useRef, useState } from 'react';
import { Alert, Dimensions, ImageBackground, StatusBar, StyleSheet, Text, View } from 'react-native';
import { Controls } from './src/components/Controls';
import { GameEngine, GameEngineRef } from './src/components/GameEngine';
import { PEG_DIAMETER, rings } from './src/physics';

const { width, height } = Dimensions.get('window');
const RING_COLORS = ['#FF4500', '#FFD700', '#32CD32', '#1E90FF', '#9370DB'];

export default function App() {
    const [isPlay, setIsPlay] = useState(true);
    const [successCount, setSuccessCount] = useState(0);
    const gameEngineRef = useRef<GameEngineRef>(null);

    // Audio players using the new expo-audio (SDK 54+)
    const bubblePlayer = useAudioPlayer(require('./assets/sounds/bubble.mp3'));
    const successPlayer = useAudioPlayer(require('./assets/sounds/success.mp3'));
    const bgmPlayer = useAudioPlayer(require('./assets/sounds/bgm.mp3'));

    // Initialize sounds
    useEffect(() => {
        if (bgmPlayer) {
            bgmPlayer.loop = true;
            bgmPlayer.volume = 0.4;
            bgmPlayer.play();
        }
    }, [bgmPlayer]);

    const playBubbleSound = async (x: number, y: number) => {
        // Trigger visual bubbles in GameEngine
        if (gameEngineRef.current) {
            gameEngineRef.current.emitBubbles(x, y);
        }
        if (bubblePlayer) {
            // Replay from start
            bubblePlayer.seekTo(0);
            bubblePlayer.play();
        }
    };

    // Monitor success condition
    useEffect(() => {
        const successInterval = setInterval(() => {
            let newSuccessCount = 0;

            rings.forEach(ring => {
                const sensor = ring.parts.find(p => p.label === 'ring_sensor');
                if (sensor) {
                    // Check if ring center is roughly around the peg
                    const isNearPeg = Math.abs(ring.position.x - width / 2) < PEG_DIAMETER * 3;
                    // Check if vertical position is within peg range
                    const isWithinHeight = ring.position.y > (height / 2 + 50) - 100 && ring.position.y < (height / 2 + 50) + 100;
                    const isSettled = ring.speed < 0.4;

                    if (isNearPeg && isWithinHeight && isSettled) {
                        newSuccessCount++;
                    }
                }
            });

            setSuccessCount(newSuccessCount);

            if (newSuccessCount === RING_COLORS.length && isPlay) {
                if (successPlayer) successPlayer.play();
                setTimeout(() => {
                    setIsPlay(false);
                    Alert.alert(
                        "🎉 SUCCESS! 🎉",
                        "Great job! All rings are on the peg!",
                        [{ text: "Play Again", onPress: () => handleRestart() }]
                    );
                }, 500);
            }
        }, 1000);

        return () => clearInterval(successInterval);
    }, [isPlay]);

    const handleRestart = () => {
        setSuccessCount(0);
        setIsPlay(true);
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />
            <ImageBackground
                source={require('./assets/images/underwater.png')}
                style={styles.background}
                resizeMode="cover"
            >
                <GameEngine
                    ref={gameEngineRef}
                    isPlay={isPlay}
                    onSuccess={() => { }}
                    ringColors={RING_COLORS}
                />

                <View style={styles.hud}>
                    <View style={styles.scoreContainer}>
                        <Text style={styles.scoreText}>SCORE</Text>
                        <Text style={styles.scoreValue}>{successCount} / {RING_COLORS.length}</Text>
                    </View>
                </View>

                <Controls onPressBubble={playBubbleSound} />
            </ImageBackground>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#001a33',
    },
    background: {
        flex: 1,
        width: '100%',
        height: '100%',
    },
    hud: {
        position: 'absolute',
        top: 60,
        width: '100%',
        alignItems: 'center',
        zIndex: 10,
    },
    scoreContainer: {
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.2)',
        alignItems: 'center',
    },
    scoreText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: 'rgba(255, 255, 255, 0.7)',
        letterSpacing: 2,
    },
    scoreValue: {
        fontSize: 28,
        fontWeight: '900',
        color: '#fff',
        textShadowColor: 'rgba(0, 0, 0, 0.5)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 4,
    },
});
