import React, { useEffect, useState, useCallback, useContext, useRef } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert, RefreshControl, TextInput, Modal, TouchableWithoutFeedback } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Clipboard from 'expo-clipboard';
import Toast from 'react-native-toast-message';
import { initializeDatabase, getAppLogs } from '../../../database';
import { LanguageContext } from '../../../context/LanguageContext';
import { ThemeContext } from '../../../context/ThemeContext';
import Icon from 'react-native-vector-icons/FontAwesome5';
import moment from 'moment';

const ServiceLogs = ({ navigation }) => {
  const { locale, getTranslation } = useContext(LanguageContext);
  const { themeColor, darkMode } = useContext(ThemeContext);
  const [logs, setLogs] = useState([]);
  const [db, setDb] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [offset, setOffset] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [statusFilter, setStatusFilter] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [selectedLog, setSelectedLog] = useState(null);
  const scrollViewRef = useRef(null);

  const fetchLogs = async (refresh = false) => {
    const database = await initializeDatabase();
    setDb(database);
    const logsData = await getAppLogs(database, 50, refresh ? 0 : offset);
    if (refresh) {
      setLogs(logsData);
      setOffset(50);
    } else {
      setLogs([...logs, ...logsData]);
      setOffset(offset + 50);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener('tabPress', e => {
      scrollViewRef.current?.scrollTo({ y: 0, animated: true });
    });

    return unsubscribe;
  }, [navigation]);

  const handleLoadMore = () => {
    fetchLogs();
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchLogs(true).then(() => setRefreshing(false));
  }, []);

  const handlePress = (log) => {
    setSelectedLog(log);
  };

  const handleLongPress = async (log) => {
    const logDetails = `Status: ${log.stats === 0 ? 'Success' : log.stats === 1 ? 'Warning' : 'Error'}
Date: ${formatDate(log.date)}
Message: ${log.message}`;
    await Clipboard.setStringAsync(logDetails);
    Toast.show({
      type: 'success',
      text1: getTranslation('copiedToClipboard', locale),
      text2: getTranslation('logDetailsCopied', locale),
    });
  };

  const truncatedMessage = (message) => {
    return message.length > 40 ? message.substring(0, 40) + "..." : message;
  };

  const filteredLogs = logs.filter(log => {
    const logDate = new Date(log.date);
    const matchesSearchTerm = log.message.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDateRange = (!startDate || logDate >= startDate) && (!endDate || logDate <= endDate);
    const matchesStatusFilter = statusFilter === null || log.stats === statusFilter;

    return matchesSearchTerm && matchesDateRange && matchesStatusFilter;
  });

  const themeStyles = {
    backgroundColor: darkMode ? '#333' : '#f7f7f7',
    color: darkMode ? '#fff' : '#000',
  };

  const resetFilters = () => {
    setSearchTerm('');
    setStartDate(null);
    setEndDate(null);
    setStatusFilter(null);
    setShowFilters(false);
  };

  const closeFilters = () => {
    setShowFilters(false);
  };

  const applyFilters = () => {
    if (startDate && !endDate) {
      Alert.alert(getTranslation('endDateRequired', locale));
      return;
    }
    if (endDate && !startDate) {
      Alert.alert(getTranslation('startDateRequired', locale));
      return;
    }
    setShowFilters(false);
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 0:
        return <Icon name="check-circle" size={16} color="white" style={{ backgroundColor: '#64C896' }} />;
      case 1:
        return <Icon name="exclamation-circle" size={16} color="white" style={{ backgroundColor: '#FFC100' }} />;
      case 2:
        return <Icon name="times-circle" size={16} color="white" style={{ backgroundColor: '#C40C0C' }} />;
      default:
        return null;
    }
  };

  const formatDate = (date) => {
    return moment(date).format('YYYY-MM-DD HH:mm:ss');
  };

  return (
    <View style={[styles.container, { backgroundColor: themeStyles.backgroundColor }]}>
      <View style={styles.header}>
        <TextInput
          style={[styles.searchInput, { borderColor: themeColor, color: themeStyles.color }]}
          placeholder={getTranslation('search', locale)}
          placeholderTextColor="#888"
          value={searchTerm}
          onChangeText={setSearchTerm}
        />
        <TouchableOpacity style={[styles.filterButton, { backgroundColor: themeColor }]} onPress={() => setShowFilters(true)}>
          <Text style={styles.filterButtonText}>{getTranslation('filter', locale)}</Text>
        </TouchableOpacity>
      </View>
      <Modal
        visible={showFilters}
        animationType="slide"
        transparent={true}
        onRequestClose={closeFilters}
      >
        <TouchableWithoutFeedback onPress={closeFilters}>
          <View style={styles.modalContainer}>
            <TouchableWithoutFeedback>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>{getTranslation('filter', locale)}</Text>
                
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>{getTranslation('dateRange', locale)}</Text>
                  <View style={styles.datePickerRow}>
                    <View style={styles.datePickerContainer}>
                      <TouchableOpacity style={styles.dateButton} onPress={() => setShowStartDatePicker(true)}>
                        <Text style={styles.dateButtonText}>{getTranslation('startDate', locale)}</Text>
                        {startDate && <Text style={styles.dateValue}>{moment(startDate).format('YYYY-MM-DD')}</Text>}
                      </TouchableOpacity>
                      {showStartDatePicker && (
                        <DateTimePicker
                          value={startDate || new Date()}
                          mode="date"
                          display="default"
                          maximumDate={endDate || new Date()}
                          onChange={(event, selectedDate) => {
                            setShowStartDatePicker(false);
                            if (selectedDate) setStartDate(selectedDate);
                          }}
                        />
                      )}
                    </View>
                    <View style={styles.datePickerContainer}>
                      <TouchableOpacity style={styles.dateButton} onPress={() => setShowEndDatePicker(true)}>
                        <Text style={styles.dateButtonText}>{getTranslation('endDate', locale)}</Text>
                        {endDate && <Text style={styles.dateValue}>{moment(endDate).format('YYYY-MM-DD')}</Text>}
                      </TouchableOpacity>
                      {showEndDatePicker && (
                        <DateTimePicker
                          value={endDate || new Date()}
                          mode="date"
                          display="default"
                          minimumDate={startDate || new Date(0)}
                          maximumDate={new Date()}
                          onChange={(event, selectedDate) => {
                            setShowEndDatePicker(false);
                            if (selectedDate) setEndDate(selectedDate);
                          }}
                        />
                      )}
                    </View>
                  </View>
                </View>
                
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>{getTranslation('status', locale)}</Text>
                  <View style={styles.statusFilterContainer}>
                    <TouchableOpacity style={[styles.modalFilterButton, statusFilter === null && styles.activeModalFilter]} onPress={() => setStatusFilter(null)}>
                      <Text style={[styles.modalFilterButtonText, statusFilter === null && styles.activeModalFilterText]}>{getTranslation('all', locale)}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.modalFilterButton, statusFilter === 0 && styles.activeModalFilter]} onPress={() => setStatusFilter(0)}>
                      <Text style={[styles.modalFilterButtonText, statusFilter === 0 && styles.activeModalFilterText]}>{getTranslation('success', locale)}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.modalFilterButton, statusFilter === 1 && styles.activeModalFilter]} onPress={() => setStatusFilter(1)}>
                      <Text style={[styles.modalFilterButtonText, statusFilter === 1 && styles.activeModalFilterText]}>{getTranslation('warning', locale)}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.modalFilterButton, statusFilter === 2 && styles.activeModalFilter]} onPress={() => setStatusFilter(2)}>
                      <Text style={[styles.modalFilterButtonText, statusFilter === 2 && styles.activeModalFilterText]}>{getTranslation('error', locale)}</Text>
                    </TouchableOpacity>
                  </View>
                </View>
                
                <View style={styles.modalActions}>
                  <TouchableOpacity style={[styles.modalButton, { backgroundColor: themeColor }]} onPress={applyFilters}>
                    <Text style={styles.modalButtonText}>{getTranslation('apply', locale)}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.modalButton, { backgroundColor: themeColor }]} onPress={resetFilters}>
                    <Text style={styles.modalButtonText}>{getTranslation('reset', locale)}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
      <ScrollView
        style={styles.scrollView}
        onScroll={({ nativeEvent }) => {
          if (isCloseToBottom(nativeEvent)) {
            handleLoadMore();
          }
        }}
        scrollEventThrottle={400}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ref={scrollViewRef}
      >
        {filteredLogs.length === 0 ? (
          <Text style={[styles.noLogs, { color: themeStyles.color }]}>
            {getTranslation('noLogs', locale)}
          </Text>
        ) : (
          filteredLogs.map((log, index) => (
            <TouchableOpacity
              key={`${log.id}-${index}`}
              style={[styles.logBox, getLogBoxStyle(log.stats, themeColor)]}
              onPress={() => handlePress(log)}
              onLongPress={() => handleLongPress(log)}
            >
              <View style={styles.logHeader}>
                {getStatusIcon(log.stats)}
                <Text style={styles.logStatus}>
                  {log.stats === 0 ? getTranslation('success', locale) : log.stats === 1 ? getTranslation('warning', locale) : getTranslation('error', locale)}
                </Text>
                <Text style={styles.logDate}>{formatDate(log.date)}</Text>
              </View>
              <Text style={styles.logMessage}>{truncatedMessage(log.message)}</Text>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
      {selectedLog && (
        <Modal
          visible={true}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setSelectedLog(null)}
        >
          <TouchableWithoutFeedback onPress={() => setSelectedLog(null)}>
            <View style={styles.modalContainer}>
              <TouchableWithoutFeedback>
                <View style={styles.modalContent}>
                  <Text style={styles.modalTitle}>{getTranslation('logDetails', locale)}</Text>
                  <Text style={styles.modalText}>Status: {selectedLog.stats === 0 ? 'Success' : selectedLog.stats === 1 ? 'Warning' : 'Error'}</Text>
                  <Text style={styles.modalText}>Date: {formatDate(selectedLog.date)}</Text>
                  <Text style={styles.modalText}>Message: {selectedLog.message}</Text>
                  <View style={styles.modalActions}>
                    <TouchableOpacity style={[styles.modalButton, { backgroundColor: themeColor }]} onPress={() => {
                      Clipboard.setStringAsync(`Status: ${selectedLog.stats === 0 ? 'Success' : selectedLog.stats === 1 ? 'Warning' : 'Error'}
Date: ${formatDate(selectedLog.date)}
Message: ${selectedLog.message}`);
                      Toast.show({
                        type: 'success',
                        text1: getTranslation('copiedToClipboard', locale),
                        text2: getTranslation('logDetailsCopied', locale),
                      });
                      setSelectedLog(null);
                    }}>
                      <Text style={styles.modalButtonText}>{getTranslation('copy', locale)}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.modalButton, { backgroundColor: themeColor }]} onPress={() => setSelectedLog(null)}>
                      <Text style={styles.modalButtonText}>{getTranslation('close', locale)}</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </Modal>
      )}
      <Toast />
    </View>
  );
};

