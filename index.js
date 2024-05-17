/**
 * @format
 */

import {AppRegistry} from 'react-native';
import App from './App';
import {name as appName} from './app.json';
import {registerGlobals} from '@livekit/react-native';
import 'fast-text-encoding';
import 'react-native-url-polyfill/auto';
AppRegistry.registerComponent(appName, () => App);
registerGlobals();
