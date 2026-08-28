export interface MonthlyCustomerData {
  id: number;
  code: string;
  name: string;
  trade_name?: string;
  phone?: string;
  city?: string;
  address?: string;
  balance: number;
  assigned_employee_name?: string;
  months: {
    jan: number;
    feb: number;
    mar: number;
    apr: number;
    may: number;
    jun: number;
    jul: number;
    aug: number;
    sep: number;
    oct: number;
    nov: number;
    dec: number;
  };
}

export const MONTH_NAMES_AR = [
  'يناير', 'فبراير', 'مارس', 'إبريل', 'مايو', 'يونيو',
  'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
];

export const MONTH_KEYS = [
  'jan', 'feb', 'mar', 'apr', 'may', 'jun',
  'jul', 'aug', 'sep', 'oct', 'nov', 'dec'
] as const;

const ZERO_MONTHS = {
  jan: 0.00,
  feb: 0.00,
  mar: 0.00,
  apr: 0.00,
  may: 0.00,
  jun: 0.00,
  jul: 0.00,
  aug: 0.00,
  sep: 0.00,
  oct: 0.00,
  nov: 0.00,
  dec: 0.00,
};

export const EXCEL_CUSTOMERS_2026: MonthlyCustomerData[] = [
  {
    id: 1,
    code: '925',
    name: 'محمد عاطف جملة',
    trade_name: 'محمد عاطف جملة',
    phone: '01227488609',
    city: 'السويس',
    address: 'خلف مسجد الاربعين',
    balance: 0.00,
    assigned_employee_name: 'طارق خالد عبد الرحمن',
    months: { ...ZERO_MONTHS }
  },
  {
    id: 2,
    code: '659',
    name: 'ألبان مكه احمد ابراهيم',
    trade_name: 'ألبان مكه',
    phone: '01099887711',
    city: 'القاهرة',
    address: 'شارع شبرا الرئيسي',
    balance: 0.00,
    assigned_employee_name: 'علي محمد حسن',
    months: { ...ZERO_MONTHS }
  },
  {
    id: 3,
    code: '124',
    name: 'صالح 2',
    trade_name: 'صالح ستورز',
    phone: '01122334455',
    city: 'الجيزة',
    address: 'شارع فيصل الرئيسي',
    balance: 0.00,
    assigned_employee_name: 'أحمد محمود إبراهيم',
    months: { ...ZERO_MONTHS }
  },
  {
    id: 4,
    code: '1172',
    name: 'ماركت لاسرينا بالما بيتش',
    trade_name: 'لاسرينا بالما',
    phone: '01234567800',
    city: 'العين السخنة',
    address: 'قرية لاسرينا بالما بيتش',
    balance: 0.00,
    assigned_employee_name: 'طارق خالد عبد الرحمن',
    months: { ...ZERO_MONTHS }
  },
  {
    id: 5,
    code: '29',
    name: 'أبناء سوهاج',
    trade_name: 'ماركت أبناء سوهاج',
    phone: '01011223344',
    city: 'السويس',
    address: 'حي الأربعين',
    balance: 0.00,
    assigned_employee_name: 'علي محمد حسن',
    months: { ...ZERO_MONTHS }
  },
  {
    id: 6,
    code: '108',
    name: 'غريب الإيمان',
    trade_name: 'الإيمان ماركت',
    phone: '01299887766',
    city: 'السويس',
    address: 'شارع الجيش',
    balance: 0.00,
    assigned_employee_name: 'أحمد محمود إبراهيم',
    months: { ...ZERO_MONTHS }
  },
  {
    id: 7,
    code: '968',
    name: 'كشك الفهد النهضة',
    trade_name: 'الفهد ستور',
    phone: '01155443322',
    city: 'القاهرة',
    address: 'مدينة النهضة',
    balance: 0.00,
    assigned_employee_name: 'علي محمد حسن',
    months: { ...ZERO_MONTHS }
  },
  {
    id: 8,
    code: '1142',
    name: 'البركة السلام 1',
    trade_name: 'سوبرماركت البركة',
    phone: '01033445566',
    city: 'السويس',
    address: 'مدينة السلام 1',
    balance: 0.00,
    assigned_employee_name: 'طارق خالد عبد الرحمن',
    months: { ...ZERO_MONTHS }
  },
  {
    id: 9,
    code: '699',
    name: 'مقلة زمزم',
    trade_name: 'زمزم',
    phone: '01277665544',
    city: 'الإسماعيلية',
    address: 'حي الشيخ زايد',
    balance: 0.00,
    assigned_employee_name: 'أحمد محمود إبراهيم',
    months: { ...ZERO_MONTHS }
  },
  {
    id: 10,
    code: '76',
    name: 'مليكة ماركت',
    trade_name: 'مليكة',
    phone: '01144556677',
    city: 'السويس',
    address: 'شارع الشهداء',
    balance: 0.00,
    assigned_employee_name: 'علي محمد حسن',
    months: { ...ZERO_MONTHS }
  },
  {
    id: 11,
    code: '535',
    name: 'ماركت الجندي السخنه',
    trade_name: 'الجندي ماركت',
    phone: '01066778899',
    city: 'العين السخنة',
    address: 'طريق السويس السخنة',
    balance: 0.00,
    assigned_employee_name: 'طارق خالد عبد الرحمن',
    months: { ...ZERO_MONTHS }
  },
  {
    id: 12,
    code: '35',
    name: 'كشك كافا - الدالي الغريب',
    trade_name: 'كافا ستور',
    phone: '01211223399',
    city: 'السويس',
    address: 'الغريب - الدالي',
    balance: 0.00,
    assigned_employee_name: 'علي محمد حسن',
    months: { ...ZERO_MONTHS }
  },
  {
    id: 13,
    code: '47',
    name: 'الكويتي',
    trade_name: 'ماركت الكويتي',
    phone: '01088776655',
    city: 'السويس',
    address: 'شارع المدينة المنورة',
    balance: 0.00,
    assigned_employee_name: 'أحمد محمود إبراهيم',
    months: { ...ZERO_MONTHS }
  },
  {
    id: 14,
    code: '1061',
    name: 'عبده كفر احمد عبده',
    trade_name: 'عبده ماركت',
    phone: '01199001122',
    city: 'السويس',
    address: 'كفر احمد عبده القديم',
    balance: 0.00,
    assigned_employee_name: 'طارق خالد عبد الرحمن',
    months: { ...ZERO_MONTHS }
  },
  {
    id: 15,
    code: '380',
    name: 'مودي وتامر',
    trade_name: 'مودي وتامر ستور',
    phone: '01022334411',
    city: 'السويس',
    address: 'حي الأربعين',
    balance: 0.00,
    assigned_employee_name: 'علي محمد حسن',
    months: { ...ZERO_MONTHS }
  },
  {
    id: 16,
    code: '1182',
    name: 'كريم الاسيوطي',
    trade_name: 'ماركت الاسيوطي',
    phone: '01244556633',
    city: 'السويس',
    address: 'المثلث',
    balance: 0.00,
    assigned_employee_name: 'أحمد محمود إبراهيم',
    months: { ...ZERO_MONTHS }
  },
  {
    id: 17,
    code: '967',
    name: 'البركه الاربعين',
    trade_name: 'البركة ماركت',
    phone: '01166778800',
    city: 'السويس',
    address: 'شارع الغوري - الأربعين',
    balance: 0.00,
    assigned_employee_name: 'طارق خالد عبد الرحمن',
    months: { ...ZERO_MONTHS }
  },
  {
    id: 18,
    code: '633',
    name: 'ماركت بوبس 2',
    trade_name: 'بوبس ستورز',
    phone: '01011998877',
    city: 'السويس',
    address: 'شارع الجيش بجوار الاستاد',
    balance: 0.00,
    assigned_employee_name: 'علي محمد حسن',
    months: { ...ZERO_MONTHS }
  }
];