const isCloseToBottom = ({ layoutMeasurement, contentOffset, contentSize }) => {
  const paddingToBottom = 20;
  return layoutMeasurement.height + contentOffset.y >= contentSize.height - paddingToBottom;
};

const getLogBoxStyle = (stats, themeColor) => {
  switch (stats) {
    case 0:
      return { backgroundColor: '#64C896' }; // Success
    case 1:
      return { backgroundColor: '#FFC100' }; // Warning
    case 2:
      return { backgroundColor: '#C40C0C' }; // Error
    default:
      return { backgroundColor: themeColor || '#64C896' }; // Default to Success color
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 20,
  },
  header: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
    alignItems: 'center',
  },
  searchInput: {
    flex: 1,
    height: 40,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 15,
    fontSize: 16,
    marginRight: 10,
  },
  filterButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
  },
  filterButtonText: {
    color: '#fff',
    fontSize: 16,
  },
  scrollView: {
    paddingHorizontal: 20,
  },
  noLogs: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 20,
  },
  logBox: {
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    backgroundColor: '#fff',
    elevation: 2,
  },
  logHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  logStatus: {
    marginLeft: 10,
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  logDate: {
    marginLeft: 10,
    color: '#fff',
    fontSize: 14,
  },
  logMessage: {
    color: '#fff',
    fontSize: 14,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '90%',
    padding: 20,
    borderRadius: 10,
    backgroundColor: '#fff',
    elevation: 10,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  modalText: {
    fontSize: 16,
    marginBottom: 10,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  datePickerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  datePickerContainer: {
    flex: 1,
    marginHorizontal: 5,
    alignItems: 'center',
  },
  dateButton: {
    padding: 10,
    borderRadius: 10,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    marginBottom: 5,
    width: '100%',
  },
  dateButtonText: {
    color: '#fff',
    fontSize: 16,
  },
  dateValue: {
    color: '#fff',
    fontSize: 14,
  },
  statusFilterContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalFilterButton: {
    flex: 1,
    padding: 10,
    borderRadius: 10,
    backgroundColor: '#eee',
    marginHorizontal: 5,
    alignItems: 'center',
  },
  activeModalFilter: {
    backgroundColor: '#007AFF',
  },
  activeModalFilterText: {
    color: '#fff',
  },
  modalFilterButtonText: {
    color: '#007AFF',
    fontSize: 16,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    flex: 1,
    padding: 10,
    borderRadius: 10,
    marginHorizontal: 5,
    alignItems: 'center',
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
  },
});

export default ServiceLogs;
