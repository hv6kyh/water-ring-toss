import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useRef } from 'react';
import { Animated, StyleSheet, Text, TouchableWithoutFeedback, View } from 'react-native';
import {
    FRAME_COLOR,
    FRAME_SHADOW,
    SIDE_BEZEL,
    TANK_HEIGHT,
    TANK_OFFSET_X,
    TANK_OFFSET_Y,
    TANK_WIDTH
} from '../../constants/layout';
import { applyNozzleForce } from '../physics';

interface ControlsProps {
    onPressBubble: (x: number, y: number) => void;
}

// Custom Vibrant Green for that specific toy look
const TOY_GREEN_LIGHT = '#39FF14';
const TOY_GREEN_DARK = '#228B22';

export const Controls: React.FC<ControlsProps> = ({ onPressBubble }) => {
    const leftAnim = useRef(new Animated.Value(0)).current; // 0 is out, 1 is in
    const rightAnim = useRef(new Animated.Value(0)).current;

    const LEFT_NOZZLE_X = TANK_OFFSET_X + TANK_WIDTH * 0.25;
    const RIGHT_NOZZLE_X = TANK_OFFSET_X + TANK_WIDTH * 0.75;
    const NOZZLE_Y = TANK_OFFSET_Y + TANK_HEIGHT;
    const FORCE_MAGNITUDE = 0.18;

    const handlePressIn = (isLeft: boolean) => {
        const anim = isLeft ? leftAnim : rightAnim;
        const x = isLeft ? LEFT_NOZZLE_X : RIGHT_NOZZLE_X;

        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        onPressBubble(x, NOZZLE_Y);
        applyNozzleForce(x, NOZZLE_Y, FORCE_MAGNITUDE);

        Animated.spring(anim, {
            toValue: 1,
            useNativeDriver: true,
            friction: 4,
            tension: 100,
        }).start();
    };

    const handlePressOut = (isLeft: boolean) => {
        const anim = isLeft ? leftAnim : rightAnim;
        Animated.spring(anim, {
            toValue: 0,
            friction: 3,
            tension: 40,
            useNativeDriver: true,
        }).start();
    };

    const renderPump = (isLeft: boolean) => {
        const anim = isLeft ? leftAnim : rightAnim;

        // Push the cylinder "in" by moving it down and scaling it
        const translateY = anim.interpolate({
            inputRange: [0, 1],
            outputRange: [0, 25], // Moves 25px into the socket
        });

        const scaleY = anim.interpolate({
            inputRange: [0, 1],
            outputRange: [1, 0.6], // Shortens the cylinder
        });

        return (
            <TouchableWithoutFeedback
                onPressIn={() => handlePressIn(isLeft)}
                onPressOut={() => handlePressOut(isLeft)}
            >
                <View style={styles.pumpWrapper}>
                    {/* The Blue Arched Housing from the photo */}
                    <View style={styles.housing}>
                        <LinearGradient
                            colors={[FRAME_COLOR, FRAME_SHADOW]}
                            style={styles.housingInner}
                        >
                            {/* Dark hole inside */}
                            <View style={styles.socketHole} />

                            {/* The Green Cylinder */}
                            <Animated.View
                                style={[
                                    styles.cylinderContainer,
                                    {
                                        transform: [
                                            { translateY },
                                            { scaleY }
                                        ]
                                    }
                                ]}
                            >
                                {/* Cylinder Body */}
                                <LinearGradient
                                    colors={[TOY_GREEN_LIGHT, TOY_GREEN_DARK]}
                                    start={{ x: 0, y: 0.5 }}
                                    end={{ x: 1, y: 0.5 }}
                                    style={styles.cylinderBody}
                                >
                                    {/* Realistic shine on the plastic */}
                                    <View style={styles.cylinderShine} />
                                </LinearGradient>

                                {/* Front Face of Cylinder (The part you see as a circle in 3D) */}
                                <View style={styles.cylinderTop} />
                            </Animated.View>
                        </LinearGradient>
                    </View>
                    <Text style={styles.pumpLabel}>{isLeft ? 'PUSH L' : 'PUSH R'}</Text>
                </View>
            </TouchableWithoutFeedback>
        );
    };

    return (
        <View style={styles.container}>
            {renderPump(true)}
            {renderPump(false)}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        bottom: 20,
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'space-around',
        paddingHorizontal: SIDE_BEZEL,
        zIndex: 50,
    },
    pumpWrapper: {
        alignItems: 'center',
    },
    housing: {
        width: 110,
        height: 100,
        backgroundColor: 'transparent',
        alignItems: 'center',
        justifyContent: 'flex-end',
    },
    housingInner: {
        width: 90,
        height: 60,
        borderTopLeftRadius: 45,
        borderTopRightRadius: 45,
        borderBottomLeftRadius: 10,
        borderBottomRightRadius: 10,
        alignItems: 'center',
        justifyContent: 'flex-end',
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    socketHole: {
        position: 'absolute',
        bottom: 0,
        width: 70,
        height: 50,
        backgroundColor: 'rgba(0,0,0,0.6)',
        borderTopLeftRadius: 35,
        borderTopRightRadius: 35,
    },
    cylinderContainer: {
        width: 50,
        height: 80,
        alignItems: 'center',
        zIndex: 10,
    },
    cylinderBody: {
        width: 50,
        height: 70,
        borderRadius: 5,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.1)',
        overflow: 'hidden',
    },
    cylinderShine: {
        position: 'absolute',
        top: 0,
        left: 5,
        width: 8,
        height: '100%',
        backgroundColor: 'rgba(255,255,255,0.4)',
    },
    cylinderTop: {
        width: 50,
        height: 20,
        backgroundColor: TOY_GREEN_LIGHT,
        borderRadius: 25,
        marginTop: -10,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.1)',
        // Shadow to give it a face look
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 3,
    },
    pumpLabel: {
        marginTop: 10,
        color: '#fff',
        fontWeight: '900',
        fontSize: 12,
        letterSpacing: 1,
        textShadowColor: 'rgba(0,0,0,0.5)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 2,
    }
});
