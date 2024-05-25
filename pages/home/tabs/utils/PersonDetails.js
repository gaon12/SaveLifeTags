import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, Text, Image, TouchableOpacity, Modal, Dimensions, Linking, Platform } from 'react-native';

const PersonDetails = ({ personDetails, scrollHeight }) => {
  const [modalVisible, setModalVisible] = useState(false);

  const makeCall = (number) => {
    let phoneNumber = number;
    if (Platform.OS !== 'android') {
      phoneNumber = `telprompt:${number}`;
    } else {
      phoneNumber = `tel:${number}`;
    }
    Linking.openURL(phoneNumber);
  };

  const openAddress = (address) => {
    if (!address.startsWith('``')) {
      const url = Platform.select({
        ios: `maps:0,0?q=${address}`,
        android: `geo:0,0?q=${address}`,
      });
      Linking.openURL(url);
    }
  };

  const renderSkeleton = () => (
    <View style={[styles.detailsContainer, { height: scrollHeight }]}>
      <View style={styles.skeletonImage} />
      <View style={styles.skeletonText} />
      <View style={styles.skeletonText} />
      <View style={styles.skeletonText} />
      <View style={styles.skeletonText} />
      <View style={styles.skeletonText} />
      <Text style={styles.loadingText}>Loading details, please wait...</Text>
    </View>
  );

  if (!personDetails) {
    return renderSkeleton();
  }

  return (
    <ScrollView contentContainerStyle={[styles.detailsContainer, { height: scrollHeight }]}>
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => {
          setModalVisible(!modalVisible);
        }}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Image
              source={{ uri: `${personDetails.photo_path}?${new Date().getTime()}` }}
              style={styles.modalImage}
              resizeMode="contain"
            />
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setModalVisible(!modalVisible)}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      <View style={styles.personHeader}>
        <TouchableOpacity onPress={() => setModalVisible(true)}>
          <Image
            source={{ uri: `${personDetails.photo_path}?${new Date().getTime()}` }}
            style={styles.personImage}
            onError={() => {
              console.error('Failed to load image:', personDetails.photo_path);
            }}
          />
        </TouchableOpacity>
        <Text style={styles.personName}>{personDetails.name}</Text>
      </View>
      <TouchableOpacity style={styles.personDetailsRow} onPress={() => makeCall(personDetails.contact_number1)}>
        <Text style={styles.personDetail}>{personDetails.contact_number1}</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.personDetailsRow} onPress={() => openAddress(personDetails.address)}>
        <Text style={styles.personDetail}>{personDetails.address.startsWith('``') ? personDetails.address.substring(2) : personDetails.address}</Text>
      </TouchableOpacity>
      <View style={styles.additionalDetails}>
        <Text style={styles.additionalDetail}>Date of Birth: {personDetails.date_of_birth}</Text>
        <Text style={styles.additionalDetail}>Gender: {personDetails.gender}</Text>
        <Text style={styles.additionalDetail}>Nationality: {personDetails.nationality}</Text>
        <Text style={styles.additionalDetail}>Blood Type: {personDetails.blood_type}</Text>
        <Text style={styles.additionalDetail}>Allergies: {personDetails.allergies}</Text>
        <Text style={styles.additionalDetail}>Height: {personDetails.height}</Text>
        <Text style={styles.additionalDetail}>Weight: {personDetails.weight}</Text>
        <Text style={styles.additionalDetail}>Medical History: {personDetails.medical_history}</Text>
        <Text style={styles.additionalDetail}>Status: {personDetails.status}</Text>
        <Text style={styles.additionalDetail}>Registration Date: {personDetails.registration_date}</Text>
        <Text style={styles.additionalDetail}>Guardian Name: {personDetails.guardian_name}</Text>
        <Text style={styles.additionalDetail}>Last Update: {personDetails.last_update}</Text>
        <Text style={styles.additionalDetail}>Notes: {personDetails.notes}</Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  detailsContainer: {
    padding: 20,
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
    borderRadius: 10,
    margin: 10,
  },
  personHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  personImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginRight: 20,
    backgroundColor: '#e1e1e1',
  },
  personName: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  personDetailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  personDetail: {
    fontSize: 18,
    marginLeft: 10,
    color: '#517fa4',
    textDecorationLine: 'underline',
  },
  additionalDetails: {
    marginTop: 20,
  },
  additionalDetail: {
    fontSize: 16,
    marginBottom: 10,
  },
  skeletonImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#e1e1e1',
    marginBottom: 20,
  },
  skeletonText: {
    width: 200,
    height: 20,
    backgroundColor: '#e1e1e1',
    marginBottom: 10,
  },
  loadingText: {
    fontSize: 16,
    marginTop: 10,
    color: '#999',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    width: '80%',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
  },
  modalImage: {
    width: '100%',
    height: 300,
  },
  closeButton: {
    marginTop: 20,
    padding: 10,
    backgroundColor: '#517fa4',
    borderRadius: 5,
  },
  closeButtonText: {
    color: 'white',
    fontSize: 16,
  },
});

export default PersonDetails;
