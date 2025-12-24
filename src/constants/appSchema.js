/**
 * LFST Finance App - Application Schema & Architecture Map
 *
 * This file serves as the single source of truth for the application's
 * architecture, features, and data flow. It is used by the AppArchitecture
 * component to dynamically render the architecture documentation page.
 *
 * MAINTENANCE: When adding/modifying features, update this schema to keep
 * the architecture page accurate.
 */

export const appMetadata = {
  name: 'LFST Finance App',
  fullName: 'Lockridge Forest Swim & Tennis Club - Financial Management System',
  version: '1.0.0',
  purpose: 'Single-entry financial management system replacing manual Excel bookkeeping',
  fiscalYearCycle: 'October 1 - September 30',
  currentPhase: 'Phase 1: Core Financial Management (Complete)',
  deploymentStatus: 'Production on Firebase Hosting'
};

export const techStack = {
  frontend: [
    { name: 'React', version: '18.2.0', purpose: 'UI framework' },
    { name: 'Vite', version: '7.3.0', purpose: 'Build tool & dev server' },
    { name: 'Tailwind CSS', version: '3.4.1', purpose: 'Styling framework' },
    { name: 'Lucide React', version: '0.263.1', purpose: 'Icon library' }
  ],
  backend: [
    { name: 'Firebase Firestore', version: '12.7.0', purpose: 'Cloud NoSQL database' },
    { name: 'Firebase Hosting', version: '12.7.0', purpose: 'Static site hosting' },
    { name: 'Firebase Analytics', version: '12.7.0', purpose: 'Usage analytics' }
  ],
  utilities: [
    { name: 'date-fns', version: '2.30.0', purpose: 'Date manipulation' },
    { name: 'xlsx', version: '0.18.5', purpose: 'Excel import/export' }
  ],
  devTools: [
    { name: 'ESLint', purpose: 'Code linting' },
    { name: 'PostCSS', purpose: 'CSS processing' },
    { name: 'Autoprefixer', purpose: 'CSS vendor prefixes' }
  ]
};

export const coreEngines = [
  {
    name: 'Transaction Engine',
    files: ['src/services/storage.js', 'src/utils/helpers.js', 'src/components/TransactionModal.jsx'],
    dataFlow: {
      input: 'User creates transaction via TransactionModal',
      process: 'Validates → Writes to Firestore → Auto-updates balance',
      output: 'Updated transaction list + new balance + recalculated metrics'
    },
    keyFunctions: [
      'addTransaction()',
      'updateTransaction()',
      'deleteTransaction()',
      'updateBalance()'
    ]
  },
  {
    name: 'Budget Projection Engine',
    files: ['src/components/CashFlow.jsx', 'src/utils/helpers.js'],
    dataFlow: {
      input: 'Budget data + transactions + CAPEX projects',
      process: 'Calculates monthly: Budget - Actuals + Running Balance',
      output: '12-month cash flow projection with warnings'
    },
    keyFunctions: [
      'generateCashFlowProjections()',
      'calculateMonthlyActuals()',
      'checkBalanceWarnings()'
    ]
  },
  {
    name: 'Member Dues Calculation Engine',
    files: ['src/components/Members.jsx', 'src/utils/helpers.js'],
    dataFlow: {
      input: 'Member data (type, residence, status, discounts)',
      process: 'Base dues ($675) + fees - discounts',
      output: 'Calculated total dues per member'
    },
    keyFunctions: [
      'calculateDues()',
      'checkBylawCompliance()'
    ]
  },
  {
    name: 'Fiscal Year State Manager',
    files: ['src/App.jsx', 'src/services/storage.js'],
    dataFlow: {
      input: 'Selected fiscal year from dropdown',
      process: 'Filters all data by fiscalYear field in Firestore',
      output: 'Year-specific view of all data'
    },
    keyFunctions: [
      'handleFiscalYearChange()',
      'getAllTransactions()',
      'getAllMembers()'
    ]
  },
  {
    name: 'Year-End Rollover Engine',
    files: ['src/components/YearEndWizard.jsx', 'src/services/storage.js'],
    dataFlow: {
      input: 'Current year actuals + member roster',
      process: 'Archives current year → Creates next year budget from actuals → Rolls members forward',
      output: 'New fiscal year initialized with archived prior year'
    },
    keyFunctions: [
      'finalizeYearEnd()',
      'updateSettings()',
      'createBudgetFromActuals()'
    ]
  }
];

