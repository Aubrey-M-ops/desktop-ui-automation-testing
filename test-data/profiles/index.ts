import profile10001 from './10001.json';
import profile10012 from './10012.json';

export interface ProfileFixture {
  visible: boolean;
  customerName: string;
  accountNumber: string;
  customerTier: string;
  accountStatus: string;
  lastPaymentDate: string;
  preferredLanguage: string;
  recentTransactions: Array<{
    date: string;
    description: string;
    amount: string;
  }>;
  accountHistoryNotes: string[];
}

export const PROFILES: Record<string, ProfileFixture> = {
  '10001': profile10001,
  '10012': profile10012,
};

export { profile10001, profile10012 };
