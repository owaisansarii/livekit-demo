## Demo App to Demonstrate Screen Share Bug

### Steps to Reproduce

1. Run the app
2. Enter websocket URL and token
3. Click on Connect
4. Click on Start Screen Share
5. After the screen share starts, tilt/rotate (change orientation) the device
6. Screen share will stop working
7. It eventually crashes the whole app, and nothing works until you force close the app

### Docs Followed

- [Livekit](https://github.com/livekit/client-sdk-react-native)
- [Livekit-webrtc](https://github.com/livekit/react-native-webrtc/blob/master/Documentation/AndroidInstallation.md)

**Please note:** We have not included background services for the sake of simplicity, but we are using it in the actual app.
