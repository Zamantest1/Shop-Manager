import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, TextInput, Modal, ScrollView,
  StyleSheet, StatusBar, Platform, Dimensions, Alert, FlatList, Switch
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Clipboard from 'expo-clipboard';
import Svg, { Circle, G, Text as SvgText } from 'react-native-svg';
import { SafeAreaProvider, SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

const CURRENCY = '৳';

const COLORS = {
  primary: '#2563EB',
  primaryLight: '#3B82F6',
  secondary: '#10B981',
  danger: '#EF4444',
  warning: '#F59E0B',
  background: '#F8FAFC',
  card: '#FFFFFF',
  text: '#0F172A',
  textSecondary: '#475569',
  textLight: '#94A3B8',
  border: '#E2E8F0',
  success: '#22C55E',
  purple: '#8B5CF6',
  guest: '#06B6D4',
};

const STORAGE_KEY = '@inventory_data_v5';
const SETUP_KEY = '@inventory_setup_done_v4';

function InventoryApp() {
  const insets = useSafeAreaInsets();

  const [products, setProducts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [sellers, setSellers] = useState([]);
  const [businessExpenses, setBusinessExpenses] = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);
  const [businessName, setBusinessName] = useState('');
  const [sellPricePerUnit, setSellPricePerUnit] = useState(0);
  const [initialCashInHand, setInitialCashInHand] = useState(0);

  const [activeTab, setActiveTab] = useState('home');
  const [selectedSeller, setSelectedSeller] = useState(null);

  // Modals
  const [showSellModal, setShowSellModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [showStockModal, setShowStockModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [showSellerPickerModal, setShowSellerPickerModal] = useState(false);
  const [showWithdrawalHistoryModal, setShowWithdrawalHistoryModal] = useState(false);
  const [showMonthPickerModal, setShowMonthPickerModal] = useState(false);

  // Setup
  const [showSetupModal, setShowSetupModal] = useState(false);
  const [setupName, setSetupName] = useState('');
  const [setupSellerName, setSetupSellerName] = useState('');
  const [setupSellerType, setSetupSellerType] = useState('seller');
  const [setupSellers, setSetupSellers] = useState([]);
  const [setupInitialStock, setSetupInitialStock] = useState('');
  const [setupCostPrice, setSetupCostPrice] = useState('');
  const [setupSellPrice, setSetupSellPrice] = useState('');
  const [setupCashInHand, setSetupCashInHand] = useState('');

  // Form states
  const [sellQty, setSellQty] = useState('1');
  const [sellDiscount, setSellDiscount] = useState('');
  const [sellNotes, setSellNotes] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawPerson, setWithdrawPerson] = useState('');
  const [stockQty, setStockQty] = useState('');
  const [stockCostPrice, setStockCostPrice] = useState('');
  const [stockSellPrice, setStockSellPrice] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseDesc, setExpenseDesc] = useState('');
  const [newSellerName, setNewSellerName] = useState('');
  const [newSellerType, setNewSellerType] = useState('seller');
  const [resetCode, setResetCode] = useState('');
  const [csvContent, setCsvContent] = useState('');
  const [settingsSellPrice, setSettingsSellPrice] = useState('');

  // Report state
  const [reportViewMode, setReportViewMode] = useState('today');
  const [selectedReportMonth, setSelectedReportMonth] = useState(new Date().getMonth());
  const [selectedReportYear, setSelectedReportYear] = useState(new Date().getFullYear());
  const [showNetProfit, setShowNetProfit] = useState(false); // Toggle for Net vs Overall profit

  const bottomNavPad = (Platform.OS === 'ios' ? 12 : 10) + insets.bottom;
  const modalBottomPad = 20 + insets.bottom;

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (sellers.length > 0) {
      const nonGuestSellers = sellers.filter(s => !s.isGuest);
      if (nonGuestSellers.length > 0) {
        if (!withdrawPerson || !nonGuestSellers.find(s => s.name === withdrawPerson)) {
          setWithdrawPerson(nonGuestSellers[0].name);
        }
      }
      if (!selectedSeller || !sellers.find(s => s.name === selectedSeller.name)) {
        setSelectedSeller(sellers[0]);
      }
    }
  }, [sellers]);

  useEffect(() => {
    if (!showSetupModal) {
      saveData();
    }
  }, [products, transactions, sellers, businessExpenses, withdrawals, businessName, sellPricePerUnit, initialCashInHand]);

  const loadData = async () => {
    try {
      const [data, setupDone] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEY),
        AsyncStorage.getItem(SETUP_KEY),
      ]);

      if (setupDone !== '1') {
        setShowSetupModal(true);
        return;
      }

      if (data) {
        const parsed = JSON.parse(data);
        setProducts(parsed.products || []);
        setTransactions(parsed.transactions || []);
        setSellers(parsed.sellers || []);
        setBusinessExpenses(parsed.businessExpenses || []);
        setWithdrawals(parsed.withdrawals || []);
        setBusinessName(parsed.businessName || 'My Shop');
        setSellPricePerUnit(parsed.sellPricePerUnit || 0);
        setInitialCashInHand(parsed.initialCashInHand || 0);

        const firstSeller = parsed.sellers?.[0] || null;
        setSelectedSeller(firstSeller);
        const nonGuests = (parsed.sellers || []).filter(s => !s.isGuest);
        if (nonGuests.length > 0) {
          setWithdrawPerson(nonGuests[0].name);
        }
      }
    } catch (e) {
      console.error('Load error:', e);
      setShowSetupModal(true);
    }
  };

  const saveData = async () => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({
        products, transactions, sellers, businessExpenses, withdrawals, businessName, sellPricePerUnit, initialCashInHand,
      }));
    } catch (e) {
      console.error('Save error:', e);
    }
  };

  const resetAllData = async () => {
    if (resetCode === '999') {
      try {
        await Promise.all([
          AsyncStorage.removeItem(STORAGE_KEY),
          AsyncStorage.removeItem(SETUP_KEY),
        ]);
        setProducts([]);
        setTransactions([]);
        setSellers([]);
        setBusinessExpenses([]);
        setWithdrawals([]);
        setBusinessName('');
        setSellPricePerUnit(0);
        setInitialCashInHand(0);
        setSetupSellers([]);
        setShowResetModal(false);
        setResetCode('');
        setShowSettingsModal(false);
        setShowSetupModal(true);
        Alert.alert('Success', 'All data has been reset');
      } catch (e) {
        console.error('Reset error:', e);
      }
    } else {
      Alert.alert('Error', 'Invalid code');
    }
  };

  const formatTime = (dateStr) => {
    const d = new Date(dateStr);
    const hours = d.getHours().toString().padStart(2, '0');
    const mins = d.getMinutes().toString().padStart(2, '0');
    return `${hours}:${mins}`;
  };

  const formatDateTime = (dateStr) => {
    const d = new Date(dateStr);
    const date = d.toLocaleDateString();
    const time = formatTime(dateStr);
    return `${date} ${time}`;
  };

  const getMonthName = (month) => {
    const months = ['January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'];
    return months[month];
  };

  const getNonGuestSellers = () => sellers.filter(s => !s.isGuest);

  const getRecentActivity = () => {
    const today = new Date().toDateString();
    
    const todaySales = transactions
      .filter(t => new Date(t.date).toDateString() === today)
      .map(t => ({ ...t, type: 'sale' }));
    
    const todayExpenses = businessExpenses
      .filter(e => new Date(e.date).toDateString() === today && !e.isStockPurchase)
      .map(e => ({ ...e, type: 'expense' }));
    
    const todayWithdrawals = withdrawals
      .filter(w => new Date(w.date).toDateString() === today)
      .map(w => ({ ...w, type: 'withdrawal' }));

    const all = [...todaySales, ...todayExpenses, ...todayWithdrawals];
    all.sort((a, b) => new Date(b.date) - new Date(a.date));
    return all;
  };

  const getTodayData = () => {
    const today = new Date().toDateString();
    const todayTx = transactions.filter(t => new Date(t.date).toDateString() === today);
    const todayExpenses = businessExpenses.filter(e => new Date(e.date).toDateString() === today && !e.isStockPurchase);
    const todayWithdrawals = withdrawals.filter(w => new Date(w.date).toDateString() === today);

    const totalSales = todayTx.reduce((sum, t) => sum + (t.total || 0), 0);
    const totalExpenses = todayExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);
    const totalWithdrawals = todayWithdrawals.reduce((sum, w) => sum + (w.amount || 0), 0);
    const unitsSold = todayTx.reduce((sum, t) => sum + (t.quantity || 0), 0);

    return { totalSales, totalExpenses, totalWithdrawals, unitsSold, transactions: todayTx };
  };

  // Calculate current cash in hand
  const getCurrentCashInHand = () => {
    const totalSales = transactions.reduce((sum, t) => sum + (t.total || 0), 0);
    const totalExpenses = businessExpenses.filter(e => !e.isStockPurchase).reduce((sum, e) => sum + (e.amount || 0), 0);
    const totalWithdrawals = withdrawals.reduce((sum, w) => sum + (w.amount || 0), 0);
    const totalStockPurchases = products.reduce((sum, p) => sum + ((p.costPrice || 0) * (p.quantity || 0)), 0);
    
    return initialCashInHand + totalSales - totalExpenses - totalWithdrawals - totalStockPurchases;
  };

  // Total Assets = Cash in Hand + Stock Value (merged display)
  const getTotalAssets = () => {
    return getCurrentCashInHand() + totalInventoryValue();
  };

  // Get report data based on mode
  const getReportData = (mode) => {
    const now = new Date();
    let startDate, endDate;
    
    if (mode === 'today') {
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
    } else if (mode === 'monthly') {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    } else {
      // Custom month
      startDate = new Date(selectedReportYear, selectedReportMonth, 1);
      endDate = new Date(selectedReportYear, selectedReportMonth + 1, 0, 23, 59, 59);
    }

    const filteredTx = transactions.filter(t => {
      const d = new Date(t.date);
      return d >= startDate && d <= endDate;
    });
    const filteredExpenses = businessExpenses.filter(e => {
      const d = new Date(e.date);
      return d >= startDate && d <= endDate && !e.isStockPurchase;
    });
    const filteredWithdrawals = withdrawals.filter(w => {
      const d = new Date(w.date);
      return d >= startDate && d <= endDate;
    });
    const filteredProducts = products.filter(p => {
      const d = new Date(p.date);
      return d >= startDate && d <= endDate;
    });

    const totalSales = filteredTx.reduce((sum, t) => sum + (t.total || 0), 0);
    const totalExpenses = filteredExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);
    const totalWithdrawals = filteredWithdrawals.reduce((sum, w) => sum + (w.amount || 0), 0);

    // Cost of goods sold (COGS) - cost price of units sold
    const unitsSold = filteredTx.reduce((sum, t) => sum + (t.quantity || 0), 0);
    const costOfGoodsSold = filteredTx.reduce((sum, t) => sum + ((t.costPrice || t.costPerUnit || 0) * (t.quantity || 0)), 0);
    
    // Stock purchases in this period
    const stockPurchaseCost = filteredProducts.reduce((sum, p) => sum + ((p.costPrice || 0) * (p.quantity || 0)), 0);

    // Gross Profit = Sales Revenue - Cost of Goods Sold
    const grossProfit = totalSales - costOfGoodsSold;

    // Profit margin per unit sold
    const profitPerUnit = unitsSold > 0 ? grossProfit / unitsSold : 0;

    const nonGuestSellers = getNonGuestSellers();
    const numPartners = nonGuestSellers.length || 1;

    // Net Profit (after expenses, before withdrawals)
    const netProfitBeforeWithdrawals = grossProfit - totalExpenses;
    const perPartnerShare = netProfitBeforeWithdrawals / numPartners;

    // Withdrawals by person
    const withdrawalsByPerson = {};
    nonGuestSellers.forEach(s => { withdrawalsByPerson[s.name] = 0; });
    filteredWithdrawals.forEach(w => {
      if (w.person && withdrawalsByPerson[w.person] !== undefined) {
        withdrawalsByPerson[w.person] += w.amount || 0;
      }
    });

    // Net profit per partner after their withdrawals
    const netProfitByPartner = {};
    nonGuestSellers.forEach(s => {
      const theirWithdrawals = withdrawalsByPerson[s.name] || 0;
      netProfitByPartner[s.name] = perPartnerShare - theirWithdrawals;
    });

    // Sales by seller
    const salesBySeller = {};
    sellers.forEach(s => { salesBySeller[s.name] = 0; });
    filteredTx.forEach(t => {
      if (t.seller && salesBySeller[t.seller] !== undefined) {
        salesBySeller[t.seller] += t.total || 0;
      }
    });

    return {
      totalSales, totalExpenses, totalWithdrawals,
      costOfGoodsSold, grossProfit, profitPerUnit, unitsSold,
      stockPurchaseCost, netProfitBeforeWithdrawals, perPartnerShare,
      salesBySeller, withdrawalsByPerson, netProfitByPartner,
      transactions: filteredTx
    };
  };

  const currentStock = () => {
    const added = products.reduce((sum, p) => sum + (p.quantity || 0), 0);
    const sold = transactions.reduce((sum, t) => sum + (t.quantity || 0), 0);
    return added - sold;
  };

  const avgCostPrice = () => {
    if (products.length === 0) return 0;
    const totalCost = products.reduce((sum, p) => sum + ((p.costPrice || 0) * (p.quantity || 0)), 0);
    const totalQty = products.reduce((sum, p) => sum + (p.quantity || 0), 0);
    return totalQty > 0 ? totalCost / totalQty : 0;
  };

  const avgSellPrice = () => {
    if (products.length === 0) return sellPricePerUnit;
    const productsWithSellPrice = products.filter(p => p.sellPrice > 0);
    if (productsWithSellPrice.length === 0) return sellPricePerUnit;
    const totalSell = productsWithSellPrice.reduce((sum, p) => sum + ((p.sellPrice || 0) * (p.quantity || 0)), 0);
    const totalQty = productsWithSellPrice.reduce((sum, p) => sum + (p.quantity || 0), 0);
    return totalQty > 0 ? totalSell / totalQty : sellPricePerUnit;
  };

  const totalInventoryValue = () => {
    const stock = currentStock();
    const cost = avgCostPrice();
    return stock * cost;
  };

  const getCurrentSellPrice = () => {
    const avg = avgSellPrice();
    if (avg > 0) return avg;
    if (sellPricePerUnit > 0) return sellPricePerUnit;
    const cost = avgCostPrice();
    return cost > 0 ? Math.round(cost * 1.3) : 0;
  };

  const quickSell = (qty) => {
    const stock = currentStock();
    if (stock < qty) {
      Alert.alert('Error', 'Not enough stock');
      return;
    }
    if (!selectedSeller) {
      Alert.alert('Error', 'Select a seller');
      return;
    }

    const price = getCurrentSellPrice();
    const costPrice = avgCostPrice();

    const tx = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      quantity: qty,
      pricePerUnit: price,
      costPrice: costPrice,
      discount: 0,
      total: price * qty,
      seller: selectedSeller.name,
      sellerIsGuest: selectedSeller.isGuest,
      notes: 'Quick sale'
    };
    setTransactions([...transactions, tx]);
  };

  const getAutoPrice = () => {
    const qty = parseInt(sellQty) || 1;
    const unitPrice = getCurrentSellPrice();
    return unitPrice * qty;
  };

  const handleSell = () => {
    const qty = parseInt(sellQty) || 0;
    const discount = parseFloat(sellDiscount) || 0;

    if (qty <= 0) {
      Alert.alert('Error', 'Invalid quantity');
      return;
    }
    if (currentStock() < qty) {
      Alert.alert('Error', 'Not enough stock');
      return;
    }
    if (!selectedSeller) {
      Alert.alert('Error', 'Select a seller');
      return;
    }

    const unitPrice = getCurrentSellPrice();
    const costPrice = avgCostPrice();
    const subtotal = unitPrice * qty;
    const total = subtotal - discount;

    const tx = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      quantity: qty,
      pricePerUnit: unitPrice,
      costPrice: costPrice,
      discount,
      total,
      seller: selectedSeller.name,
      sellerIsGuest: selectedSeller.isGuest,
      notes: sellNotes
    };

    setTransactions([...transactions, tx]);
    setShowSellModal(false);
    setSellQty('1');
    setSellDiscount('');
    setSellNotes('');
  };

  const deleteTransaction = (id) => {
    Alert.alert('Delete Transaction', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => setTransactions(transactions.filter(t => t.id !== id)) }
    ]);
  };

  const deleteExpense = (id) => {
    Alert.alert('Delete Expense', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => setBusinessExpenses(businessExpenses.filter(e => e.id !== id)) }
    ]);
  };

  const deleteWithdrawal = (id) => {
    Alert.alert('Delete Withdrawal', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => setWithdrawals(withdrawals.filter(w => w.id !== id)) }
    ]);
  };

  const handleAddStock = () => {
    const qty = parseInt(stockQty) || 0;
    const costPrice = parseFloat(stockCostPrice) || 0;
    const sellPrice = parseFloat(stockSellPrice) || 0;

    if (qty <= 0) {
      Alert.alert('Error', 'Invalid quantity');
      return;
    }
    if (costPrice <= 0) {
      Alert.alert('Error', 'Enter cost price (buying price)');
      return;
    }

    const product = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      quantity: qty,
      costPrice: costPrice,
      sellPrice: sellPrice > 0 ? sellPrice : null,
      profitPerUnit: sellPrice > 0 ? sellPrice - costPrice : null
    };

    setProducts([...products, product]);
    
    // Update default sell price if provided
    if (sellPrice > 0) {
      setSellPricePerUnit(sellPrice);
    }

    setShowStockModal(false);
    setStockQty('');
    setStockCostPrice('');
    setStockSellPrice('');
  };

  const handleWithdraw = () => {
    const amount = parseFloat(withdrawAmount) || 0;
    if (amount <= 0 || !withdrawPerson) {
      Alert.alert('Error', 'Invalid amount or person');
      return;
    }

    const seller = sellers.find(s => s.name === withdrawPerson);
    if (seller && seller.isGuest) {
      Alert.alert('Error', 'Guests cannot withdraw money');
      return;
    }

    const withdrawal = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      amount,
      person: withdrawPerson
    };

    setWithdrawals([...withdrawals, withdrawal]);
    setShowWithdrawModal(false);
    setWithdrawAmount('');
  };

  const handleAddExpense = () => {
    const amount = parseFloat(expenseAmount) || 0;
    if (amount <= 0) {
      Alert.alert('Error', 'Invalid amount');
      return;
    }

    const expense = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      amount,
      description: expenseDesc.trim() || 'Business expense',
      isStockPurchase: false
    };

    setBusinessExpenses([...businessExpenses, expense]);
    setExpenseAmount('');
    setExpenseDesc('');
  };

  const handleAddSeller = () => {
    const name = newSellerName.trim();
    if (!name) {
      Alert.alert('Error', 'Enter seller name');
      return;
    }
    if (sellers.find(s => s.name === name)) {
      Alert.alert('Error', 'Seller already exists');
      return;
    }
    setSellers([...sellers, { name, isGuest: newSellerType === 'guest' }]);
    setNewSellerName('');
    setNewSellerType('seller');
  };

  const handleDeleteSeller = (name) => {
    if (sellers.length <= 1) {
      Alert.alert('Error', 'Must have at least one seller');
      return;
    }
    Alert.alert('Delete Seller', `Delete "${name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: () => {
          const next = sellers.filter(s => s.name !== name);
          setSellers(next);
          if (selectedSeller?.name === name) setSelectedSeller(next[0]);
          if (withdrawPerson === name) {
            const nonGuests = next.filter(s => !s.isGuest);
            setWithdrawPerson(nonGuests[0]?.name || '');
          }
        }
      }
    ]);
  };

  const handleUpdateSellPrice = () => {
    const price = parseFloat(settingsSellPrice) || 0;
    if (price <= 0) {
      Alert.alert('Error', 'Enter a valid price');
      return;
    }
    setSellPricePerUnit(price);
    Alert.alert('Success', 'Sell price updated');
    setSettingsSellPrice('');
  };

  const generateCSV = () => {
    let csv = 'Date,Time,Type,Quantity,Price,Cost,Discount,Total,Person,Notes\n';

    transactions.forEach(t => {
      const date = new Date(t.date).toLocaleDateString();
      const time = formatTime(t.date);
      csv += `${date},${time},Sale,${t.quantity || 0},${t.pricePerUnit || 0},${t.costPrice || 0},${t.discount || 0},${t.total || 0},${t.seller || ''},${t.notes || ''}\n`;
    });

    businessExpenses.filter(e => !e.isStockPurchase).forEach(e => {
      const date = new Date(e.date).toLocaleDateString();
      const time = formatTime(e.date);
      csv += `${date},${time},Expense,,,,,${e.amount || 0},,${e.description || ''}\n`;
    });

    withdrawals.forEach(w => {
      const date = new Date(w.date).toLocaleDateString();
      const time = formatTime(w.date);
      csv += `${date},${time},Withdrawal,,,,,${w.amount || 0},${w.person || ''},\n`;
    });

    setCsvContent(csv);
    setShowExportModal(true);
  };

  const copyCSV = async () => {
    try {
      await Clipboard.setStringAsync(csvContent);
      Alert.alert('Copied!', 'CSV copied to clipboard');
    } catch (e) {
      Alert.alert('Error', 'Failed to copy');
    }
  };

  const DonutChart = ({ data, size = 140, showCurrency = false }) => {
    const strokeWidth = 24;
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const center = size / 2;
    const total = data.reduce((sum, d) => sum + (d.value || 0), 0);
    
    const nonZeroData = data.filter(d => d.value > 0);
    let accumulated = 0;

    if (total === 0) {
      return (
        <View style={{ alignItems: 'center', marginVertical: 16 }}>
          <Text style={{ fontSize: 14, color: COLORS.textSecondary, fontWeight: '600' }}>No data</Text>
        </View>
      );
    }

    return (
      <View style={{ alignItems: 'center' }}>
        <Svg width={size} height={size}>
          <G rotation="-90" origin={`${center}, ${center}`}>
            {nonZeroData.map((item, index) => {
              const percentage = item.value / total;
              const strokeDasharray = `${percentage * circumference} ${circumference}`;
              const rotation = (accumulated / total) * 360;
              accumulated += item.value;
              return (
                <Circle key={index} cx={center} cy={center} r={radius} stroke={item.color}
                  strokeWidth={strokeWidth} fill="transparent" strokeDasharray={strokeDasharray}
                  rotation={rotation} origin={`${center}, ${center}`} />
              );
            })}
          </G>
          <SvgText x={center} y={center} textAnchor="middle" alignmentBaseline="middle"
            fontSize="16" fontWeight="bold" fill={COLORS.text}>
            {total.toFixed(0)}
          </SvgText>
        </Svg>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', marginTop: 10 }}>
          {data.map((item, index) => (
            <View key={index} style={{ flexDirection: 'row', alignItems: 'center', marginRight: 14, marginTop: 6 }}>
              <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: item.color, marginRight: 6 }} />
              <Text style={{ fontSize: 12, color: COLORS.textSecondary, fontWeight: '600' }}>
                {item.label}: {CURRENCY}{(item.value || 0).toFixed(0)}
              </Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  const todayData = getTodayData();
  const recentActivity = getRecentActivity();

  // Setup handlers
  const addSetupSeller = () => {
    const name = setupSellerName.trim();
    if (!name) return;
    if (setupSellers.find(s => s.name === name)) {
      Alert.alert('Error', 'Seller already exists');
      return;
    }
    setSetupSellers([...setupSellers, { name, isGuest: setupSellerType === 'guest' }]);
    setSetupSellerName('');
    setSetupSellerType('seller');
  };

  const removeSetupSeller = (name) => {
    setSetupSellers(setupSellers.filter(s => s.name !== name));
  };

  const finishSetup = async () => {
    const nonGuests = setupSellers.filter(s => !s.isGuest);
    if (nonGuests.length === 0) {
      Alert.alert('Error', 'Add at least 1 seller/partner (not guest)');
      return;
    }

    const name = setupName.trim() || 'My Shop';
    setBusinessName(name);
    setSellers(setupSellers);
    setSelectedSeller(setupSellers[0]);
    setWithdrawPerson(nonGuests[0].name);

    const initCash = parseFloat(setupCashInHand) || 0;
    setInitialCashInHand(initCash);

    const initSellPrice = parseFloat(setupSellPrice) || 0;
    setSellPricePerUnit(initSellPrice);

    const initStock = parseInt(setupInitialStock) || 0;
    const initCostPrice = parseFloat(setupCostPrice) || 0;
    const initSellPriceStock = parseFloat(setupSellPrice) || 0;

    let initialProducts = [];
    if (initStock > 0 && initCostPrice > 0) {
      const product = {
        id: Date.now().toString(),
        date: new Date().toISOString(),
        quantity: initStock,
        costPrice: initCostPrice,
        sellPrice: initSellPriceStock > 0 ? initSellPriceStock : null,
        profitPerUnit: initSellPriceStock > 0 ? initSellPriceStock - initCostPrice : null
      };
      initialProducts = [product];
      setProducts([product]);
    }

    await AsyncStorage.setItem(SETUP_KEY, '1');
    
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({
      products: initialProducts,
      transactions: [],
      sellers: setupSellers,
      businessExpenses: [],
      withdrawals: [],
      businessName: name,
      sellPricePerUnit: initSellPrice,
      initialCashInHand: initCash,
    }));

    setShowSetupModal(false);
  };

  const renderActivityItem = (item) => {
    if (item.type === 'sale') {
      const sellerInfo = sellers.find(s => s.name === item.seller);
      const isGuestSale = sellerInfo?.isGuest || item.sellerIsGuest;
      return (
        <TouchableOpacity key={item.id} style={styles.activityItem} onLongPress={() => deleteTransaction(item.id)}>
          <View style={styles.activityLeft}>
            <View style={[styles.activityBadge, { backgroundColor: isGuestSale ? COLORS.guest : COLORS.secondary }]}>
              <Text style={styles.activityBadgeText}>+</Text>
            </View>
            <View>
              <Text style={styles.activityTitle}>{item.quantity} units sold</Text>
              <Text style={styles.activitySubtitle}>{item.seller}{isGuestSale ? ' (Guest)' : ''} • {formatTime(item.date)}</Text>
            </View>
          </View>
          <Text style={[styles.activityAmount, { color: COLORS.secondary }]}>+{CURRENCY}{(item.total || 0).toFixed(0)}</Text>
        </TouchableOpacity>
      );
    } else if (item.type === 'expense') {
      return (
        <TouchableOpacity key={item.id} style={styles.activityItem} onLongPress={() => deleteExpense(item.id)}>
          <View style={styles.activityLeft}>
            <View style={[styles.activityBadge, { backgroundColor: COLORS.warning }]}>
              <Text style={styles.activityBadgeText}>−</Text>
            </View>
            <View>
              <Text style={styles.activityTitle}>{item.description}</Text>
              <Text style={styles.activitySubtitle}>Expense • {formatTime(item.date)}</Text>
            </View>
          </View>
          <Text style={[styles.activityAmount, { color: COLORS.danger }]}>−{CURRENCY}{(item.amount || 0).toFixed(0)}</Text>
        </TouchableOpacity>
      );
    } else if (item.type === 'withdrawal') {
      return (
        <TouchableOpacity key={item.id} style={styles.activityItem} onLongPress={() => deleteWithdrawal(item.id)}>
          <View style={styles.activityLeft}>
            <View style={[styles.activityBadge, { backgroundColor: COLORS.purple }]}>
              <Text style={styles.activityBadgeText}>↓</Text>
            </View>
            <View>
              <Text style={styles.activityTitle}>{item.person} withdrew</Text>
              <Text style={styles.activitySubtitle}>Withdrawal • {formatTime(item.date)}</Text>
            </View>
          </View>
          <Text style={[styles.activityAmount, { color: COLORS.purple }]}>−{CURRENCY}{(item.amount || 0).toFixed(0)}</Text>
        </TouchableOpacity>
      );
    }
    return null;
  };

  const profitPerUnit = getCurrentSellPrice() - avgCostPrice();

  const renderHome = () => (
    <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 20 }} showsVerticalScrollIndicator={false}>
      <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>Today's Summary</Text>
        <View style={styles.summaryGrid}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{CURRENCY}{todayData.totalSales.toFixed(0)}</Text>
            <Text style={styles.summaryLabel}>Sales</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{todayData.unitsSold}</Text>
            <Text style={styles.summaryLabel}>Units Sold</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{currentStock()}</Text>
            <Text style={styles.summaryLabel}>Stock</Text>
          </View>
        </View>
        <View style={[styles.summaryGrid, { marginTop: 12 }]}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValueSmall}>{CURRENCY}{getTotalAssets().toFixed(0)}</Text>
            <Text style={styles.summaryLabel}>Total Assets</Text>
          </View>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Quick Sell</Text>
        <View style={styles.priceInfoRow}>
          <Text style={styles.priceInfoText}>Sell: {CURRENCY}{getCurrentSellPrice()} | Cost: {CURRENCY}{avgCostPrice().toFixed(0)} | Profit: {CURRENCY}{profitPerUnit.toFixed(0)}/unit</Text>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
          {sellers.map(seller => (
            <TouchableOpacity key={seller.name}
              style={[styles.sellerChip, selectedSeller?.name === seller.name && styles.sellerChipActive, seller.isGuest && { borderColor: COLORS.guest }]}
              onPress={() => setSelectedSeller(seller)}>
              <Text style={[styles.sellerChipText, selectedSeller?.name === seller.name && styles.sellerChipTextActive]}>
                {seller.name}{seller.isGuest ? ' 👤' : ''}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={styles.quickSellGrid}>
          {[1, 2, 3, 5, 10].map(qty => (
            <TouchableOpacity key={qty} style={styles.quickSellBtn} onPress={() => quickSell(qty)}>
              <Text style={styles.quickSellBtnText}>{qty}</Text>
              <Text style={styles.quickSellBtnLabel}>unit{qty > 1 ? 's' : ''}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={styles.customSellBtn} onPress={() => setShowSellModal(true)}>
          <Text style={styles.customSellBtnText}>Custom Sale</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Recent Activity</Text>
          <TouchableOpacity onPress={() => setShowHistoryModal(true)}>
            <Text style={styles.viewAllText}>View All</Text>
          </TouchableOpacity>
        </View>
        {recentActivity.slice(0, 6).map(item => renderActivityItem(item))}
        {recentActivity.length === 0 && <Text style={styles.emptyText}>No activity today</Text>}
        <Text style={styles.hintText}>Long press to delete</Text>
      </View>
    </ScrollView>
  );

  const renderActions = () => (
    <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 20 }} showsVerticalScrollIndicator={false}>
      <View style={styles.actionsGrid}>
        <TouchableOpacity style={[styles.actionCard, { backgroundColor: COLORS.primary }]} onPress={() => setShowStockModal(true)}>
          <Text style={styles.actionIcon}>📦</Text>
          <Text style={styles.actionTitle}>Add Stock</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionCard, { backgroundColor: COLORS.secondary }]} onPress={() => setShowWithdrawModal(true)}>
          <Text style={styles.actionIcon}>💸</Text>
          <Text style={styles.actionTitle}>Withdraw</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionCard, { backgroundColor: COLORS.purple }]} onPress={() => setShowReportModal(true)}>
          <Text style={styles.actionIcon}>📊</Text>
          <Text style={styles.actionTitle}>Report</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionCard, { backgroundColor: COLORS.warning }]} onPress={generateCSV}>
          <Text style={styles.actionIcon}>📄</Text>
          <Text style={styles.actionTitle}>Export CSV</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionCard, { backgroundColor: '#64748B' }]} onPress={() => setShowSettingsModal(true)}>
          <Text style={styles.actionIcon}>⚙️</Text>
          <Text style={styles.actionTitle}>Settings</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionCard, { backgroundColor: COLORS.danger }]} onPress={() => setShowWithdrawalHistoryModal(true)}>
          <Text style={styles.actionIcon}>📜</Text>
          <Text style={styles.actionTitle}>Withdrawals</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Add Business Expense</Text>
        <TextInput style={styles.input} placeholder="Amount" placeholderTextColor={COLORS.textLight}
          keyboardType="numeric" value={expenseAmount} onChangeText={setExpenseAmount} />
        <TextInput style={styles.input} placeholder="Description" placeholderTextColor={COLORS.textLight}
          value={expenseDesc} onChangeText={setExpenseDesc} />
        <TouchableOpacity style={styles.primaryBtn} onPress={handleAddExpense}>
          <Text style={styles.primaryBtnText}>Add Expense</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  // Month picker modal
  const renderMonthPickerModal = () => {
    const months = [];
    const now = new Date();
    for (let i = 0; i < 12; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({ month: d.getMonth(), year: d.getFullYear(), label: `${getMonthName(d.getMonth())} ${d.getFullYear()}` });
    }

    return (
      <Modal visible={showMonthPickerModal} animationType="fade" transparent>
        <TouchableOpacity style={styles.pickerOverlay} activeOpacity={1} onPress={() => setShowMonthPickerModal(false)}>
          <View style={styles.pickerContent}>
            <Text style={styles.pickerTitle}>Select Month</Text>
            <FlatList
              data={months}
              keyExtractor={(item) => `${item.month}-${item.year}`}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.pickerItem, selectedReportMonth === item.month && selectedReportYear === item.year && styles.pickerItemActive]}
                  onPress={() => {
                    setSelectedReportMonth(item.month);
                    setSelectedReportYear(item.year);
                    setReportViewMode('custom');
                    setShowMonthPickerModal(false);
                  }}>
                  <Text style={[styles.pickerItemText, selectedReportMonth === item.month && selectedReportYear === item.year && styles.pickerItemTextActive]}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    );
  };
  const renderReportModal = () => {
    const data = getReportData(reportViewMode);
    const nonGuestSellers = getNonGuestSellers();
    
    const salesChartData = Object.entries(data.salesBySeller).map(([label, value], i) => ({
      label, value: value || 0,
      color: [COLORS.primary, COLORS.secondary, COLORS.purple, COLORS.warning, '#EC4899', COLORS.guest][i % 6]
    }));

    const withdrawalsChartData = Object.entries(data.withdrawalsByPerson).map(([label, value], i) => ({
      label, value: value || 0,
      color: [COLORS.purple, COLORS.primary, COLORS.secondary, COLORS.warning, '#EC4899', COLORS.guest][i % 6]
    }));

    const reportTitle = reportViewMode === 'today' ? 'Today' : 
      reportViewMode === 'monthly' ? `This Month (${getMonthName(new Date().getMonth())})` : 
      `${getMonthName(selectedReportMonth)} ${selectedReportYear}`;

    // Calculate per-partner earnings for Overall view
    const overallRemaining = data.totalSales - data.totalExpenses - data.totalWithdrawals;
    const perPartnerOverall = nonGuestSellers.length > 0 ? overallRemaining / nonGuestSellers.length : 0;
    
    // Calculate each partner's share after their withdrawals (for Overall view)
    const overallByPartner = {};
    nonGuestSellers.forEach(seller => {
      const theirWithdrawals = data.withdrawalsByPerson[seller.name] || 0;
      overallByPartner[seller.name] = perPartnerOverall + theirWithdrawals; // Add back their withdrawal to show fair share before personal withdrawal
    });

    return (
      <Modal visible={showReportModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { paddingBottom: modalBottomPad }]}>
            {/* Header with toggle in the middle */}
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setShowReportModal(false)}>
                <Text style={styles.closeBtn}>✕</Text>
              </TouchableOpacity>
              
              {/* Compact Net Profit Toggle */}
              <View style={styles.headerToggleContainer}>
                <Text style={styles.headerToggleLabel}>Net</Text>
                <Switch
                  value={showNetProfit}
                  onValueChange={setShowNetProfit}
                  trackColor={{ false: COLORS.border, true: COLORS.primaryLight }}
                  thumbColor={showNetProfit ? COLORS.primary : '#f4f3f4'}
                  style={{ transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] }}
                />
              </View>
              
              <Text style={styles.modalTitle}>Report</Text>
            </View>

            {/* View Mode Toggle */}
            <View style={styles.toggleContainer}>
              <TouchableOpacity style={[styles.toggleBtn, reportViewMode === 'today' && styles.toggleBtnActive]}
                onPress={() => setReportViewMode('today')}>
                <Text style={[styles.toggleBtnText, reportViewMode === 'today' && styles.toggleBtnTextActive]}>Today</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.toggleBtn, reportViewMode === 'monthly' && styles.toggleBtnActive]}
                onPress={() => setReportViewMode('monthly')}>
                <Text style={[styles.toggleBtnText, reportViewMode === 'monthly' && styles.toggleBtnTextActive]}>This Month</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.toggleBtn, reportViewMode === 'custom' && styles.toggleBtnActive]}
                onPress={() => setShowMonthPickerModal(true)}>
                <Text style={[styles.toggleBtnText, reportViewMode === 'custom' && styles.toggleBtnTextActive]}>
                  {reportViewMode === 'custom' ? getMonthName(selectedReportMonth).slice(0, 3) : 'Pick'}
                </Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.reportPeriodTitle}>{reportTitle}</Text>

            <ScrollView showsVerticalScrollIndicator={false}>
              {!showNetProfit ? (
                // Overall view - shows total sales without deducting COGS
                <>
                  <View style={[styles.reportSection, styles.highlightSection]}>
                    <Text style={styles.reportLabelBold}>Total Sales Revenue</Text>
                    <Text style={[styles.reportValueBig, { color: COLORS.secondary }]}>{CURRENCY}{data.totalSales.toFixed(0)}</Text>
                  </View>

                  <View style={styles.reportSection}>
                    <Text style={styles.reportLabel}>Units Sold</Text>
                    <Text style={[styles.reportValue, { color: COLORS.primary }]}>{data.unitsSold}</Text>
                  </View>

                  <View style={styles.reportSection}>
                    <Text style={styles.reportLabel}>Business Expenses</Text>
                    <Text style={[styles.reportValue, { color: COLORS.danger }]}>−{CURRENCY}{data.totalExpenses.toFixed(0)}</Text>
                  </View>

                  <View style={styles.reportSection}>
                    <Text style={styles.reportLabel}>Total Withdrawals</Text>
                    <Text style={[styles.reportValue, { color: COLORS.purple }]}>−{CURRENCY}{data.totalWithdrawals.toFixed(0)}</Text>
                  </View>

                  <View style={[styles.reportSection, styles.highlightSection]}>
                    <Text style={styles.reportLabelBold}>Remaining (Sales - Exp - Withdrawals)</Text>
                    <Text style={[styles.reportValueBig, { color: overallRemaining >= 0 ? COLORS.success : COLORS.danger }]}>
                      {CURRENCY}{overallRemaining.toFixed(0)}
                    </Text>
                  </View>

                  {/* Per Partner Earnings - Overall View */}
                  <Text style={[styles.cardTitle, { marginTop: 24, marginBottom: 8 }]}>Each Partner Gets</Text>
                  <Text style={styles.infoTextSmall}>(Equal share of remaining amount)</Text>
                  
                  <View style={styles.reportSection}>
                    <Text style={styles.reportLabel}>Per Partner Share ({nonGuestSellers.length})</Text>
                    <Text style={[styles.reportValue, { color: COLORS.primary }]}>{CURRENCY}{(overallRemaining / Math.max(nonGuestSellers.length, 1)).toFixed(0)}</Text>
                  </View>
                  
                  {nonGuestSellers.map((seller) => {
                    const theirWithdrawals = data.withdrawalsByPerson[seller.name] || 0;
                    const theirShare = (overallRemaining / Math.max(nonGuestSellers.length, 1));
                    return (
                      <View key={seller.name} style={styles.reportSection}>
                        <Text style={styles.reportLabel}>{seller.name}</Text>
                        <View style={{ alignItems: 'flex-end' }}>
                          <Text style={[styles.reportValue, { color: theirShare >= 0 ? COLORS.success : COLORS.danger }]}>
                            {CURRENCY}{theirShare.toFixed(0)}
                          </Text>
                          {theirWithdrawals > 0 && (
                            <Text style={styles.reportSubtext}>(withdrew: {CURRENCY}{theirWithdrawals.toFixed(0)})</Text>
                          )}
                        </View>
                      </View>
                    );
                  })}
                </>
              ) : (
                // Net Profit view - shows profit after deducting COGS and expenses
                <>
                  <View style={styles.reportSection}>
                    <Text style={styles.reportLabel}>Total Sales Revenue</Text>
                    <Text style={[styles.reportValue, { color: COLORS.secondary }]}>{CURRENCY}{data.totalSales.toFixed(0)}</Text>
                  </View>

                  <View style={styles.reportSection}>
                    <Text style={styles.reportLabel}>Cost of Goods Sold</Text>
                    <Text style={[styles.reportValue, { color: COLORS.textSecondary }]}>−{CURRENCY}{data.costOfGoodsSold.toFixed(0)}</Text>
                  </View>

                  <View style={[styles.reportSection, styles.highlightSection]}>
                    <Text style={styles.reportLabelBold}>Gross Profit (Sales - COGS)</Text>
                    <Text style={[styles.reportValueBig, { color: data.grossProfit >= 0 ? COLORS.success : COLORS.danger }]}>
                      {CURRENCY}{data.grossProfit.toFixed(0)}
                    </Text>
                  </View>

                  <View style={styles.reportSection}>
                    <Text style={styles.reportLabel}>Profit per Unit ({data.unitsSold} sold)</Text>
                    <Text style={[styles.reportValue, { color: COLORS.primary }]}>{CURRENCY}{data.profitPerUnit.toFixed(1)}</Text>
                  </View>

                  <View style={styles.reportSection}>
                    <Text style={styles.reportLabel}>Business Expenses</Text>
                    <Text style={[styles.reportValue, { color: COLORS.danger }]}>−{CURRENCY}{data.totalExpenses.toFixed(0)}</Text>
                  </View>

                  <View style={[styles.reportSection, styles.highlightSection]}>
                    <Text style={styles.reportLabelBold}>Net Profit (Gross - Expenses)</Text>
                    <Text style={[styles.reportValueBig, { color: data.netProfitBeforeWithdrawals >= 0 ? COLORS.success : COLORS.danger }]}>
                      {CURRENCY}{data.netProfitBeforeWithdrawals.toFixed(0)}
                    </Text>
                  </View>

                  <View style={styles.reportSection}>
                    <Text style={styles.reportLabel}>Total Withdrawals</Text>
                    <Text style={[styles.reportValue, { color: COLORS.purple }]}>−{CURRENCY}{data.totalWithdrawals.toFixed(0)}</Text>
                  </View>

                  <View style={styles.reportSection}>
                    <Text style={styles.reportLabel}>Per Partner Share ({nonGuestSellers.length})</Text>
                    <Text style={[styles.reportValue, { color: COLORS.primary }]}>{CURRENCY}{data.perPartnerShare.toFixed(0)}</Text>
                  </View>

                  <Text style={[styles.cardTitle, { marginTop: 24, marginBottom: 8 }]}>Net Profit by Partner</Text>
                  <Text style={styles.infoTextSmall}>(Share - Personal Withdrawals)</Text>
                  {nonGuestSellers.map((seller) => (
                    <View key={seller.name} style={styles.reportSection}>
                      <Text style={styles.reportLabel}>{seller.name}</Text>
                      <View style={{ alignItems: 'flex-end' }}>
                        <Text style={[styles.reportValue, { color: (data.netProfitByPartner[seller.name] || 0) >= 0 ? COLORS.success : COLORS.danger }]}>
                          {CURRENCY}{(data.netProfitByPartner[seller.name] || 0).toFixed(0)}
                        </Text>
                        <Text style={styles.reportSubtext}>(withdrew: {CURRENCY}{(data.withdrawalsByPerson[seller.name] || 0).toFixed(0)})</Text>
                      </View>
                    </View>
                  ))}
                </>
              )}

              <Text style={[styles.cardTitle, { marginTop: 24, marginBottom: 8 }]}>Sales by Seller</Text>
              <DonutChart data={salesChartData} />

              <Text style={[styles.cardTitle, { marginTop: 24, marginBottom: 8 }]}>Withdrawals by Person</Text>
              <DonutChart data={withdrawalsChartData} />
            </ScrollView>
          </View>
        </View>
        {renderMonthPickerModal()}
      </Modal>
    );
  };

  const renderSellerPickerModal = () => {
    const nonGuestSellers = getNonGuestSellers();
    return (
      <Modal visible={showSellerPickerModal} animationType="fade" transparent>
        <TouchableOpacity style={styles.pickerOverlay} activeOpacity={1} onPress={() => setShowSellerPickerModal(false)}>
          <View style={styles.pickerContent}>
            <Text style={styles.pickerTitle}>Select Person</Text>
            {nonGuestSellers.length === 0 ? (
              <Text style={styles.emptyText}>No sellers available</Text>
            ) : (
              nonGuestSellers.map(seller => (
                <TouchableOpacity key={seller.name}
                  style={[styles.pickerItem, withdrawPerson === seller.name && styles.pickerItemActive]}
                  onPress={() => { setWithdrawPerson(seller.name); setShowSellerPickerModal(false); }}>
                  <Text style={[styles.pickerItemText, withdrawPerson === seller.name && styles.pickerItemTextActive]}>{seller.name}</Text>
                  {withdrawPerson === seller.name && <Text style={styles.checkmark}>✓</Text>}
                </TouchableOpacity>
              ))
            )}
          </View>
        </TouchableOpacity>
      </Modal>
    );
  };

  const renderWithdrawModal = () => (
    <Modal visible={showWithdrawModal} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { paddingBottom: modalBottomPad }]}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Withdraw</Text>
            <TouchableOpacity onPress={() => setShowWithdrawModal(false)}><Text style={styles.closeBtn}>✕</Text></TouchableOpacity>
          </View>
          <Text style={styles.infoText}>Note: Guests cannot withdraw</Text>
          <TextInput style={styles.input} placeholder="Amount" placeholderTextColor={COLORS.textLight}
            keyboardType="numeric" value={withdrawAmount} onChangeText={setWithdrawAmount} />
          <Text style={styles.inputLabel}>Select Person</Text>
          <TouchableOpacity style={styles.dropdownBtn} onPress={() => setShowSellerPickerModal(true)}>
            <Text style={styles.dropdownBtnText}>{withdrawPerson || 'Select person'}</Text>
            <Text style={styles.dropdownArrow}>▼</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.primaryBtn} onPress={handleWithdraw}>
            <Text style={styles.primaryBtnText}>Withdraw</Text>
          </TouchableOpacity>
        </View>
      </View>
      {renderSellerPickerModal()}
    </Modal>
  );

  const renderWithdrawalHistoryModal = () => (
    <Modal visible={showWithdrawalHistoryModal} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { paddingBottom: modalBottomPad }]}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Withdrawal History</Text>
            <TouchableOpacity onPress={() => setShowWithdrawalHistoryModal(false)}><Text style={styles.closeBtn}>✕</Text></TouchableOpacity>
          </View>
          <FlatList data={[...withdrawals].reverse()} keyExtractor={item => item.id}
            contentContainerStyle={{ paddingBottom: 8 }}
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.historyItem} onLongPress={() => deleteWithdrawal(item.id)}>
                <View>
                  <Text style={styles.historyDate}>{formatDateTime(item.date)}</Text>
                  <Text style={styles.historyDetails}>{item.person}</Text>
                </View>
                <Text style={[styles.historyAmount, { color: COLORS.purple }]}>−{CURRENCY}{(item.amount || 0).toFixed(0)}</Text>
              </TouchableOpacity>
            )}
            ListEmptyComponent={<Text style={styles.emptyText}>No withdrawals yet</Text>}
          />
          <Text style={styles.hintText}>Long press to delete</Text>
        </View>
      </View>
    </Modal>
  );

  const renderSettingsModal = () => (
    <Modal visible={showSettingsModal} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { paddingBottom: modalBottomPad }]}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Settings</Text>
            <TouchableOpacity onPress={() => setShowSettingsModal(false)}><Text style={styles.closeBtn}>✕</Text></TouchableOpacity>
          </View>
          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={styles.settingsSection}>Default Sell Price</Text>
            <Text style={styles.infoTextSmall}>Current: {CURRENCY}{sellPricePerUnit > 0 ? sellPricePerUnit : getCurrentSellPrice()}</Text>
            <View style={{ flexDirection: 'row', marginTop: 8 }}>
              <TextInput style={[styles.input, { flex: 1, marginRight: 8 }]} placeholder="New sell price"
                placeholderTextColor={COLORS.textLight} keyboardType="numeric" value={settingsSellPrice} onChangeText={setSettingsSellPrice} />
              <TouchableOpacity style={styles.addBtn} onPress={handleUpdateSellPrice}><Text style={styles.addBtnText}>Set</Text></TouchableOpacity>
            </View>

            <Text style={[styles.settingsSection, { marginTop: 24 }]}>Manage Sellers</Text>
            {sellers.map(seller => (
              <View key={seller.name} style={styles.sellerRow}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={styles.sellerName}>{seller.name}</Text>
                  {seller.isGuest && <View style={styles.guestBadge}><Text style={styles.guestBadgeText}>Guest</Text></View>}
                </View>
                <TouchableOpacity onPress={() => handleDeleteSeller(seller.name)}><Text style={styles.deleteText}>Delete</Text></TouchableOpacity>
              </View>
            ))}

            <Text style={[styles.inputLabel, { marginTop: 16 }]}>Add New</Text>
            <View style={styles.typeToggle}>
              <TouchableOpacity style={[styles.typeBtn, newSellerType === 'seller' && styles.typeBtnActive]} onPress={() => setNewSellerType('seller')}>
                <Text style={[styles.typeBtnText, newSellerType === 'seller' && styles.typeBtnTextActive]}>Seller</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.typeBtn, newSellerType === 'guest' && styles.typeBtnActive]} onPress={() => setNewSellerType('guest')}>
                <Text style={[styles.typeBtnText, newSellerType === 'guest' && styles.typeBtnTextActive]}>Guest</Text>
              </TouchableOpacity>
            </View>
            <View style={{ flexDirection: 'row', marginTop: 8 }}>
              <TextInput style={[styles.input, { flex: 1, marginRight: 8 }]} placeholder={newSellerType === 'guest' ? "Guest name" : "Seller name"}
                placeholderTextColor={COLORS.textLight} value={newSellerName} onChangeText={setNewSellerName} />
              <TouchableOpacity style={styles.addBtn} onPress={handleAddSeller}><Text style={styles.addBtnText}>Add</Text></TouchableOpacity>
            </View>

            <TouchableOpacity style={[styles.primaryBtn, { backgroundColor: COLORS.danger, marginTop: 30 }]} onPress={() => setShowResetModal(true)}>
              <Text style={styles.primaryBtnText}>Reset All Data</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  const renderResetModal = () => (
    <Modal visible={showResetModal} animationType="fade" transparent>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { maxHeight: 280, paddingBottom: modalBottomPad }]}>
          <Text style={styles.modalTitle}>Reset All Data</Text>
          <Text style={styles.resetWarning}>This will delete all data.</Text>
          <TextInput style={styles.input} placeholder="Enter code (999)" placeholderTextColor={COLORS.textLight}
            value={resetCode} onChangeText={setResetCode} secureTextEntry />
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <TouchableOpacity style={[styles.primaryBtn, { flex: 1, marginRight: 8, backgroundColor: '#64748B' }]}
              onPress={() => { setShowResetModal(false); setResetCode(''); }}>
              <Text style={styles.primaryBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.primaryBtn, { flex: 1, backgroundColor: COLORS.danger }]} onPress={resetAllData}>
              <Text style={styles.primaryBtnText}>Reset</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  const renderHistoryModal = () => {
    const allHistory = [
      ...transactions.map(t => ({ ...t, type: 'sale' })),
      ...businessExpenses.filter(e => !e.isStockPurchase).map(e => ({ ...e, type: 'expense' })),
      ...withdrawals.map(w => ({ ...w, type: 'withdrawal' }))
    ];
    allHistory.sort((a, b) => new Date(b.date) - new Date(a.date));

    return (
      <Modal visible={showHistoryModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { paddingBottom: modalBottomPad }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>All History</Text>
              <TouchableOpacity onPress={() => setShowHistoryModal(false)}><Text style={styles.closeBtn}>✕</Text></TouchableOpacity>
            </View>
            <FlatList data={allHistory} keyExtractor={item => item.id + item.type}
              contentContainerStyle={{ paddingBottom: 8 }}
              renderItem={({ item }) => {
                if (item.type === 'sale') {
                  const sellerInfo = sellers.find(s => s.name === item.seller);
                  const isGuestSale = sellerInfo?.isGuest || item.sellerIsGuest;
                  return (
                    <TouchableOpacity style={styles.historyItem} onLongPress={() => deleteTransaction(item.id)}>
                      <View>
                        <Text style={styles.historyDate}>{formatDateTime(item.date)}</Text>
                        <Text style={styles.historyDetails}>{item.quantity} units • {item.seller}{isGuestSale ? ' (Guest)' : ''}</Text>
                        {item.notes ? <Text style={styles.historyNotes}>{item.notes}</Text> : null}
                      </View>
                      <Text style={[styles.historyAmount, { color: COLORS.secondary }]}>+{CURRENCY}{(item.total || 0).toFixed(0)}</Text>
                    </TouchableOpacity>
                  );
                } else if (item.type === 'expense') {
                  return (
                    <TouchableOpacity style={styles.historyItem} onLongPress={() => deleteExpense(item.id)}>
                      <View>
                        <Text style={styles.historyDate}>{formatDateTime(item.date)}</Text>
                        <Text style={styles.historyDetails}>{item.description}</Text>
                      </View>
                      <Text style={[styles.historyAmount, { color: COLORS.danger }]}>−{CURRENCY}{(item.amount || 0).toFixed(0)}</Text>
                    </TouchableOpacity>
                  );
                } else {
                  return (
                    <TouchableOpacity style={styles.historyItem} onLongPress={() => deleteWithdrawal(item.id)}>
                      <View>
                        <Text style={styles.historyDate}>{formatDateTime(item.date)}</Text>
                        <Text style={styles.historyDetails}>{item.person} withdrew</Text>
                      </View>
                      <Text style={[styles.historyAmount, { color: COLORS.purple }]}>−{CURRENCY}{(item.amount || 0).toFixed(0)}</Text>
                    </TouchableOpacity>
                  );
                }
              }}
              ListEmptyComponent={<Text style={styles.emptyText}>No history yet</Text>}
            />
            <Text style={styles.hintText}>Long press to delete</Text>
          </View>
        </View>
      </Modal>
    );
  };

  const renderExportModal = () => (
    <Modal visible={showExportModal} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { paddingBottom: modalBottomPad }]}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Export CSV</Text>
            <TouchableOpacity onPress={() => setShowExportModal(false)}><Text style={styles.closeBtn}>✕</Text></TouchableOpacity>
          </View>
          <ScrollView style={styles.csvPreview}><Text style={styles.csvText}>{csvContent}</Text></ScrollView>
          <Text style={styles.exportInstructions}>Copy and paste into a text file. Save as .csv</Text>
          <TouchableOpacity style={styles.primaryBtn} onPress={copyCSV}><Text style={styles.primaryBtnText}>Copy to Clipboard</Text></TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  const autoSubtotal = getAutoPrice();
  const discountVal = parseFloat(sellDiscount) || 0;
  const finalTotal = autoSubtotal - discountVal;

  const renderSellModal = () => (
    <Modal visible={showSellModal} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { paddingBottom: modalBottomPad }]}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Custom Sale</Text>
            <TouchableOpacity onPress={() => setShowSellModal(false)}><Text style={styles.closeBtn}>✕</Text></TouchableOpacity>
          </View>
          <Text style={styles.inputLabel}>Quantity</Text>
          <TextInput style={styles.input} placeholder="Quantity" placeholderTextColor={COLORS.textLight}
            keyboardType="numeric" value={sellQty} onChangeText={setSellQty} />
          <View style={styles.priceBox}>
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Price per unit:</Text>
              <Text style={styles.priceValue}>{CURRENCY}{getCurrentSellPrice()}</Text>
            </View>
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Cost per unit:</Text>
              <Text style={styles.priceValue}>{CURRENCY}{avgCostPrice().toFixed(0)}</Text>
            </View>
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Profit per unit:</Text>
              <Text style={[styles.priceValue, { color: COLORS.success }]}>{CURRENCY}{profitPerUnit.toFixed(0)}</Text>
            </View>
            <View style={[styles.priceRow, { borderTopWidth: 1, borderTopColor: COLORS.border, paddingTop: 8, marginTop: 4 }]}>
              <Text style={styles.priceLabel}>Subtotal ({sellQty || 0} × {getCurrentSellPrice()}):</Text>
              <Text style={styles.priceValueBig}>{CURRENCY}{autoSubtotal.toFixed(0)}</Text>
            </View>
          </View>
          <Text style={styles.inputLabel}>Discount (optional)</Text>
          <TextInput style={styles.input} placeholder="Discount amount" placeholderTextColor={COLORS.textLight}
            keyboardType="numeric" value={sellDiscount} onChangeText={setSellDiscount} />
          {discountVal > 0 && (
            <View style={styles.discountBox}><Text style={styles.discountText}>After discount: {CURRENCY}{finalTotal.toFixed(0)}</Text></View>
          )}
          <Text style={styles.inputLabel}>Notes (optional)</Text>
          <TextInput style={styles.input} placeholder="Add notes..." placeholderTextColor={COLORS.textLight}
            value={sellNotes} onChangeText={setSellNotes} />
          <TouchableOpacity style={styles.primaryBtn} onPress={handleSell}>
            <Text style={styles.primaryBtnText}>Complete Sale ({CURRENCY}{finalTotal.toFixed(0)})</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  const stockTotal = (parseInt(stockQty) || 0) * (parseFloat(stockCostPrice) || 0);
  const stockProfitPerUnit = (parseFloat(stockSellPrice) || 0) - (parseFloat(stockCostPrice) || 0);

  const renderStockModal = () => (
    <Modal visible={showStockModal} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { paddingBottom: modalBottomPad }]}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Add Stock</Text>
            <TouchableOpacity onPress={() => setShowStockModal(false)}><Text style={styles.closeBtn}>✕</Text></TouchableOpacity>
          </View>
          <TextInput style={styles.input} placeholder="Quantity" placeholderTextColor={COLORS.textLight}
            keyboardType="numeric" value={stockQty} onChangeText={setStockQty} />
          <Text style={styles.inputLabel}>Cost Price (buying price) *</Text>
          <TextInput style={styles.input} placeholder="How much you pay per unit" placeholderTextColor={COLORS.textLight}
            keyboardType="numeric" value={stockCostPrice} onChangeText={setStockCostPrice} />
          <Text style={styles.inputLabel}>Sell Price (optional)</Text>
          <TextInput style={styles.input} placeholder="How much you sell per unit" placeholderTextColor={COLORS.textLight}
            keyboardType="numeric" value={stockSellPrice} onChangeText={setStockSellPrice} />
          
          {stockTotal > 0 && (
            <View style={styles.stockTotalBox}>
              <Text style={styles.stockTotalLabel}>Total Purchase Cost:</Text>
              <Text style={styles.stockTotalValue}>{CURRENCY}{stockTotal.toFixed(0)}</Text>
            </View>
          )}
          {parseFloat(stockSellPrice) > 0 && parseFloat(stockCostPrice) > 0 && (
            <View style={[styles.stockTotalBox, { backgroundColor: stockProfitPerUnit >= 0 ? COLORS.secondary + '20' : COLORS.danger + '20' }]}>
              <Text style={styles.stockTotalLabel}>Profit per Unit:</Text>
              <Text style={[styles.stockTotalValue, { color: stockProfitPerUnit >= 0 ? COLORS.success : COLORS.danger }]}>
                {CURRENCY}{stockProfitPerUnit.toFixed(0)}
              </Text>
            </View>
          )}

          <TouchableOpacity style={styles.primaryBtn} onPress={handleAddStock}>
            <Text style={styles.primaryBtnText}>Add Stock</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  const setupStockTotal = (parseInt(setupInitialStock) || 0) * (parseFloat(setupCostPrice) || 0);
  const setupProfitPerUnit = (parseFloat(setupSellPrice) || 0) - (parseFloat(setupCostPrice) || 0);

  const renderSetupModal = () => (
    <Modal visible={showSetupModal} animationType="slide" transparent={false}>
      <SafeAreaView style={styles.setupContainer} edges={['top', 'bottom', 'left', 'right']}>
        <View style={styles.setupHeader}>
          <Text style={styles.setupTitle}>Welcome! Let's Setup</Text>
          <Text style={styles.setupSubtitle}>Configure your shop before starting</Text>
        </View>
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }}>
          <Text style={styles.inputLabel}>Shop/Business Name</Text>
          <TextInput style={styles.input} placeholder="e.g. My Shop" placeholderTextColor={COLORS.textLight}
            value={setupName} onChangeText={setSetupName} />

          <Text style={styles.inputLabel}>Cash in Hand (optional)</Text>
          <TextInput style={styles.input} placeholder="How much cash you have now" placeholderTextColor={COLORS.textLight}
            keyboardType="numeric" value={setupCashInHand} onChangeText={setSetupCashInHand} />
          <Text style={styles.infoTextSmall}>This helps track your spending</Text>

          <Text style={[styles.inputLabel, { marginTop: 8 }]}>Sellers / Partners *</Text>
          <View style={styles.card}>
            {setupSellers.length === 0 && (
              <Text style={{ color: COLORS.textLight, marginBottom: 12, fontWeight: '600' }}>Add at least one seller (not guest).</Text>
            )}
            {setupSellers.map((s, i) => (
              <View key={s.name + i} style={styles.sellerRow}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={styles.sellerName}>{s.name}</Text>
                  {s.isGuest && <View style={styles.guestBadge}><Text style={styles.guestBadgeText}>Guest</Text></View>}
                </View>
                <TouchableOpacity onPress={() => removeSetupSeller(s.name)}><Text style={styles.deleteText}>Remove</Text></TouchableOpacity>
              </View>
            ))}
            <Text style={[styles.inputLabel, { marginTop: 12 }]}>Type</Text>
            <View style={styles.typeToggle}>
              <TouchableOpacity style={[styles.typeBtn, setupSellerType === 'seller' && styles.typeBtnActive]} onPress={() => setSetupSellerType('seller')}>
                <Text style={[styles.typeBtnText, setupSellerType === 'seller' && styles.typeBtnTextActive]}>Seller</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.typeBtn, setupSellerType === 'guest' && styles.typeBtnActive]} onPress={() => setSetupSellerType('guest')}>
                <Text style={[styles.typeBtnText, setupSellerType === 'guest' && styles.typeBtnTextActive]}>Guest</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.infoTextSmall}>{setupSellerType === 'guest' ? 'Guests can only sell' : 'Sellers share profit'}</Text>
            <View style={{ flexDirection: 'row', marginTop: 8 }}>
              <TextInput style={[styles.input, { flex: 1, marginRight: 8, marginBottom: 0 }]}
                placeholder={setupSellerType === 'guest' ? "Guest name" : "Seller name"} placeholderTextColor={COLORS.textLight}
                value={setupSellerName} onChangeText={setSetupSellerName} />
              <TouchableOpacity style={styles.addBtn} onPress={addSetupSeller}><Text style={styles.addBtnText}>Add</Text></TouchableOpacity>
            </View>
          </View>

          <Text style={[styles.inputLabel, { marginTop: 16 }]}>Initial Stock (optional)</Text>
          <TextInput style={styles.input} placeholder="How many units in inventory?" placeholderTextColor={COLORS.textLight}
            keyboardType="numeric" value={setupInitialStock} onChangeText={setSetupInitialStock} />

          <Text style={styles.inputLabel}>Cost Price per Unit (buying price)</Text>
          <TextInput style={styles.input} placeholder="How much you pay per unit" placeholderTextColor={COLORS.textLight}
            keyboardType="numeric" value={setupCostPrice} onChangeText={setSetupCostPrice} />

          <Text style={styles.inputLabel}>Sell Price per Unit (optional)</Text>
          <TextInput style={styles.input} placeholder="How much you sell per unit" placeholderTextColor={COLORS.textLight}
            keyboardType="numeric" value={setupSellPrice} onChangeText={setSetupSellPrice} />

          {setupStockTotal > 0 && (
            <View style={styles.stockTotalBox}>
              <Text style={styles.stockTotalLabel}>Total Purchase Cost:</Text>
              <Text style={styles.stockTotalValue}>{CURRENCY}{setupStockTotal.toFixed(0)}</Text>
            </View>
          )}
          {parseFloat(setupSellPrice) > 0 && parseFloat(setupCostPrice) > 0 && (
            <View style={[styles.stockTotalBox, { backgroundColor: setupProfitPerUnit >= 0 ? COLORS.secondary + '20' : COLORS.danger + '20' }]}>
              <Text style={styles.stockTotalLabel}>Profit per Unit:</Text>
              <Text style={[styles.stockTotalValue, { color: setupProfitPerUnit >= 0 ? COLORS.success : COLORS.danger }]}>
                {CURRENCY}{setupProfitPerUnit.toFixed(0)}
              </Text>
            </View>
          )}

          <TouchableOpacity style={[styles.primaryBtn, { marginTop: 24 }]} onPress={finishSetup}>
            <Text style={styles.primaryBtnText}>Start Using App</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{businessName || 'My Shop'}</Text>
        <Text style={styles.headerSubtitle}>Stock: {currentStock()} • Total: {CURRENCY}{getTotalAssets().toFixed(0)}</Text>
      </View>
      {activeTab === 'home' ? renderHome() : renderActions()}
      <View style={[styles.bottomNav, { paddingBottom: bottomNavPad }]}>
        <TouchableOpacity style={[styles.navItem, activeTab === 'home' && styles.navItemActive]} onPress={() => setActiveTab('home')}>
          <Text style={styles.navIcon}>🏠</Text>
          <Text style={[styles.navLabel, activeTab === 'home' && styles.navLabelActive]}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.navItem, activeTab === 'actions' && styles.navItemActive]} onPress={() => setActiveTab('actions')}>
          <Text style={styles.navIcon}>⚡</Text>
          <Text style={[styles.navLabel, activeTab === 'actions' && styles.navLabelActive]}>Actions</Text>
        </TouchableOpacity>
      </View>
      {renderSellModal()}
      {renderWithdrawModal()}
      {renderStockModal()}
      {renderReportModal()}
      {renderHistoryModal()}
      {renderSettingsModal()}
      {renderResetModal()}
      {renderExportModal()}
      {renderWithdrawalHistoryModal()}
      {renderSetupModal()}
    </View>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <InventoryApp />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8 },
  headerTitle: { fontSize: 24, fontWeight: '800', color: COLORS.text },
  headerSubtitle: { fontSize: 14, color: COLORS.textSecondary, marginTop: 2 },
  content: { flex: 1, paddingHorizontal: 16, paddingTop: 16 },
  summaryCard: { backgroundColor: COLORS.primary, borderRadius: 16, padding: 20, marginBottom: 16 },
  summaryTitle: { fontSize: 16, fontWeight: '700', color: '#FFFFFF', marginBottom: 16 },
  summaryGrid: { flexDirection: 'row', justifyContent: 'space-around' },
  summaryItem: { alignItems: 'center' },
  summaryValue: { fontSize: 24, fontWeight: '800', color: '#FFFFFF' },
  summaryValueSmall: { fontSize: 18, fontWeight: '700', color: '#FFFFFF' },
  summaryLabel: { fontSize: 12, color: 'rgba(255,255,255,0.9)', marginTop: 4 },
  card: { backgroundColor: COLORS.card, borderRadius: 16, padding: 16, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 10, elevation: 2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: COLORS.text, marginBottom: 12 },
  viewAllText: { fontSize: 14, color: COLORS.primary, fontWeight: '700' },
  priceInfoRow: { marginBottom: 12 },
  priceInfoText: { fontSize: 12, color: COLORS.textSecondary, fontWeight: '600' },
  sellerChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 999, backgroundColor: COLORS.background, marginRight: 8, borderWidth: 1, borderColor: COLORS.border },
  sellerChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  sellerChipText: { fontSize: 14, color: COLORS.textSecondary, fontWeight: '600' },
  sellerChipTextActive: { color: '#FFFFFF' },
  quickSellGrid: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  quickSellBtn: { backgroundColor: COLORS.background, borderRadius: 12, paddingVertical: 12, paddingHorizontal: 14, alignItems: 'center', borderWidth: 1, borderColor: COLORS.border, minWidth: 52 },
  quickSellBtnText: { fontSize: 18, fontWeight: '800', color: COLORS.text },
  quickSellBtnLabel: { fontSize: 10, color: COLORS.textSecondary, fontWeight: '600' },
  customSellBtn: { backgroundColor: COLORS.secondary, borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  customSellBtnText: { fontSize: 16, fontWeight: '800', color: '#FFFFFF' },
  activityItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  activityLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  activityBadge: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  activityBadgeText: { color: '#FFFFFF', fontWeight: '900', fontSize: 16 },
  activityTitle: { fontSize: 14, fontWeight: '700', color: COLORS.text },
  activitySubtitle: { fontSize: 12, color: COLORS.textSecondary, fontWeight: '600' },
  activityAmount: { fontSize: 15, fontWeight: '800' },
  emptyText: { textAlign: 'center', color: COLORS.textSecondary, paddingVertical: 20, fontWeight: '600' },
  hintText: { textAlign: 'center', fontSize: 12, color: COLORS.textSecondary, marginTop: 8, fontWeight: '600' },
  infoText: { fontSize: 13, color: COLORS.textSecondary, marginBottom: 12, fontWeight: '600' },
  infoTextSmall: { fontSize: 12, color: COLORS.textLight, marginBottom: 8, fontWeight: '600' },
  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  actionCard: { width: '48%', borderRadius: 16, padding: 20, alignItems: 'center', marginBottom: 12 },
  actionIcon: { fontSize: 28, marginBottom: 8 },
  actionTitle: { fontSize: 14, fontWeight: '800', color: '#FFFFFF' },
  input: { backgroundColor: COLORS.background, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 16, color: COLORS.text, marginBottom: 12, borderWidth: 1, borderColor: COLORS.border, fontWeight: '600' },
  inputLabel: { fontSize: 14, fontWeight: '700', color: COLORS.text, marginBottom: 8 },
  dropdownBtn: { backgroundColor: COLORS.background, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, marginBottom: 12, borderWidth: 1, borderColor: COLORS.border, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  dropdownBtnText: { fontSize: 16, color: COLORS.text, fontWeight: '700' },
  dropdownArrow: { fontSize: 12, color: COLORS.textSecondary, fontWeight: '900' },
  pickerOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  pickerContent: { backgroundColor: COLORS.card, borderRadius: 16, padding: 16, width: '100%', maxWidth: 320, maxHeight: 400 },
  pickerTitle: { fontSize: 18, fontWeight: '800', color: COLORS.text, marginBottom: 16, textAlign: 'center' },
  pickerItem: { paddingVertical: 14, paddingHorizontal: 16, borderRadius: 10, marginBottom: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: COLORS.background, borderWidth: 1, borderColor: COLORS.border },
  pickerItemActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  pickerItemText: { fontSize: 16, color: COLORS.text, fontWeight: '700' },
  pickerItemTextActive: { color: '#FFFFFF' },
  checkmark: { fontSize: 16, color: '#FFFFFF', fontWeight: '900' },
  primaryBtn: { backgroundColor: COLORS.primary, borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  primaryBtnText: { fontSize: 16, fontWeight: '900', color: '#FFFFFF' },
  bottomNav: { flexDirection: 'row', backgroundColor: COLORS.card, borderTopWidth: 1, borderTopColor: COLORS.border, paddingTop: 12 },
  navItem: { flex: 1, alignItems: 'center', paddingVertical: 4 },
  navItemActive: {},
  navIcon: { fontSize: 22 },
  navLabel: { fontSize: 12, color: COLORS.textSecondary, marginTop: 4, fontWeight: '700' },
  navLabelActive: { color: COLORS.primary, fontWeight: '900' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: COLORS.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, maxHeight: '90%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: '900', color: COLORS.text },
  closeBtn: { fontSize: 24, color: COLORS.textSecondary, padding: 4, fontWeight: '900' },
  reportSection: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  highlightSection: { backgroundColor: COLORS.background, marginHorizontal: -8, paddingHorizontal: 8, borderRadius: 8, borderBottomWidth: 0, marginVertical: 4 },
  reportLabel: { fontSize: 14, color: COLORS.textSecondary, fontWeight: '600', flex: 1 },
  reportLabelBold: { fontSize: 15, color: COLORS.text, fontWeight: '800', flex: 1 },
  reportValue: { fontSize: 16, fontWeight: '800', color: COLORS.text },
  reportValueBig: { fontSize: 20, fontWeight: '900' },
  reportSubtext: { fontSize: 11, color: COLORS.textLight, fontWeight: '600' },
  reportPeriodTitle: { fontSize: 14, fontWeight: '700', color: COLORS.primary, textAlign: 'center', marginBottom: 12 },
  toggleContainer: { flexDirection: 'row', backgroundColor: COLORS.background, borderRadius: 12, padding: 4, marginBottom: 12 },
  toggleBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
  toggleBtnActive: { backgroundColor: COLORS.primary },
  toggleBtnText: { fontSize: 13, fontWeight: '700', color: COLORS.textSecondary },
  toggleBtnTextActive: { color: '#FFFFFF' },
  profitToggleContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: COLORS.background, borderRadius: 12, padding: 12, marginBottom: 12 },
  profitToggleLabel: { fontSize: 13, fontWeight: '700', color: COLORS.text, flex: 1 },
  typeToggle: { flexDirection: 'row', marginBottom: 8 },
  typeBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center', backgroundColor: COLORS.background, marginRight: 8, borderWidth: 1, borderColor: COLORS.border },
  typeBtnActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  typeBtnText: { fontSize: 14, fontWeight: '700', color: COLORS.textSecondary },
  typeBtnTextActive: { color: '#FFFFFF' },
  guestBadge: { backgroundColor: COLORS.guest, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, marginLeft: 8 },
  guestBadgeText: { fontSize: 10, fontWeight: '800', color: '#FFFFFF' },
  settingsSection: { fontSize: 16, fontWeight: '900', color: COLORS.text, marginBottom: 8 },
  sellerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  sellerName: { fontSize: 16, color: COLORS.text, fontWeight: '800' },
  deleteText: { fontSize: 14, color: COLORS.danger, fontWeight: '900' },
  addBtn: { backgroundColor: COLORS.primary, borderRadius: 12, paddingHorizontal: 20, justifyContent: 'center' },
  addBtnText: { color: '#FFFFFF', fontWeight: '900' },
  resetWarning: { fontSize: 14, color: COLORS.danger, marginBottom: 16, textAlign: 'center', fontWeight: '800' },
  historyItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  historyDate: { fontSize: 13, fontWeight: '800', color: COLORS.text },
  historyDetails: { fontSize: 13, color: COLORS.textSecondary, fontWeight: '700' },
  historyNotes: { fontSize: 11, color: COLORS.textLight, fontStyle: 'italic', marginTop: 2 },
  historyAmount: { fontSize: 16, fontWeight: '900' },
  csvPreview: { backgroundColor: COLORS.background, borderRadius: 12, padding: 12, maxHeight: 200, marginBottom: 12, borderWidth: 1, borderColor: COLORS.border },
  csvText: { fontSize: 11, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace', color: COLORS.text },
  exportInstructions: { fontSize: 13, color: COLORS.textSecondary, textAlign: 'center', marginBottom: 16, fontWeight: '700' },
  stockTotalBox: { backgroundColor: COLORS.background, borderRadius: 10, padding: 12, marginBottom: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  stockTotalLabel: { fontSize: 14, color: COLORS.textSecondary, fontWeight: '700' },
  stockTotalValue: { fontSize: 18, color: COLORS.primary, fontWeight: '900' },
  priceBox: { backgroundColor: COLORS.background, borderRadius: 10, padding: 12, marginBottom: 12 },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  priceLabel: { fontSize: 13, color: COLORS.textSecondary, fontWeight: '600' },
  priceValue: { fontSize: 14, color: COLORS.text, fontWeight: '800' },
  priceValueBig: { fontSize: 16, color: COLORS.text, fontWeight: '900' },
  discountBox: { backgroundColor: COLORS.secondary + '20', borderRadius: 8, padding: 10, marginBottom: 12, alignItems: 'center' },
  discountText: { fontSize: 16, color: COLORS.secondary, fontWeight: '800' },
  setupContainer: { flex: 1, backgroundColor: COLORS.background },
  setupHeader: { paddingHorizontal: 16, paddingVertical: 20, backgroundColor: COLORS.primary },
  setupTitle: { fontSize: 24, fontWeight: '900', color: '#FFFFFF' },
  setupSubtitle: { marginTop: 6, fontSize: 14, color: 'rgba(255,255,255,0.9)', fontWeight: '600' },
});
