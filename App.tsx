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
  TextInput,
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

  const [connected, setConnected] = React.useState<boolean>(false);

  // useEffect(() => {
  //   createRoo

  useEffect(() => {
    requestCameraAccessPermission();
    requestMicrophoneAccessPermission();
  }, []);
  // }, []);

  const [roomDetails, setRoomDetails] = React.useState<any>({});
  const [start, setStart] = React.useState<boolean>(false);
  console.log('roomDetails', roomDetails);
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
        {!start ? (
          <View
            style={{
              flex: 1,
              justifyContent: 'center',
              alignItems: 'center',
            }}>
            <TextInput
              style={{
                height: 40,
                borderColor: 'gray',
                borderWidth: 1,
                width: 300,
              }}
              onChangeText={text => setRoomDetails({...roomDetails, url: text})}
              value={roomDetails.url}
              placeholder="url"
            />
            <TextInput
              style={{
                height: 40,
                borderColor: 'gray',
                borderWidth: 1,
                width: 300,
              }}
              onChangeText={text =>
                setRoomDetails({...roomDetails, token: text})
              }
              value={roomDetails.token}
              placeholder="token"
            />
            <TouchableOpacity
              onPress={() => setStart(true)}
              style={{
                width: 100,
                height: 50,
                backgroundColor: 'red',
                justifyContent: 'center',
                alignItems: 'center',
                margin: 10,
              }}>
              <Text>Connect</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <LiveKitRoom
            serverUrl={roomDetails.url}
            token={roomDetails.token}
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
        )}
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
          <Text style={{color: 'white'}}>{item.participant.name}</Text>
          <VideoTrack
            trackRef={item}
            style={{
              flexDirection: 'column',
              height: '100%',
              width: '100%',
            }}
          />
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
        width: '100%',
      }}>
      <View
        style={{
          flex: 1,
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
        <Text>Start Screen Share</Text>
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