export const dataModels = {
  firestoreStructure: {
    path: 'clubs/{clubId}/',
    collections: [
      { name: 'settings/data', type: 'singleton', purpose: 'App configuration & fiscal year' },
      { name: 'balance/data', type: 'singleton', purpose: 'Current balance' },
      { name: 'members/{memberId}', type: 'collection', purpose: 'Member records by fiscal year' },
      { name: 'transactions/{transactionId}', type: 'collection', purpose: 'Transactions by fiscal year' },
      { name: 'services/{serviceId}', type: 'collection', purpose: 'Monthly recurring services' },
      { name: 'budgets/budget_{fiscalYear}', type: 'document', purpose: 'Annual budgets' },
      { name: 'capex/{projectId}', type: 'collection', purpose: 'CAPEX projects by fiscal year' }
    ]
  },
  schemas: [
    {
      name: 'Transaction',
      fields: {
        id: 'string (txn_timestamp)',
        type: 'revenue | expense',
        expenseType: 'OPEX | CAPEX | G&A (if expense)',
        category: 'string',
        description: 'string',
        amount: 'number',
        paymentMethod: 'string',
        checkNumber: 'string',
        date: 'YYYY-MM-DD',
        notes: 'string',
        fiscalYear: 'number',
        createdAt: 'ISO timestamp',
        createdBy: 'treasurer'
      }
    },
    {
      name: 'Member',
      fields: {
        id: 'string (member_timestamp)',
        name: 'string',
        type: 'New | Return',
        residence: 'Inside | Outside',
        address: 'string',
        status: 'Family | Single/Senior',
        dues: 'object { baseDues, additionalFees[], discounts[], customDiscounts[] }',
        datePaid: 'YYYY-MM-DD | null',
        paymentMethod: 'string',
        checkNumber: 'string',
        fiscalYear: 'number',
        createdAt: 'ISO timestamp'
      }
    },
    {
      name: 'Budget',
      fields: {
        id: 'budget_fy{year}',
        fiscalYear: 'number',
        startingBalance: 'number',
        lowBalanceThreshold: 'number',
        monthlyBudgets: 'array[12] { month, monthName, revenue, opex, capex, ga, notes }'
      }
    },
    {
      name: 'CAPEX Project',
      fields: {
        id: 'capex_timestamp',
        fiscalYear: 'number',
        name: 'string',
        description: 'string',
        amount: 'number',
        month: '0-11 (Oct=0, Sep=11)',
        completed: 'boolean',
        completedDate: 'ISO timestamp',
        actualAmount: 'number',
        installDate: 'YYYY-MM-DD',
        depreciationYears: 'number'
      }
    },
    {
      name: 'Settings',
      fields: {
        fiscalYear: 'number (current year)',
        startDate: 'YYYY-MM-DD',
        clubName: 'string',
        lastModified: 'ISO timestamp',
        archivedYears: 'array of numbers'
      }
    }
  ]
};

