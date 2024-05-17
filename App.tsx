/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React, {useCallback, useEffect} from 'react';
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  useColorScheme,
  View,
  Text,
  ListRenderItem,
  FlatList,
  TouchableOpacity,
  Platform,
  findNodeHandle,
} from 'react-native';

import {Colors, Header} from 'react-native/Libraries/NewAppScreen';
import axios from 'axios';
import {
  isTrackReference,
  LiveKitRoom,
  TrackReferenceOrPlaceholder,
  useLocalParticipant,
  useRoomContext,
  useTracks,
  VideoTrack,
} from '@livekit/react-native';
import {Track} from 'livekit-client';
import {PERMISSIONS, RESULTS, request} from 'react-native-permissions';
import {PermissionsAndroid} from 'react-native';
function App(): React.JSX.Element {
  const isDarkMode = useColorScheme() === 'dark';

  const backgroundStyle = {
    backgroundColor: isDarkMode ? Colors.darker : Colors.lighter,
    flex: 1,
  };

  const requestCameraAccessPermission = async () => {
    console.log('requestCameraAccessPermission');
    const permissions =
      Platform.OS == 'ios'
        ? PERMISSIONS.IOS.CAMERA
        : PERMISSIONS.ANDROID.CAMERA;
    const status = await request(permissions);
    console.log('status', status);
    if (status === 'granted' || status === 'limited') {
      return true;
    } else return false;
  };

  const requestMicrophoneAccessPermission = async () => {
    const permissions =
      Platform.OS == 'ios'
        ? PERMISSIONS.IOS.MICROPHONE
        : PERMISSIONS.ANDROID.RECORD_AUDIO;
    const status = await request(permissions);
    if (status === 'granted' || status === 'limited') {
      return true;
    } else return false;
  };
  const [token, setToken] = React.useState<string | null>(null);
  const [connected, setConnected] = React.useState<boolean>(false);
  const createRoom = async () => {
    const body = {
      roomName: 'testRoom',
      description: 'hhh',
      thumbnail: '',
      textThumbnail: Math.random().toString(36).substring(7),
      language: 'Hindi',
      room_cteate_by: 'user',
      is_private: false,
      roomType: 'video',
      groupInfo: [],
      is_paid: false,
    };
    let apiData = {
      method: 'POST',
      url: 'https://whalesbook-app.whalesbook.com/livekit/create-room',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization:
          'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZGVudGlmaWVyIjoiNjYzNWUzMGE5NWRkMmYyYzljZjhmYjExIiwiYXV0aG9yaXNlZCI6ZmFsc2UsImlhdCI6MTcxNTk2OTcxN30.AVDyV4h6jk4RQEQdxPp0oUMWrqzf4aOdkWhmQz3Lyq8',
      },
      data: body,
    };
    const response = await axios(apiData);
    const {token} = response.data;
    console.log('token', token);
    setToken(token);
  };

  // useEffect(() => {
  //   createRoo

  useEffect(() => {
    requestCameraAccessPermission();
    requestMicrophoneAccessPermission();
  }, []);
  // }, []);

  return (
    <SafeAreaView style={backgroundStyle}>
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor={backgroundStyle.backgroundColor}
      />

      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
        }}>
        <LiveKitRoom
          serverUrl={'wss://whalesnet.livekit.cloud'}
          token={
            'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3MTU5Nzc3MDUsImlzcyI6IkFQSU1wcVBZSmpMRzNCUyIsIm5iZiI6MTcxNTk3NjgwNSwic3ViIjoiYSIsInZpZGVvIjp7ImNhblB1Ymxpc2giOnRydWUsImNhblB1Ymxpc2hEYXRhIjp0cnVlLCJjYW5TdWJzY3JpYmUiOnRydWUsInJvb20iOiJ3aGFsZXN0ZXN0Iiwicm9vbUpvaW4iOnRydWV9fQ.aavJYiNGvNXTWN8yGqWZYVQ-1xqrw0qJPpj3v0UfqmA'
          }
          connect={true}
          onError={error => {
            console.log('error', error);
          }}
          onConnected={() => {
            setConnected(true);
          }}
          options={{
            adaptiveStream: {pixelDensity: 'screen'},
            disconnectOnPageLeave: true,
          }}
          audio={false}
          video={false}>
          <Text>Room View</Text>
          {connected ? <RoomView /> : <Text>Connecting...</Text>}
        </LiveKitRoom>
      </View>
    </SafeAreaView>
  );
}

