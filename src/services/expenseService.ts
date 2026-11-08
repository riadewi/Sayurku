import { 
  collection, 
  doc, 
  getDocs, 
  setDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit 
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { Expense, ExpenseCategory } from '../types';
import { generateExpenseNumber } from '../lib/utils';

export const expenseService = {
  async getExpenses(businessId: string, maxItems: number = 300): Promise<Expense[]> {
    try {
      const q = query(
        collection(db, 'expenses'),
        where('businessId', '==', businessId),
        orderBy('createdAt', 'desc'),
        limit(maxItems)
      );
      const snapshot = await getDocs(q);
      const expenses: Expense[] = [];
      snapshot.forEach(docSnap => {
        expenses.push({ id: docSnap.id, ...docSnap.data() } as Expense);
      });
      return expenses;
    } catch (error) {
      console.warn('Error fetching expenses, falling back to simple query:', error);
      try {
        const simpleQ = query(collection(db, 'expenses'), where('businessId', '==', businessId));
        const snap = await getDocs(simpleQ);
        const expenses: Expense[] = [];
        snap.forEach(d => expenses.push({ id: d.id, ...d.data() } as Expense));
        return expenses.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
      } catch (e) {
        console.warn('Fallback error fetching expenses:', e);
        return [];
      }
    }
  },

  async addExpense(params: {
    businessId: string;
    category: ExpenseCategory;
    amount: number;
    date: string;
    description: string;
    userId: string;
  }): Promise<Expense> {
    const { businessId, category, amount, date, description, userId } = params;
    const expenseRef = doc(collection(db, 'expenses'));
    const expenseNumber = generateExpenseNumber();
    const nowIso = new Date().toISOString();

    const newExpense: Expense = {
      id: expenseRef.id,
      businessId,
      expenseNumber,
      category,
      amount,
      date: date || nowIso.split('T')[0],
      description,
      userId,
      createdAt: nowIso
    };

    try {
      await setDoc(expenseRef, newExpense);
      return newExpense;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `expenses/${expenseRef.id}`);
    }
  },

  async deleteExpense(expenseId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'expenses', expenseId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `expenses/${expenseId}`);
    }
  }
};
