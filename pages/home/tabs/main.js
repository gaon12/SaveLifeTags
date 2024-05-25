import React, { useState, useEffect } from 'react';
import { View, Alert, Dimensions, TextInput, Modal, TouchableWithoutFeedback, Keyboard, Animated, FlatList, StyleSheet, Text, TouchableOpacity, ScrollView } from 'react-native';
import { Button as RNEButton, Image, ListItem } from 'react-native-elements';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { fetchPersonDetails, searchPersonByName } from './utils/API';
import PersonDetails from './utils/PersonDetails';

const Button = ({ title, onPress, buttonStyle = {}, ...props }) => (
  <RNEButton title={title} onPress={onPress} buttonStyle={buttonStyle} {...props} />
);

const getScrollHeight = () => {
  const { height } = Dimensions.get('window');
  const buttonHeight = 66; // 수동 검색, QR코드 스캔, NFC 태그 스캔 버튼의 높이
  return (height - buttonHeight * 3);
};

const getOrientation = () => {
  const { width, height } = Dimensions.get('window');
  return width > height ? 'landscape' : 'portrait';
};

const App = () => {
  const [facing, setFacing] = useState('back');
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [showScanner, setShowScanner] = useState(false);
  const [showManualSearch, setShowManualSearch] = useState(false);
  const [manualSearchValue, setManualSearchValue] = useState('');
  const [searchOption, setSearchOption] = useState('id');
  const [orientation, setOrientation] = useState(getOrientation());
  const [modalYPosition] = useState(new Animated.Value(0));
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [personDetails, setPersonDetails] = useState(null);
  const [scrollHeight, setScrollHeight] = useState(getScrollHeight());

  useEffect(() => {
    const updateOrientation = () => {
      setOrientation(getOrientation());
      setScrollHeight(getScrollHeight());
    };
    Dimensions.addEventListener('change', updateOrientation);
    const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', keyboardDidShow);
    const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', keyboardDidHide);
    return () => {
      Dimensions.remove('change', updateOrientation);
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  const keyboardDidShow = () => {
    Animated.timing(modalYPosition, {
      toValue: -150,
      duration: 150,
      useNativeDriver: true,
    }).start();
  };

  const keyboardDidHide = () => {
    Animated.timing(modalYPosition, {
      toValue: 0,
      duration: 150,
      useNativeDriver: true,
    }).start();
  };

  const handleBarCodeScanned = async ({ type, data }) => {
    setScanned(true);
    try {
      const parsedData = JSON.parse(data);
      if (parsedData.person_id) {
        const person = await fetchPersonDetails(parsedData.person_id);
        setPersonDetails(person);
      } else {
        Alert.alert('Error', 'QR code does not contain a valid person_id');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to parse QR code');
    }
    setShowScanner(false);
  };

  const handleManualSearchSubmit = async () => {
    if (manualSearchValue) {
      if (searchOption === 'name') {
        setLoading(true);
        try {
          const persons = await searchPersonByName(manualSearchValue);
          setSearchResults(persons);
        } catch (error) {
          Alert.alert('Error', error.message);
        } finally {
          setLoading(false);
        }
      } else {
        try {
          const person = await fetchPersonDetails(manualSearchValue);
          setPersonDetails(person);
        } catch (error) {
          Alert.alert('Error', error.message);
        }
      }
    } else {
      Alert.alert('Manual Search', 'Please enter a value to search.');
    }
  };

  const handleNFCScan = () => {
    Alert.alert('NFC Scan', 'This is the NFC scan function.');
  };

  const closeModal = () => {
    setManualSearchValue('');
    setSearchResults([]);
    setShowManualSearch(false);
    Keyboard.dismiss();
  };

  const clearInput = () => {
    setManualSearchValue('');
  };

  const getPlaceholderText = () => {
    return searchOption === 'id' ? 'Enter ID' : 'Enter name';
  };

  const handleSearchResultPress = async (person) => {
    try {
      const personDetails = await fetchPersonDetails(person.person_id);
      setPersonDetails(personDetails);
      closeModal();
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  const renderItem = ({ item }) => (
    <ListItem bottomDivider onPress={() => handleSearchResultPress(item)}>
      <Image
        source={{ uri: `${item.photo_path}?${new Date().getTime()}` }}
        style={styles.resultImage}
        onError={() => {
          console.error('Failed to load image:', item.photo_path);
        }}
      />
      <ListItem.Content>
        <ListItem.Title>{item.name}</ListItem.Title>
      </ListItem.Content>
      <ListItem.Chevron />
    </ListItem>
  );

  const handleIdInputChange = (value) => {
    if (/^\d*$/.test(value)) {
      setManualSearchValue(value);
    }
  };

  if (!permission) {
    return <Text>Requesting for camera permission...</Text>;
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={{ textAlign: 'center' }}>We need your permission to show the camera</Text>
        <Button title="Grant permission" onPress={requestPermission} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {showScanner ? (
        <CameraView
          style={styles.camera}
          facing={facing}
          onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
          barcodeScannerSettings={{
            barcodeTypes: ['qr'],
          }}
        >
          <View style={styles.cameraButtonContainer}>
            <Button title="Scan QR Code" onPress={() => setScanned(false)} />
          </View>
        </CameraView>
      ) : (
        <View style={styles.detailsWrapper}>
          <ScrollView contentContainerStyle={styles.scrollViewContent}>
            <PersonDetails personDetails={personDetails} scrollHeight={scrollHeight} />
          </ScrollView>
          <View style={styles.buttonWrapper}>
            <Button
              title="수동 검색"
              buttonStyle={{ backgroundColor: '#3b5998', height: 66 }} // 1.5배 높이
              onPress={() => setShowManualSearch(true)}
            />
            <View style={orientation === 'portrait' ? styles.portraitButtons : styles.landscapeButtons}>
              <Button
                title="QR코드 스캔"
                buttonStyle={{ backgroundColor: '#f39c12', flex: 1, height: 66 }} // 1.5배 높이
                onPress={() => setShowScanner(true)}
              />
              <Button
                title="NFC 태그 스캔"
                buttonStyle={{ backgroundColor: '#1abc9c', flex: 1, height: 66 }} // 1.5배 높이
                onPress={handleNFCScan}
              />
            </View>
          </View>
        </View>
      )}
      <Modal
        visible={showManualSearch}
        animationType="slide"
        transparent={true}
        onRequestClose={closeModal}
      >
        <TouchableWithoutFeedback onPress={closeModal}>
          <View style={styles.modalContainer}>
            <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
              <Animated.View style={[styles.modalContent, { transform: [{ translateY: modalYPosition }] }]}>
                <Text style={styles.modalTitle}>수동 검색</Text>
                <View style={styles.radioContainer}>
                  <TouchableOpacity onPress={() => { setSearchOption('id'); setManualSearchValue(''); }} style={styles.radioOption}>
                    <View style={styles.radioButton}>
                      {searchOption === 'id' && <View style={styles.radioButtonSelected} />}
                    </View>
                    <Text style={styles.radioButtonText}>ID</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => { setSearchOption('name'); setManualSearchValue(''); }} style={styles.radioOption}>
                    <View style={styles.radioButton}>
                      {searchOption === 'name' && <View style={styles.radioButtonSelected} />}
                    </View>
                    <Text style={styles.radioButtonText}>이름</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.inputContainer}>
                  <TextInput
                    style={styles.input}
                    placeholder={getPlaceholderText()}
                    placeholderTextColor="#555"
                    value={manualSearchValue}
                    onChangeText={searchOption === 'id' ? handleIdInputChange : setManualSearchValue}
                    keyboardType={searchOption === 'id' ? 'numeric' : 'default'}
                  />
                  {manualSearchValue ? (
                    <TouchableOpacity onPress={clearInput} style={styles.clearButton}>
                      <Text style={styles.clearButtonText}>X</Text>
                    </TouchableOpacity>
                  ) : null}
                </View>
                {searchOption === 'name' && searchResults.length > 0 && (
                  <FlatList
                    data={searchResults}
                    renderItem={renderItem}
                    keyExtractor={(item) => item.person_id.toString()}
                    style={styles.resultList}
                    contentContainerStyle={searchResults.length > 5 ? styles.scrollContent : null}
                  />
                )}
                <View style={styles.modalButtonContainer}>
                  <TouchableOpacity onPress={handleManualSearchSubmit} style={styles.modalButton}>
                    <Text style={styles.modalButtonText}>Submit</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={closeModal} style={styles.modalButton}>
                    <Text style={styles.modalButtonText}>Close</Text>
                  </TouchableOpacity>
                </View>
              </Animated.View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  camera: {
    flex: 1,
    width: '100%',
  },
  buttonWrapper: {
    width: '100%',
    position: 'absolute',
    bottom: 0,
    flexDirection: 'column',
  },
  cameraButtonContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginBottom: 20,
  },
  portraitButtons: {
    flexDirection: 'column',
  },
  landscapeButtons: {
    flexDirection: 'row',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '80%',
    padding: 20,
    borderRadius: 10,
    backgroundColor: '#fff',
    elevation: 10,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  input: {
    flex: 1,
    padding: 10,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 5,
    marginBottom: 20,
    fontSize: 18,
    color: '#000',
  },
  clearButton: {
    position: 'absolute',
    right: 10,
    top: 10,
  },
  clearButtonText: {
    fontSize: 16,
    color: '#999',
  },
  checkBoxContainer: {
    backgroundColor: 'transparent',
    borderWidth: 0,
  },
  radioContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 20,
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 10,
  },
  radioButton: {
    height: 24,
    width: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 5,
  },
  radioButtonSelected: {
    height: 12,
    width: 12,
    borderRadius: 6,
    backgroundColor: '#000',
  },
  radioButtonText: {
    fontSize: 16,
    color: '#000',
  },
  modalButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  modalButton: {
    padding: 10,
    backgroundColor: '#3b5998',
    borderRadius: 5,
    marginHorizontal: 10,
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
  },
  resultList: {
    width: '100%',
    marginTop: 20,
  },
  scrollContent: {
    maxHeight: 200,
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  resultImage: {
    width: 50,
    height: 50,
    marginRight: 10,
  },
  detailsWrapper: {
    flex: 1,
  },
  scrollViewContent: {
    paddingBottom: 150,
  },
});

export default App;