export const components = [
  {
    name: 'App.jsx',
    category: 'Core',
    path: 'src/App.jsx',
    purpose: 'Main container with navigation, header, fiscal year selector, and view routing',
    stateManaged: ['settings', 'balance', 'members', 'transactions', 'services', 'activeView', 'selectedFiscalYear'],
    dependencies: ['All child components', 'storage.js', 'firebaseConfig.js'],
    userFacing: true
  },
  {
    name: 'Dashboard',
    category: 'Analytics',
    path: 'src/components/Dashboard.jsx',
    purpose: 'Real-time financial metrics, bylaw compliance, budget performance, CAPEX alerts',
    dataFlow: 'Receives: transactions, members, budget, settings → Calculates: current balance, YTD revenue, projections → Displays: metrics cards, alerts',
    features: ['Current balance', 'Total members count', 'YTD revenue', 'Projected year-end', 'Bylaw compliance (50% outside limit)', 'Budget performance YTD', 'CAPEX depreciation alerts', 'Action items'],
    userFacing: true
  },
  {
    name: 'CashFlow',
    category: 'Financial',
    path: 'src/components/CashFlow.jsx',
    purpose: 'Monthly cash flow projections (budget vs actual)',
    dataFlow: 'Receives: budget, transactions, CAPEX → Calculates: monthly actuals, running balance → Displays: 12-month projection table',
    features: ['Budget vs Actual comparison', 'Running balance', 'Color-coded variances', 'Low balance warnings', 'Month close functionality', 'Budget refresh from prior year', 'Integration with Budget Editor and CAPEX Manager'],
    userFacing: true
  },
  {
    name: 'BudgetEditor',
    category: 'Financial',
    path: 'src/components/BudgetEditor.jsx',
    purpose: 'Create/edit fiscal year budgets',
    dataFlow: 'Input: monthly revenue, OPEX, CAPEX, G&A → Process: validates, calculates projections → Output: saves budget to Firestore',
    features: ['Monthly budget planning', 'Starting balance setting', 'Low-balance threshold', 'Year-end balance projection', 'CAPEX integration'],
    userFacing: true
  },
  {
    name: 'Transactions',
    category: 'Financial',
    path: 'src/components/Transactions.jsx',
    purpose: 'Transaction history with search/filter',
    dataFlow: 'Input: search/filter criteria → Process: filters transaction list → Output: displays filtered transactions',
    features: ['Transaction history', 'Search by description', 'Filter by type/category', 'Edit/delete transactions', 'Category-based filtering (Revenue, OPEX, CAPEX, G&A)'],
    userFacing: true
  },
  {
    name: 'TransactionModal',
    category: 'Financial',
    path: 'src/components/TransactionModal.jsx',
    purpose: 'Add/edit transaction dialog',
    dataFlow: 'Input: transaction details → Validates: required fields, amount → Output: creates/updates transaction + balance',
    features: ['Revenue/Expense type selection', 'Category selection with subcategories', 'Custom categories', 'Payment method tracking', 'Check number recording', 'Notes field'],
    userFacing: true
  },
  {
    name: 'Members',
    category: 'Membership',
    path: 'src/components/Members.jsx',
    purpose: 'Member roster management with dues calculation',
    dataFlow: 'Input: member data → Calculates: dues with fees/discounts → Output: member roster with payment tracking',
    features: ['Add/edit members', 'Inside/Outside neighborhood tracking', 'Bylaw compliance monitoring', 'Payment status tracking', 'Dues calculation (base + fees - discounts)', 'Custom discounts with approval', 'Payment recording'],
    userFacing: true
  },
  {
    name: 'YearEndWizard',
    category: 'Operations',
    path: 'src/components/YearEndWizard.jsx',
    purpose: '3-step wizard for fiscal year rollover',
    dataFlow: 'Step 1: Review actuals → Step 2: Create next year budget → Step 3: Archive & activate new year',
    features: ['Review current year actuals', 'Generate next year budget from actuals', 'Archive current year', 'Roll forward members with reset payment status', 'Update fiscal year settings'],
    userFacing: true
  },
  {
    name: 'CapexManager',
    category: 'Planning',
    path: 'src/components/CapexManager.jsx',
    purpose: 'Capital expenditure planning with depreciation tracking',
    dataFlow: 'Input: project details → Process: plans by month → Output: CAPEX schedule with depreciation alerts',
    features: ['Plan CAPEX projects by month', 'Track depreciation schedules', 'Mark completed with actual amounts', 'Installation date tracking', 'Useful life management', 'Alerts for aging assets'],
    userFacing: true
  },
  {
    name: 'MonthlyServices',
    category: 'Operations',
    path: 'src/components/MonthlyServices.jsx',
    purpose: 'Recurring expense tracking',
    dataFlow: 'Input: service details → Output: monthly recurring services list',
    features: ['Track recurring expenses', 'Monthly service management', 'Vendor tracking'],
    userFacing: true
  },
  {
    name: 'Reports',
    category: 'Analytics',
    path: 'src/components/Reports.jsx',
    purpose: 'Data export and report generation',
    dataFlow: 'Input: report type selection → Output: JSON/Excel export',
    features: ['Data export to JSON', 'Report generation'],
    userFacing: true
  },
  {
    name: 'ProfitLoss',
    category: 'Analytics',
    path: 'src/components/ProfitLoss.jsx',
    purpose: 'P&L statement generation',
    dataFlow: 'Input: transactions → Calculates: revenue - expenses by category → Output: P&L statement',
    features: ['Revenue summary', 'Expense breakdown by category', 'Net income calculation'],
    userFacing: true
  },
  {
    name: 'YearEndReport',
    category: 'Analytics',
    path: 'src/components/YearEndReport.jsx',
    purpose: 'Comprehensive year-end financial reports',
    dataFlow: 'Input: full year data → Output: comprehensive year-end report',
    features: ['Annual summary', 'Year-end financial position'],
    userFacing: true
  },
  {
    name: 'ImportData',
    category: 'Utilities',
    path: 'src/components/ImportData.jsx',
    purpose: 'Import/export JSON data for backup/restore',
    dataFlow: 'Import: JSON file → validates → writes to Firestore | Export: reads Firestore → generates JSON',
    features: ['JSON data import', 'JSON data export', 'Data backup/restore'],
    userFacing: true
  }
];

