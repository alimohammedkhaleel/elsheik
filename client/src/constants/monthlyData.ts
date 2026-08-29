export interface MonthlyCustomer {
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

export const MONTH_KEYS = [
  'jan', 'feb', 'mar', 'apr', 'may', 'jun',
  'jul', 'aug', 'sep', 'oct', 'nov', 'dec'
] as const;

export type MonthKey = typeof MONTH_KEYS[number];

export const MONTH_NAMES_AR = [
  'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
  'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
];

export const EXCEL_CUSTOMERS_2026: MonthlyCustomer[] = [
  {
    id: 1,
    code: '925',
    name: 'محمد عاطف جملة',
    trade_name: 'محمد عاطف جملة',
    phone: '01012345678',
    city: 'السويس',
    address: 'شارع الجيش - حي الأربعين',
    balance: 249622.00,
    assigned_employee_name: 'علي محمد حسن',
    months: { jan: 558112.00, feb: 530062.00, mar: 612948.00, apr: 752831.00, may: 639476.00, jun: 693709.00, jul: 721125.00, aug: 0.00, sep: 0, oct: 0, nov: 0, dec: 0 }
  },
  {
    id: 2,
    code: '659',
    name: 'ألبان مكه احمد ابراهيم',
    trade_name: 'ألبان مكه',
    phone: '01099887711',
    city: 'القاهرة',
    address: 'شارع شبرا الرئيسي',
    balance: 175938.00,
    assigned_employee_name: 'علي محمد حسن',
    months: { jan: 933606.00, feb: 1257947.00, mar: 582505.00, apr: 91970.00, may: 475408.00, jun: 185370.00, jul: 0.00, aug: 8392.00, sep: 0, oct: 0, nov: 0, dec: 0 }
  },
  {
    id: 3,
    code: '124',
    name: 'صالح 2',
    trade_name: 'صالح ستورز',
    phone: '01122334455',
    city: 'الجيزة',
    address: 'شارع فيصل الرئيسي',
    balance: 126500.00,
    assigned_employee_name: 'أحمد محمود إبراهيم',
    months: { jan: 77895.00, feb: 152477.00, mar: 133470.00, apr: 169443.00, may: 113666.00, jun: 169183.00, jul: 120155.00, aug: 313724.00, sep: 0, oct: 0, nov: 0, dec: 0 }
  },
  {
    id: 4,
    code: '1172',
    name: 'ماركت لاسرينا بالما بيتش',
    trade_name: 'لاسرينا بالما',
    phone: '01234567800',
    city: 'العين السخنة',
    address: 'قرية لاسرينا بالما بيتش',
    balance: 95479.50,
    assigned_employee_name: 'طارق خالد عبد الرحمن',
    months: { jan: 0.00, feb: 0.00, mar: 0.00, apr: 0.00, may: 0.00, jun: 165705.00, jul: 359209.00, aug: 335217.00, sep: 0, oct: 0, nov: 0, dec: 0 }
  },
  {
    id: 5,
    code: '29',
    name: 'أبناء سوهاج',
    trade_name: 'ماركت أبناء سوهاج',
    phone: '01011223344',
    city: 'السويس',
    address: 'حي الأربعين',
    balance: 79705.00,
    assigned_employee_name: 'علي محمد حسن',
    months: { jan: 208720.00, feb: 121960.00, mar: 157570.00, apr: 224277.00, may: 191283.00, jun: 160826.00, jul: 272545.00, aug: 249180.00, sep: 0, oct: 0, nov: 0, dec: 0 }
  },
  {
    id: 6,
    code: '108',
    name: 'غريب الإيمان',
    trade_name: 'الإيمان ماركت',
    phone: '01299887766',
    city: 'السويس',
    address: 'شارع الجيش',
    balance: 79276.50,
    assigned_employee_name: 'أحمد محمود إبراهيم',
    months: { jan: 176684.00, feb: 133474.00, mar: 213708.00, apr: 200692.00, may: 187703.00, jun: 195198.00, jul: 232910.00, aug: 265688.00, sep: 0, oct: 0, nov: 0, dec: 0 }
  },
  {
    id: 7,
    code: '968',
    name: 'كشك الفهد النهضة',
    trade_name: 'الفهد ستور',
    phone: '01155443322',
    city: 'القاهرة',
    address: 'مدينة النهضة',
    balance: 73204.50,
    assigned_employee_name: 'علي محمد حسن',
    months: { jan: 101861.00, feb: 71377.00, mar: 175026.00, apr: 153952.00, may: 165032.00, jun: 158000.00, jul: 152353.00, aug: 97852.00, sep: 0, oct: 0, nov: 0, dec: 0 }
  },
  {
    id: 8,
    code: '1142',
    name: 'البركة السلام 1',
    trade_name: 'سوبرماركت البركة',
    phone: '01033445566',
    city: 'السويس',
    address: 'مدينة السلام 1',
    balance: 73120.00,
    assigned_employee_name: 'طارق خالد عبد الرحمن',
    months: { jan: 0.00, feb: 0.00, mar: 72867.00, apr: 0.00, may: 95068.00, jun: 128087.00, jul: 233971.00, aug: 73120.00, sep: 0, oct: 0, nov: 0, dec: 0 }
  },
  {
    id: 9,
    code: '699',
    name: 'مقلة زمزم',
    trade_name: 'زمزم',
    phone: '01277665544',
    city: 'الإسماعيلية',
    address: 'حي الشيخ زايد',
    balance: 66585.00,
    assigned_employee_name: 'أحمد محمود إبراهيم',
    months: { jan: 6420.00, feb: 76200.00, mar: 143174.00, apr: 99135.00, may: 38480.00, jun: 80350.00, jul: 150865.00, aug: 0.00, sep: 0, oct: 0, nov: 0, dec: 0 }
  },
  {
    id: 10,
    code: '76',
    name: 'مليكة ماركت',
    trade_name: 'مليكة',
    phone: '01144556677',
    city: 'السويس',
    address: 'شارع الشهداء',
    balance: 64515.50,
    assigned_employee_name: 'علي محمد حسن',
    months: { jan: 69456.00, feb: 71827.00, mar: 69952.00, apr: 81436.00, may: 105021.00, jun: 76472.00, jul: 127964.00, aug: 71596.00, sep: 0, oct: 0, nov: 0, dec: 0 }
  },
  {
    id: 11,
    code: '535',
    name: 'ماركت الجندي السخنه',
    trade_name: 'الجندي ماركت',
    phone: '01066778899',
    city: 'العين السخنة',
    address: 'طريق السويس السخنة',
    balance: 63530.00,
    assigned_employee_name: 'طارق خالد عبد الرحمن',
    months: { jan: 0.00, feb: 0.00, mar: 34044.00, apr: 61266.00, may: 196015.00, jun: 327052.00, jul: 281984.00, aug: 158774.00, sep: 0, oct: 0, nov: 0, dec: 0 }
  },
  {
    id: 12,
    code: '35',
    name: 'كشك كافا - الدالي الغريب',
    trade_name: 'كافا ستور',
    phone: '01211223399',
    city: 'السويس',
    address: 'الغريب - الدالي',
    balance: 61257.25,
    assigned_employee_name: 'علي محمد حسن',
    months: { jan: 214243.00, feb: 202588.00, mar: 216398.00, apr: 276810.00, may: 298040.00, jun: 262399.00, jul: 311315.00, aug: 284797.00, sep: 0, oct: 0, nov: 0, dec: 0 }
  },
  {
    id: 13,
    code: '47',
    name: 'الكويتي',
    trade_name: 'ماركت الكويتي',
    phone: '01088776655',
    city: 'السويس',
    address: 'شارع المدينة المنورة',
    balance: 60000.00,
    assigned_employee_name: 'أحمد محمود إبراهيم',
    months: { jan: 63737.00, feb: 117784.00, mar: 102334.00, apr: 162316.00, may: 83072.00, jun: 90659.00, jul: 137701.00, aug: 96819.00, sep: 0, oct: 0, nov: 0, dec: 0 }
  },
  {
    id: 14,
    code: '1061',
    name: 'عبده كفر احمد عبده',
    trade_name: 'عبده ماركت',
    phone: '01199001122',
    city: 'السويس',
    address: 'كفر احمد عبده القديم',
    balance: 59487.00,
    assigned_employee_name: 'طارق خالد عبد الرحمن',
    months: { jan: 57028.00, feb: 45387.00, mar: 63955.00, apr: 89820.00, may: 23080.00, jun: 104587.00, jul: 81237.00, aug: 97217.00, sep: 0, oct: 0, nov: 0, dec: 0 }
  },
  {
    id: 15,
    code: '380',
    name: 'مودي وتامر',
    trade_name: 'مودي وتامر ستور',
    phone: '01022334411',
    city: 'السويس',
    address: 'حي الأربعين',
    balance: 57684.00,
    assigned_employee_name: 'علي محمد حسن',
    months: { jan: 0.00, feb: 0.00, mar: 0.00, apr: 0.00, may: 0.00, jun: 0.00, jul: 0.00, aug: 0.00, sep: 0, oct: 0, nov: 0, dec: 0 }
  },
  {
    id: 16,
    code: '1182',
    name: 'كريم الاسيوطي',
    trade_name: 'ماركت الاسيوطي',
    phone: '01244556633',
    city: 'السويس',
    address: 'المثلث',
    balance: 54730.00,
    assigned_employee_name: 'أحمد محمود إبراهيم',
    months: { jan: 0.00, feb: 0.00, mar: 0.00, apr: 0.00, may: 0.00, jun: 121185.00, jul: 54760.00, aug: 48230.00, sep: 0, oct: 0, nov: 0, dec: 0 }
  },
  {
    id: 17,
    code: '967',
    name: 'البركه الاربعين',
    trade_name: 'البركة ماركت',
    phone: '01166778800',
    city: 'السويس',
    address: 'شارع الغوري - الأربعين',
    balance: 51943.50,
    assigned_employee_name: 'طارق خالد عبد الرحمن',
    months: { jan: 91752.00, feb: 131421.00, mar: 100286.00, apr: 154685.00, may: 148267.00, jun: 96838.00, jul: 128619.00, aug: 170526.00, sep: 0, oct: 0, nov: 0, dec: 0 }
  },
  {
    id: 18,
    code: '633',
    name: 'ماركت بوبس 2',
    trade_name: 'بوبس ستورز',
    phone: '01011998877',
    city: 'السويس',
    address: 'شارع الجيش بجوار الاستاد',
    balance: 50000.00,
    assigned_employee_name: 'علي محمد حسن',
    months: { jan: 170430.00, feb: 123612.00, mar: 153655.00, apr: 193756.00, may: 279399.00, jun: 206301.00, jul: 203981.00, aug: 248271.00, sep: 0, oct: 0, nov: 0, dec: 0 }
  }
];
