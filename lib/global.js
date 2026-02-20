import { Platform } from 'react-native';

if (Platform.OS === 'web') {
    if (typeof global.Buffer === 'undefined') {
        global.Buffer = require('buffer').Buffer;
    }
    if (typeof global.process === 'undefined') {
        global.process = require('process');
    }
}
