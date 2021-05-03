import React, {useState, useEffect} from 'react';
import {
  StyleSheet,
  Text,
  View,
  Platform,
  Dimensions,
  TextInput,
} from 'react-native';
import MapView, {PROVIDER_GOOGLE, Marker} from 'react-native-maps';
import Geolocation from 'react-native-geolocation-service';
import Geocoder from 'react-native-geocoding';
import {GooglePlacesAutocomplete} from 'react-native-google-places-autocomplete';
import {check, PERMISSIONS, RESULTS, request} from 'react-native-permissions';

const GOOGLE_API_KEY = 'AIzaSyBreh0sI9BcJ_36QdIcezkh3tc2DSkynYM';
const {height, width} = Dimensions.get('window');

const Map = ({navigation, ...props}) => {
  const [region, setRegion] = useState({
    latitude: 37.78825,
    longitude: -122.4324,
    latitudeDelta: 0.015,
    longitudeDelta: 0.0121,
  });
  const [address, setaddress] = useState();
  const [marker, setMarker] = useState({
    coordinate: {
      latitude: 0,
      longitude: 0,
    },
    title: 'Let_s find your taxi',
    description: 'Taxi Locator',
    id: 1,
  });
  const [destination, setDestination] = useState('');
  const [predictions, setPredictions] = useState([]);
  const [listViewDisplayed, setlistViewDisplayed] = useState('auto');
  const [error, setError] = useState(null);

  useEffect(() => {
    console.log(predictions);
    const focusUnsuscribe = navigation.addListener('focus', () => {
      getGeoLocation();
    });
    return () => focusUnsuscribe;
  }, [predictions]);

  const getCurrentPosition = () => {
    Geolocation.getCurrentPosition(
      position => {
        setRegion({
          ...region,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
        setMarker({
          ...marker,
          coordinate: {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          },
        });
        getCurrentAddress(position.coords.latitude, position.coords.longitude);
      },
      error => {
        console.log('location error', error);
      },
      {enableHighAccuracy: false, timeout: 15000},
    );
  };
    const getCurrentAddress = (latitude, longitude) => {
    fetch(
      'https://maps.googleapis.com/maps/api/geocode/json?key=' +
        GOOGLE_API_KEY +
        '&latlng=' +
        latitude +
        ',' +
        longitude,
    )
      .then(res => res.json())
      .then(response => {
        console.log(response);
        setaddress(response.results[0].formatted_address);
      })
      .catch(error => console.log('GeocoderLocation', error));
  };
  
  const GeocoderLocation = async (latitude, longitude) => {
    await Geocoder.init(GOOGLE_API_KEY);
    await Geocoder.from(latitude, longitude)
      .then(json => {
        console.log('found address', json);
        setRegion({
          latitude,
          longitude,
          ...region,
        });
        var addressComponent = json.results[0].formatted_address;
        setaddress(addressComponent);
        setMarker({
          coordinate: {
            latitude: json.results[0].geometry.location.lat,
            longitude: json.results[0].geometry.location.lng,
          },
          title: JSON.stringify(
            json.results[0].address_components[0].long_name,
          ).replace(/"/g, ''),
          description: JSON.stringify(
            json.results[0].formatted_address,
          ).replace(/"/g, ''),
        });
      })
      .catch(error => console.warn('GeocoderLocation', error));
  };


  const getGeoLocation = async () => {
    if (Platform.OS === 'android') {
      console.log('Inside Android Platform');
      const result = await check(PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION).then(
        res => {
          return res;
        },
      );
      result === RESULTS.GRANTED
        ? getCurrentPosition()
        : request(PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION).then(
            result => result === RESULTS.GRANTED && getCurrentPosition(),
          );
    }
  };

  const goToInitialLocation = region => {
    let initialRegion = Object.assign({}, region);
    initialRegion['latitudeDelta'] = 0.005;
    initialRegion['longitudeDelta'] = 0.005;
  };
  const onRegionChange = region => {
    GeocoderLocation(region.latitude, region.longitude);
  };
  const onChangeDestination = async destination => {
    setDestination(destination);
    const apiURL = `https://maps.googleapis.com/maps/api/place/autocomplete/json?key=${GOOGLE_API_KEY}
                    &input=${destination}&location=${region.latitude},${region.longitude}`;
    try {
      const result = await fetch(apiURL);
      const json = await result.json();
      setPredictions(json.predictions);
    } catch (err) {
      console.log(err);
    }
  };

  const showPredictions = () => {
    const predictionText = predictions.map(item => (
      <View key={item.place_id} style={styles.predictions}>
        <Text>{item.description}</Text>
      </View>
    ));
    return predictionText;
  };

  return (
    <View>
      <MapView
        provider={PROVIDER_GOOGLE}
        initialRegion={region}
        region={region}
        onRegionChangeComplete={reg => onRegionChange(reg)}
        style={styles.mapView}
        showsUserLocation={true}>
        <Marker
          coordinate={marker.coordinate}
          draggable
          pinColor="#f2A884"
          onDragEnd={e => {
            GeocoderLocation(
              e.nativeEvent.coordinate.latitude,
              e.nativeEvent.coordinate.longitude,
            );
          }}
        />
      </MapView>
      <View style={styles.input}>
        <GooglePlacesAutocomplete
          currentLocation={false}
          enableHighAccuracyLocation={true}
          placeholder="Search for a location"
          minLength={2} // minimum length of text to search
          autoFocus={false}
          returnKeyType={'search'}
          listViewDisplayed={listViewDisplayed}
          fetchDetails={true}
          renderDescription={row => row.description}
          enablePoweredByContainer={false}
          listUnderlayColor="lightgrey"
          onPress={(data, details) => {
            setlistViewDisplayed(null);
            // setaddress(data.description);
            setRegion({
              ...region,
              latitude: details.geometry.location.lat,
              longitude: details.geometry.location.lng,
            });
            // goToInitialLocation(region);
          }}
          textInputProps={{
            onChangeText: text => {
              setlistViewDisplayed(null);
            },
          }}
          getDefaultValue={() => {
            return ''; // text input default value
          }}
          query={{
            key: GOOGLE_API_KEY,
            language: 'en', // language of the results
            // components: I18nManager.isRTL ? 'country:ind' : 'country:ind',
          }}
          styles={{
            description: {
              fontFamily: 'Calibri',
              color: 'black',
              //   position: 'absolute',
              fontSize: 12,
            },
            predefinedPlacesDescription: {
              color: 'black',
            },
            listView: {
              //   position: 'absolute',
              marginTop: 0,
              backgroundColor: 'white',
              borderBottomEndRadius: 15,
              elevation: 2,
            },
          }}
          nearbyPlacesAPI="GooglePlacesSearch"
          GooglePlacesSearchQuery={{
            rankby: 'distance',
            types: 'building',
          }}
          filterReverseGeocodingByTypes={[
            'locality',
            'administrative_area_level_3',
          ]}
          debounce={200}
        />
      </View>
    </View>
  );
};

export default Map;

const styles = StyleSheet.create({
  mapView: {
    height: height,
    width: width,
  },
  input: {
    position: 'absolute',
    top: 18,
    width: '90%',
    alignSelf: 'center',
    borderRadius: 5,
    backgroundColor: 'white',
  },
  predictions: {
    backgroundColor: 'white',
    height: 40,
    width: '90%',
    justifyContent: 'center',
  },
});