const RoomView = () => {
  const room = useRoomContext();
  const tracks = useTracks([Track.Source.Camera, Track.Source.ScreenShare]);
  const {isScreenShareEnabled, isCameraEnabled} = useLocalParticipant();

  const renderTrack: ListRenderItem<TrackReferenceOrPlaceholder> = ({item}) => {
    if (isTrackReference(item)) {
      return (
        <View
          style={{
            width: 150,
            height: 100,
            backgroundColor: 'red',
            margin: 10,
            padding: 10,
          }}>
          <Text style={{color: 'white'}}>{item.publication.trackName}</Text>
          <VideoTrack track={item.track} />
        </View>
      );
    } else {
      return (
        <View style={{width: 100, height: 100, backgroundColor: 'red'}}></View>
      );
    }
  };

  const sendCustomData = useCallback(
    (data, destinationIdentities = []) => {
      if (room?.localParticipant?.permissions?.canPublishData) {
        const strData = JSON.stringify(data);

        // eslint-disable-next-line no-undef
        const encoder = new TextEncoder();
        room?.localParticipant?.publishData(encoder.encode(strData), {
          reliable: true,
          destinationIdentities,
        });
      } else {
      }
    },
    [room?.localParticipant],
  );

  const startBroadcast = async () => {
    room.localParticipant
      .setScreenShareEnabled(true)
      .then(track => {
        console.log('Screen share started', track);
        // room.localParticipant.setCameraEnabled(false);
        const message = {
          identity: room?.localParticipant?.identity,
          stopStream: false,
          type: 'handleScreenShare',
          source: 'screen_share',
        };

        sendCustomData(message);
      })
      .catch(err => {
        console.log('Error while start screen share', err);
      });
  };

  const stopBroadcast = useCallback(() => {
    room?.localParticipant
      ?.setScreenShareEnabled(false)
      .then(() => {
        const message = {
          identity: room?.localParticipant?.identity,
          stopStream: true,
          type: 'handleScreenShare',
          source: 'screen_share',
        };

        sendCustomData(message);
      })
      .catch(err => {
        console.log('Error stoping screen share', err);
      });
  }, [room?.localParticipant, sendCustomData]);

  const handleCamera = useCallback(
    async val => {
      room?.localParticipant
        ?.setCameraEnabled(val)
        .then(track => {
          room?.localParticipant?.setScreenShareEnabled(false);

          const message = {
            identity: room?.localParticipant?.identity,
            stopStream: !val,
            type: 'handleScreenShare',
            source: 'camera',
          };

          sendCustomData(message);
          if (!val) {
          } else {
          }
        })
        .catch(err => {
          // Toast(`Error ${val ? 'starting' : 'stopping'} camera`);
          console.log('Error starting camera', err);
        });
    },
    [room?.localParticipant, sendCustomData],
  );

  return (
    <View
      style={{
        flex: 1,
        alignItems: 'stretch',
        justifyContent: 'center',
        backgroundColor: 'blue',
        width: '100%',
      }}>
      <View
        style={{
          flex: 1,
          backgroundColor: 'blue',
        }}>
        <FlatList
          data={tracks}
          renderItem={renderTrack}
          keyExtractor={item => item.publication.trackInfo.sid}
        />
      </View>
      <TouchableOpacity
        onPress={() => {
          isScreenShareEnabled ? stopBroadcast() : startBroadcast();
        }}
        style={{
          width: '50%',
          height: 50,
          backgroundColor: 'red',
          position: 'absolute',
          alignSelf: 'center',
          bottom: 0,
          left: 0,
        }}>
        <Text>Start</Text>
      </TouchableOpacity>
      <TouchableOpacity
        onPress={() => {
          handleCamera(!isCameraEnabled);
        }}
        style={{
          width: '50%',
          height: 50,
          backgroundColor: 'red',
          position: 'absolute',
          alignSelf: 'center',
          bottom: 0,
          right: 0,
        }}>
        <Text>Start camera</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  sectionContainer: {
    marginTop: 32,
    paddingHorizontal: 24,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '600',
  },
  sectionDescription: {
    marginTop: 8,
    fontSize: 18,
    fontWeight: '400',
  },
  highlight: {
    fontWeight: '700',
  },
});

export default App;
