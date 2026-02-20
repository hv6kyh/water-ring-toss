import * as Haptics from 'expo-haptics';
import React from 'react';
import { Dimensions, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { applyNozzleForce } from '../physics';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Define nozzle positions based on screen
const LEFT_NOZZLE_X = SCREEN_WIDTH * 0.25;
const RIGHT_NOZZLE_X = SCREEN_WIDTH * 0.75;
const NOZZLE_Y = SCREEN_HEIGHT - 50;
const FORCE_MAGNITUDE = 0.12;

interface ControlsProps {
    onPressBubble: (x: number, y: number) => void;
}

export const Controls: React.FC<ControlsProps> = ({ onPressBubble }) => {
    const handlePressLeft = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        onPressBubble(LEFT_NOZZLE_X, NOZZLE_Y);
        applyNozzleForce(LEFT_NOZZLE_X, NOZZLE_Y, FORCE_MAGNITUDE);
    };

    const handlePressRight = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        onPressBubble(RIGHT_NOZZLE_X, NOZZLE_Y);
        applyNozzleForce(RIGHT_NOZZLE_X, NOZZLE_Y, FORCE_MAGNITUDE);
    };

    return (
        <View style={styles.container}>
            <TouchableOpacity
                style={[styles.button, styles.leftButton]}
                onPressIn={handlePressLeft}
                activeOpacity={0.8}
            >
                <View style={styles.buttonShadow} />
                <View style={styles.buttonTop}>
                    <Text style={styles.buttonText}>PUSH</Text>
                </View>
            </TouchableOpacity>

            <TouchableOpacity
                style={[styles.button, styles.rightButton]}
                onPressIn={handlePressRight}
                activeOpacity={0.8}
            >
                <View style={styles.buttonShadow} />
                <View style={styles.buttonTop}>
                    <Text style={styles.buttonText}>PUSH</Text>
                </View>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        bottom: 40,
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 30,
        zIndex: 20,
    },
    button: {
        width: 100,
        height: 100,
        justifyContent: 'center',
        alignItems: 'center',
    },
    leftButton: {
        // Red theme
    },
    rightButton: {
        // Blue or same theme
    },
    buttonShadow: {
        position: 'absolute',
        bottom: 0,
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
    },
    buttonTop: {
        width: 90,
        height: 90,
        borderRadius: 45,
        backgroundColor: '#ff4757',
        borderWidth: 4,
        borderColor: '#ff6b81',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 10,
    },
    buttonText: {
        color: '#fff',
        fontWeight: '900',
        fontSize: 16,
        textShadowColor: 'rgba(0, 0, 0, 0.5)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 2,
    }
});
