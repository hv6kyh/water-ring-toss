import { Dimensions, Platform } from 'react-native';

const { width: windowWidth, height: windowHeight } = Dimensions.get('window');

// For web/desktop, we want to simulate a mobile screen aspect ratio
const MAX_MOBILE_WIDTH = 480;
const MAX_MOBILE_HEIGHT = 850;

let finalWidth = windowWidth;
let finalHeight = windowHeight;

if (Platform.OS === 'web') {
    // Keep internal aspect ratio close to a typical phone (9:19)
    const aspectRatio = 9 / 19;
    if (windowHeight * aspectRatio < windowWidth) {
        finalHeight = Math.min(windowHeight, MAX_MOBILE_HEIGHT);
        finalWidth = finalHeight * aspectRatio;
    } else {
        finalWidth = Math.min(windowWidth, MAX_MOBILE_WIDTH);
        finalHeight = finalWidth / aspectRatio;
    }
}

export const SCREEN_WIDTH = finalWidth;
export const SCREEN_HEIGHT = finalHeight;

// Retro Water Toy Frame Constants
export const FRAME_COLOR = '#448AFF'; // Vibrant Blue
export const FRAME_HIGHLIGHT = '#82B1FF';
export const FRAME_SHADOW = '#2962FF';

export const BUTTON_COLOR = '#4CAF50';
export const BUTTON_HIGHLIGHT = '#81C784';
export const BUTTON_SHADOW = '#2E7D32';

export const TOP_BEZEL = 50;
export const SIDE_BEZEL = 30;
export const BOTTOM_BEZEL = 200;

export const TANK_WIDTH = SCREEN_WIDTH - SIDE_BEZEL * 2;
export const TANK_HEIGHT = SCREEN_HEIGHT - TOP_BEZEL - BOTTOM_BEZEL;
export const TANK_OFFSET_X = SIDE_BEZEL;
export const TANK_OFFSET_Y = TOP_BEZEL;

