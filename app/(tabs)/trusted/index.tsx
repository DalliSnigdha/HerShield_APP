import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { Users, Plus, Trash2 } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SMS from 'expo-sms';

export interface Contact {
  id: string;
  name: string;
  phone: string;
}

export const getTrustedContacts = async (): Promise<Contact[]> => {
  try {
    const contacts = await AsyncStorage.getItem('trustedContacts');
    return contacts ? JSON.parse(contacts) : [];
  } catch (error) {
    console.error('Error fetching trusted contacts:', error);
    return [];
  }
};

export default function TrustedContacts() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadContacts();
  }, []);

  const loadContacts = async () => {
    const savedContacts = await getTrustedContacts();
    setContacts(savedContacts);
  };

  const validatePhone = (number: string) => {
    const phoneRegex = /^\+?[1-9]\d{9,14}$/;
    return phoneRegex.test(number);
  };

  const handleAddContact = async () => {
    setError(null);

    if (!name.trim() || !phone.trim()) {
      setError('Please fill in all fields');
      return;
    }

    if (!validatePhone(phone)) {
      setError('Please enter a valid phone number');
      return;
    }

    const newContact: Contact = {
      id: Date.now().toString(),
      name: name.trim(),
      phone: phone.trim(),
    };

    try {
      const updatedContacts = [...contacts, newContact];
      setContacts(updatedContacts);
      await AsyncStorage.setItem('trustedContacts', JSON.stringify(updatedContacts));
      
      setName('');
      setPhone('');
      
      Alert.alert('Success', 'Contact added successfully');
    } catch (error) {
      setError('Failed to save contact');
    }
  };

  const handleDeleteContact = async (id: string) => {
    try {
      const updatedContacts = contacts.filter(contact => contact.id !== id);
      setContacts(updatedContacts);
      await AsyncStorage.setItem('trustedContacts', JSON.stringify(updatedContacts));
    } catch (error) {
      setError('Failed to delete contact');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Users size={32} color="#FF6B6B" />
        <Text style={styles.title}>Trusted Contacts</Text>
      </View>

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Contact Name"
          value={name}
          onChangeText={setName}
        />
        <TextInput
          style={styles.input}
          placeholder="Phone Number"
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
        />
        {error && <Text style={styles.errorText}>{error}</Text>}
        <TouchableOpacity style={styles.addButton} onPress={handleAddContact}>
          <Plus size={24} color="#fff" />
          <Text style={styles.buttonText}>Add Contact</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.contactsList}>
        {contacts.map((contact) => (
          <View key={contact.id} style={styles.contactCard}>
            <View>
              <Text style={styles.contactName}>{contact.name}</Text>
              <Text style={styles.contactPhone}>{contact.phone}</Text>
            </View>
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => handleDeleteContact(contact.id)}>
              <Trash2 size={20} color="#FF6B6B" />
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    paddingTop: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginLeft: 12,
    color: '#333',
  },
  inputContainer: {
    backgroundColor: '#f5f5f5',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  input: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    fontSize: 16,
  },
  addButton: {
    backgroundColor: '#FF6B6B',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  errorText: {
    color: '#FF6B6B',
    marginBottom: 12,
  },
  contactsList: {
    flex: 1,
  },
  contactCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#eee',
  },
  contactName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  contactPhone: {
    fontSize: 14,
    color: '#666',
  },
  deleteButton: {
    padding: 8,
  },
});