export const services = [
  {
    name: 'Storage Service',
    path: 'src/services/storage.js',
    purpose: 'Abstraction layer over Firestore for all CRUD operations',
    functions: [
      { name: 'initializeDefaults()', purpose: 'Initialize default settings and balance' },
      { name: 'getSettings()', purpose: 'Fetch app settings including fiscal year' },
      { name: 'updateSettings()', purpose: 'Update app settings' },
      { name: 'getBalance()', purpose: 'Get current balance' },
      { name: 'updateBalance()', purpose: 'Update current balance' },
      { name: 'addTransaction()', purpose: 'Create new transaction and update balance' },
      { name: 'updateTransaction()', purpose: 'Update existing transaction and balance' },
      { name: 'deleteTransaction()', purpose: 'Delete transaction and revert balance' },
      { name: 'getAllTransactions()', purpose: 'Get all transactions for fiscal year' },
      { name: 'addMember()', purpose: 'Create new member' },
      { name: 'updateMember()', purpose: 'Update member details' },
      { name: 'deleteMember()', purpose: 'Delete member' },
      { name: 'getAllMembers()', purpose: 'Get all members for fiscal year' },
      { name: 'saveBudget()', purpose: 'Save/update budget for fiscal year' },
      { name: 'getBudget()', purpose: 'Get budget for fiscal year' },
      { name: 'addCapexProject()', purpose: 'Create CAPEX project' },
      { name: 'updateCapexProject()', purpose: 'Update CAPEX project' },
      { name: 'deleteCapexProject()', purpose: 'Delete CAPEX project' },
      { name: 'getAllCapex()', purpose: 'Get all CAPEX projects for fiscal year' },
      { name: 'addService()', purpose: 'Create monthly service' },
      { name: 'updateService()', purpose: 'Update service' },
      { name: 'deleteService()', purpose: 'Delete service' },
      { name: 'getAllServices()', purpose: 'Get all services' },
      { name: 'getStatistics()', purpose: 'Get app statistics' },
      { name: 'exportAllData()', purpose: 'Export all data as JSON' },
      { name: 'importData()', purpose: 'Import data from JSON' }
    ],
    integrations: ['Firebase Firestore']
  },
  {
    name: 'Helpers Utility',
    path: 'src/utils/helpers.js',
    purpose: 'Helper functions for calculations and formatting',
    functions: [
      { name: 'formatCurrency()', purpose: 'Format number as USD currency' },
      { name: 'formatDate()', purpose: 'Format date as MM/DD/YYYY' },
      { name: 'calculateDues()', purpose: 'Calculate member dues with fees/discounts' },
      { name: 'checkBylawCompliance()', purpose: 'Check 50% outside member limit' },
      { name: 'calculateMonthlyActuals()', purpose: 'Calculate actual revenue/expenses by month' },
      { name: 'generateCashFlowProjections()', purpose: 'Generate 12-month cash flow projections' },
      { name: 'calculateBudgetPerformance()', purpose: 'Calculate budget vs actual variance' },
      { name: 'checkBalanceWarnings()', purpose: 'Check for low balance warnings' },
      { name: 'getFiscalMonthName()', purpose: 'Convert fiscal month to calendar month name' },
      { name: 'getCalendarDate()', purpose: 'Get calendar date from fiscal month' }
    ],
    integrations: ['date-fns']
  }
];

