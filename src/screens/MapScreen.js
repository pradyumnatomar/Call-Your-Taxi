import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import Map from '../components/Map';

const MapScreen = ({navigation, ...props}) => {
  return (
    <View>
      <Map navigation={navigation} />
    </View>
  );
};

export default MapScreen;

const styles = StyleSheet.create({});
