import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, TextInput, ScrollView, Modal, Alert, SafeAreaView, StatusBar } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

// สีและการตั้งค่า
const COLORS = {
  primary: '#2563EB',
  success: '#16A34A',
  danger: '#DC2626',
  background: '#F3F4F6',
  white: '#FFFFFF',
  text: '#1F2937',
  gray: '#9CA3AF'
};

const CATEGORIES = {
  expense: [
    { id: 'food', name: 'อาหาร', icon: 'fast-food' },
    { id: 'transport', name: 'เดินทาง', icon: 'bus' },
    { id: 'shopping', name: 'ช้อปปิ้ง', icon: 'cart' },
    { id: 'bills', name: 'บิล', icon: 'receipt' },
  ],
  income: [
    { id: 'salary', name: 'เงินเดือน', icon: 'cash' },
    { id: 'bonus', name: 'โบนัส', icon: 'gift' },
  ]
};

export default function App() {
  const [transactions, setTransactions] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [type, setType] = useState('expense');
  const [selectedCat, setSelectedCat] = useState(CATEGORIES.expense[0]);

  // โหลดข้อมูลตอนเปิดแอป
  useEffect(() => {
    loadData();
  }, []);

  // บันทึกข้อมูลเมื่อมีการเปลี่ยนแปลง
  useEffect(() => {
    saveData();
  }, [transactions]);

  const loadData = async () => {
    try {
      const jsonValue = await AsyncStorage.getItem('@money_tracker');
      if (jsonValue != null) setTransactions(JSON.parse(jsonValue));
    } catch (e) {
      console.log('Error loading data');
    }
  };

  const saveData = async () => {
    try {
      await AsyncStorage.setItem('@money_tracker', JSON.stringify(transactions));
    } catch (e) {
      console.log('Error saving data');
    }
  };

  const handleAdd = () => {
    if (!amount) return;
    const newTrans = {
      id: Date.now(),
      amount: parseFloat(amount),
      type,
      category: selectedCat,
      note,
      date: new Date().toISOString()
    };
    setTransactions([newTrans, ...transactions]);
    setAmount('');
    setNote('');
    setModalVisible(false);
  };

  const handleDelete = (id) => {
    Alert.alert('ลบรายการ', 'ต้องการลบรายการนี้ใช่ไหม?', [
      { text: 'ยกเลิก', style: 'cancel' },
      { text: 'ลบ', style: 'destructive', onPress: () => setTransactions(transactions.filter(t => t.id !== id)) }
    ]);
  };

  const getBalance = () => transactions.reduce((acc, t) => t.type === 'income' ? acc + t.amount : acc - t.amount, 0);
  const getIncome = () => transactions.filter(t => t.type === 'income').reduce((acc, t) => t.amount + acc, 0);
  const getExpense = () => transactions.filter(t => t.type === 'expense').reduce((acc, t) => t.amount + acc, 0);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.label}>ยอดคงเหลือ</Text>
        <Text style={styles.balance}>{getBalance().toLocaleString()} ฿</Text>
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Ionicons name="arrow-up-circle" size={20} color={COLORS.success} />
            <Text style={[styles.statText, { color: COLORS.success }]}>{getIncome().toLocaleString()}</Text>
          </View>
          <View style={styles.statBox}>
            <Ionicons name="arrow-down-circle" size={20} color={COLORS.danger} />
            <Text style={[styles.statText, { color: COLORS.danger }]}>{getExpense().toLocaleString()}</Text>
          </View>
        </View>
      </View>

      {/* List */}
      <ScrollView style={styles.list}>
        {transactions.map(t => (
          <TouchableOpacity key={t.id} onLongPress={() => handleDelete(t.id)} style={styles.card}>
            <View style={styles.cardIcon}>
              <Ionicons name={t.category.icon} size={24} color={COLORS.white} />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.cardTitle}>{t.category.name}</Text>
              <Text style={styles.cardDate}>{new Date(t.date).toLocaleDateString('th-TH')}</Text>
            </View>
            <Text style={[styles.cardAmount, { color: t.type === 'income' ? COLORS.success : COLORS.danger }]}>
              {t.type === 'income' ? '+' : '-'}{t.amount.toLocaleString()}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity style={styles.fab} onPress={() => setModalVisible(true)}>
        <Ionicons name="add" size={32} color="white" />
      </TouchableOpacity>

      {/* Modal */}
      <Modal visible={modalVisible} animationType="slide">
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>เพิ่มรายการ</Text>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Ionicons name="close" size={24} color={COLORS.text} />
            </TouchableOpacity>
          </View>

          <View style={styles.typeSelector}>
            <TouchableOpacity 
              style={[styles.typeBtn, type === 'expense' && styles.activeTypeExp]} 
              onPress={() => {setType('expense'); setSelectedCat(CATEGORIES.expense[0])}}>
              <Text style={[styles.typeText, type === 'expense' && styles.activeTypeText]}>รายจ่าย</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.typeBtn, type === 'income' && styles.activeTypeInc]} 
              onPress={() => {setType('income'); setSelectedCat(CATEGORIES.income[0])}}>
              <Text style={[styles.typeText, type === 'income' && styles.activeTypeText]}>รายรับ</Text>
            </TouchableOpacity>
          </View>

          <TextInput 
            style={styles.inputAmount} 
            placeholder="0.00" 
            keyboardType="numeric"
            value={amount}
            onChangeText={setAmount}
          />

          <View style={styles.catGrid}>
            {CATEGORIES[type].map(cat => (
              <TouchableOpacity 
                key={cat.id} 
                style={[styles.catItem, selectedCat.id === cat.id && styles.selectedCat]}
                onPress={() => setSelectedCat(cat)}>
                <Ionicons name={cat.icon} size={24} color={selectedCat.id === cat.id ? COLORS.primary : COLORS.gray} />
                <Text style={styles.catText}>{cat.name}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity style={styles.saveBtn} onPress={handleAdd}>
            <Text style={styles.saveBtnText}>บันทึก</Text>
          </TouchableOpacity>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { padding: 20, backgroundColor: COLORS.white, borderBottomLeftRadius: 24, borderBottomRightRadius: 24, elevation: 4 },
  label: { fontSize: 14, color: COLORS.gray },
  balance: { fontSize: 36, fontWeight: 'bold', color: COLORS.text, marginVertical: 8 },
  statsRow: { flexDirection: 'row', gap: 16 },
  statBox: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: COLORS.background, padding: 8, borderRadius: 12 },
  statText: { fontWeight: 'bold' },
  list: { padding: 16 },
  card: { backgroundColor: COLORS.white, padding: 16, borderRadius: 16, marginBottom: 12, flexDirection: 'row', alignItems: 'center', elevation: 2 },
  cardIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center' },
  cardTitle: { fontWeight: 'bold', fontSize: 16 },
  cardDate: { fontSize: 12, color: COLORS.gray },
  cardAmount: { fontWeight: 'bold', fontSize: 16 },
  fab: { position: 'absolute', bottom: 24, right: 24, width: 60, height: 60, borderRadius: 30, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center', elevation: 8 },
  modalContainer: { flex: 1, backgroundColor: COLORS.white, padding: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  modalTitle: { fontSize: 24, fontWeight: 'bold' },
  typeSelector: { flexDirection: 'row', backgroundColor: COLORS.background, borderRadius: 12, padding: 4, marginBottom: 24 },
  typeBtn: { flex: 1, padding: 12, alignItems: 'center', borderRadius: 10 },
  activeTypeExp: { backgroundColor: COLORS.danger },
  activeTypeInc: { backgroundColor: COLORS.success },
  typeText: { fontWeight: 'bold', color: COLORS.gray },
  activeTypeText: { color: COLORS.white },
  inputAmount: { fontSize: 48, fontWeight: 'bold', textAlign: 'center', marginBottom: 24, color: COLORS.text },
  catGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'center' },
  catItem: { width: '22%', aspectRatio: 1, alignItems: 'center', justifyContent: 'center', borderRadius: 12, borderWidth: 1, borderColor: COLORS.background },
  selectedCat: { borderColor: COLORS.primary, backgroundColor: '#EFF6FF' },
  catText: { fontSize: 12, marginTop: 4, color: COLORS.gray },
  saveBtn: { backgroundColor: COLORS.primary, padding: 16, borderRadius: 16, marginTop: 'auto', alignItems: 'center' },
  saveBtnText: { color: COLORS.white, fontWeight: 'bold', fontSize: 18 }
});