export const dataFlow = {
  overview: 'Unidirectional data flow from Firebase Firestore to React components with local state management',
  steps: [
    {
      step: 1,
      name: 'User Interaction',
      description: 'User interacts with UI component (e.g., clicks Add Transaction)',
      components: ['All user-facing components']
    },
    {
      step: 2,
      name: 'Component Handler',
      description: 'Component calls handler function (e.g., handleAddTransaction)',
      components: ['TransactionModal', 'Members', 'BudgetEditor', 'Other components']
    },
    {
      step: 3,
      name: 'Storage Service Call',
      description: 'Handler calls storage service function',
      components: ['storage.js']
    },
    {
      step: 4,
      name: 'Firestore Mutation',
      description: 'Storage service writes to Firestore using Firebase SDK',
      components: ['Firebase Firestore']
    },
    {
      step: 5,
      name: 'Data Refresh',
      description: 'Component re-fetches data from Firestore to update UI',
      components: ['App.jsx', 'Dashboard', 'CashFlow', 'Other components']
    },
    {
      step: 6,
      name: 'Calculation & Display',
      description: 'Helper functions calculate derived metrics, component renders updated data',
      components: ['helpers.js', 'All display components']
    }
  ],
  stateManagement: {
    pattern: 'Local component state with React hooks (useState, useEffect)',
    noGlobalState: 'No Redux/Context - state passed via props from App.jsx',
    sourceOfTruth: 'Firebase Firestore acts as the single source of truth',
    dataLoading: 'Components fetch data on mount and after mutations'
  }
};

export const features = [
  {
    name: 'Transaction Tracking',
    category: 'Financial Management',
    description: 'Single-entry bookkeeping with automatic balance updates',
    components: ['Transactions', 'TransactionModal', 'Dashboard'],
    capabilities: [
      'Revenue and expense tracking',
      'Categorized by OPEX, CAPEX, G&A',
      'Payment method tracking',
      'Check number recording',
      'Custom categories',
      'Full audit trail with timestamps'
    ]
  },
  {
    name: 'Budget Management',
    category: 'Financial Management',
    description: 'Monthly budget creation with performance tracking',
    components: ['BudgetEditor', 'CashFlow', 'Dashboard'],
    capabilities: [
      'Monthly budget allocation',
      'Budget vs Actual comparison',
      'Cash flow projections',
      'Low balance warnings',
      'Year-end projections',
      'Budget refresh from prior year'
    ]
  },
  {
    name: 'Cash Flow Projections',
    category: 'Financial Management',
    description: '12-month cash flow analysis with running balance',
    components: ['CashFlow'],
    capabilities: [
      '12-month projection table',
      'Color-coded variances',
      'Current month highlighting',
      'Balance warnings',
      'Month close functionality'
    ]
  },
  {
    name: 'Member Management',
    category: 'Membership',
    description: 'Complete member roster with dues calculation',
    components: ['Members'],
    capabilities: [
      'Add/edit member profiles',
      'Inside/Outside neighborhood tracking',
      'Bylaw compliance monitoring (50% outside limit)',
      'Payment status tracking',
      'Automatic dues calculation',
      'Custom discounts with approval',
      'New member initiation fees',
      'Early bird discounts'
    ]
  },
  {
    name: 'CAPEX Planning',
    category: 'Planning',
    description: 'Capital expenditure planning with depreciation tracking',
    components: ['CapexManager'],
    capabilities: [
      'Project planning by month',
      'Budget allocation',
      'Completion tracking',
      'Actual amount recording',
      'Depreciation schedule tracking',
      'Asset aging alerts (< 1 year critical, < 2 years warning)'
    ]
  },
  {
    name: 'Year-End Operations',
    category: 'Operations',
    description: 'Fiscal year rollover with data archiving',
    components: ['YearEndWizard'],
    capabilities: [
      'Review current year actuals',
      'Generate next year budget from actuals',
      'Archive current year data',
      'Roll forward members with reset payment status',
      'Update fiscal year settings'
    ]
  },
  {
    name: 'Financial Reporting',
    category: 'Analytics',
    description: 'Comprehensive financial reports and exports',
    components: ['Dashboard', 'ProfitLoss', 'YearEndReport', 'Reports'],
    capabilities: [
      'Real-time dashboard metrics',
      'P&L statements',
      'Year-end reports',
      'Budget performance analysis',
      'Data export to JSON'
    ]
  },
  {
    name: 'Compliance Monitoring',
    category: 'Analytics',
    description: 'Bylaw compliance tracking',
    components: ['Dashboard', 'Members'],
    capabilities: [
      '50% outside member limit monitoring',
      'Visual progress indicators',
      'Automatic calculations',
      'Member distribution breakdown'
    ]
  },
  {
    name: 'Data Management',
    category: 'Utilities',
    description: 'Import/export for backup and restore',
    components: ['ImportData'],
    capabilities: [
      'JSON data export',
      'JSON data import',
      'Data backup/restore',
      'Archived year access via fiscal year selector'
    ]
  }
];

export const roadmap = {
  completed: {
    phase: 'Phase 1',
    name: 'Core Financial Management',
    status: 'Complete',
    features: [
      'Transaction tracking',
      'Budget management',
      'Cash flow projections',
      'Member management',
      'CAPEX planning',
      'Year-end operations',
      'Firebase deployment'
    ]
  },
  upcoming: [
    {
      phase: 'Phase 2',
      name: 'User Authentication & Roles',
      status: 'Planned',
      features: [
        'User authentication',
        'Treasurer role (full edit access)',
        'Board member role (view-only access)',
        'Firestore security rules implementation'
      ]
    },
    {
      phase: 'Phase 3',
      name: 'Automated Reporting',
      status: 'Planned',
      features: [
        'Automated email reports to board',
        'Scheduled report generation',
        'PDF export for reports'
      ]
    },
    {
      phase: 'Phase 4',
      name: 'Public Transparency',
      status: 'Planned',
      features: [
        'Public-facing website integration',
        'Read-only financial transparency page',
        'Member portal'
      ]
    },
    {
      phase: 'Phase 5',
      name: 'Excel Integration',
      status: 'Planned',
      features: [
        'Excel import for member data',
        'Excel export for reports',
        'Template-based imports'
      ]
    }
  ]
};

export const securityConsiderations = {
  current: {
    authentication: 'None (open access for testing)',
    firestoreRules: 'Wide open (allow read, write: if true)',
    dataValidation: 'Client-side only'
  },
  planned: {
    authentication: 'Firebase Authentication',
    roles: ['Treasurer (full access)', 'Board Member (read-only)'],
    firestoreRules: 'Role-based access control',
    dataValidation: 'Both client and server-side validation'
  },
  todos: [
    'Implement Firebase Authentication',
    'Create role-based Firestore security rules',
    'Add server-side validation',
    'Implement audit logging for sensitive operations',
    'Add multi-factor authentication for treasurer role'
  ]
};

export default {
  metadata: appMetadata,
  techStack,
  coreEngines,
  dataModels,
  components,
  services,
  dataFlow,
  features,
  roadmap,
  security: securityConsiderations
};
