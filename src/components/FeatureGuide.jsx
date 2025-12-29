import React, { useState } from 'react';
import {
  X, BookOpen, DollarSign, Users, BarChart3, FileText, Calendar,
  TrendingUp, Wrench, Building2, AlertCircle, CheckCircle, Info, Lock
} from 'lucide-react';

function FeatureGuide({ onClose }) {
  const [activeSection, setActiveSection] = useState('overview');

  const sections = [
    {
      id: 'overview',
      title: 'Overview',
      icon: BookOpen,
      content: (
        <div className="space-y-6">
          <div>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-4">Welcome to LFST Finance Manager</h3>
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed mb-4">
              This application helps Lockridge Forest Swim & Tennis Club manage finances, track members,
              budget expenses, and plan for capital improvements. It's designed for club treasurers to
              maintain accurate financial records and provide transparency to club members.
            </p>
            <div className="bg-blue-50 dark:bg-blue-900/40 border-2 border-blue-200 dark:border-blue-700/50 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-900 dark:text-blue-100">
                  <p className="font-semibold mb-1">Fiscal Year</p>
                  <p>The club operates on a fiscal year running from October 1 to September 30.
                  All financial reporting and budgeting follows this schedule.</p>
                </div>
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-3">Dark Mode</h4>
            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-4">
              <p className="text-sm text-slate-700 dark:text-slate-300 mb-2">
                The application includes a dark mode theme for comfortable viewing in low-light environments.
              </p>
              <ul className="text-sm text-slate-700 dark:text-slate-300 space-y-1 ml-4 list-disc">
                <li>Click the Moon/Sun icon button in the header to toggle between light and dark modes</li>
                <li>Your preference is saved automatically and persists across sessions</li>
                <li>All screens and components adapt to your selected theme</li>
              </ul>
            </div>
          </div>

          <div>
            <h4 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-3">Key Concepts</h4>
            <div className="space-y-3">
              <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-4">
                <h5 className="font-semibold text-slate-900 dark:text-slate-100 mb-1">OPEX (Operating Expenses)</h5>
                <p className="text-sm text-slate-700 dark:text-slate-300">Day-to-day operational costs like utilities, pool management,
                landscaping. These roll over to the next year's budget based on actual spending.</p>
              </div>
              <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-4">
                <h5 className="font-semibold text-slate-900 dark:text-slate-100 mb-1">Major Maintenance (Major OPEX)</h5>
                <p className="text-sm text-slate-700 dark:text-slate-300">Large, recurring projects like pool resurfacing or deck replacement.
                These are tracked separately and do NOT roll over to next year's budget as they're one-time expenses.</p>
              </div>
              <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-4">
                <h5 className="font-semibold text-slate-900 dark:text-slate-100 mb-1">CAPEX (Capital Expenditures)</h5>
                <p className="text-sm text-slate-700 dark:text-slate-300">New assets or major improvements that add value, like new equipment
                or facility upgrades. These don't roll over to the next year's budget.</p>
              </div>
              <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-4">
                <h5 className="font-semibold text-slate-900 dark:text-slate-100 mb-1">G&A (General & Administrative)</h5>
                <p className="text-sm text-slate-700 dark:text-slate-300">Administrative costs like insurance, legal fees, and accounting services.</p>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'dashboard',
      title: 'Dashboard',
      icon: TrendingUp,
      content: (
        <div className="space-y-6">
          <div>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-4">Dashboard Overview</h3>
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed mb-4">
              The dashboard provides a real-time snapshot of your financial health and key metrics.
            </p>
          </div>

          <div>
            <h4 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-3">Metric Cards</h4>
            <div className="space-y-3">
              <div className="bg-emerald-50 dark:bg-emerald-900/40 border border-emerald-200 dark:border-emerald-700/50 rounded-lg p-4">
                <h5 className="font-semibold text-emerald-900 dark:text-emerald-100 mb-1">Current Balance</h5>
                <p className="text-sm text-emerald-800 dark:text-emerald-200">Shows the club's available cash. Updates in real-time as
                transactions are added.</p>
              </div>
              <div className="bg-blue-50 dark:bg-blue-900/40 border border-blue-200 dark:border-blue-700/50 rounded-lg p-4">
                <h5 className="font-semibold text-blue-900 dark:text-blue-100 mb-1">Total Revenue / Total Expenses</h5>
                <p className="text-sm text-blue-800 dark:text-blue-200">Year-to-date totals for all income and spending.</p>
              </div>
              <div className="bg-purple-50 dark:bg-purple-900/40 border border-purple-200 dark:border-purple-700/50 rounded-lg p-4">
                <h5 className="font-semibold text-purple-900 dark:text-purple-100 mb-1">Net Income</h5>
                <p className="text-sm text-purple-800 dark:text-purple-200">Revenue minus expenses. Green means profit, red means loss.</p>
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-3">Quick Actions</h4>
            <ul className="space-y-2 text-sm text-slate-700 dark:text-slate-300">
              <li className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                <span><strong>+ Transaction:</strong> Record new income or expenses</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                <span><strong>+ Member:</strong> Add new members or update membership status</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                <span><strong>Manage Projects:</strong> Plan CAPEX projects and major maintenance</span>
              </li>
            </ul>
          </div>
        </div>
      )
    },
    {
      id: 'members',
      title: 'Members',
      icon: Users,
      content: (
        <div className="space-y-6">
          <div>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-4">Member Management</h3>
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed mb-4">
              Track membership, dues payments, and contact information.
            </p>
          </div>

          <div>
            <h4 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-3">Adding Members</h4>
            <ol className="space-y-2 text-sm text-slate-700 dark:text-slate-300 list-decimal list-inside">
              <li>Click the "+ Add Member" button</li>
              <li>Enter member details (name, address, lot number, membership type)</li>
              <li>Set the annual dues amount</li>
              <li>If paid, record payment date, method, and check number</li>
              <li>Click "Save Member"</li>
            </ol>
          </div>

          <div>
            <h4 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-3">Payment Tracking</h4>
            <div className="bg-blue-50 dark:bg-blue-900/40 border border-blue-200 dark:border-blue-700/50 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-900 dark:text-blue-100">
                  <p className="font-semibold mb-1">Automatic Transaction Creation</p>
                  <p>When you mark a member as paid, the system automatically creates a revenue transaction
                  for the dues amount. This keeps your books balanced without double entry.</p>
                </div>
              </div>
            </div>
          </div>

        </div>
      )
    },
    {
      id: 'transactions',
      title: 'Transactions',
      icon: FileText,
      content: (
        <div className="space-y-6">
          <div>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-4">Recording Transactions</h3>
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed mb-4">
              All money in and out must be recorded as transactions to maintain accurate financial records.
            </p>
          </div>

          <div>
            <h4 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-3">Adding a Transaction</h4>
            <ol className="space-y-2 text-sm text-slate-700 dark:text-slate-300 list-decimal list-inside">
              <li>Click "+ Transaction" button</li>
              <li>Select transaction type (Revenue or Expense)</li>
              <li>For expenses, choose the expense type (OPEX, CAPEX, or G&A)</li>
              <li>Select or create a category</li>
              <li>Enter description and amount</li>
              <li>Select payment method and enter check number if applicable</li>
              <li>Set the transaction date</li>
              <li>Click "Save Transaction"</li>
            </ol>
          </div>

          <div>
            <h4 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-3">Linking to CAPEX or Major Maintenance</h4>
            <div className="space-y-3">
              <div className="bg-purple-50 dark:bg-purple-900/40 border border-purple-200 dark:border-purple-700/50 rounded-lg p-4">
                <h5 className="font-semibold text-purple-900 dark:text-purple-100 mb-2">CAPEX Projects</h5>
                <p className="text-sm text-purple-800 dark:text-purple-200 mb-2">When recording a CAPEX expense, you can link it to a
                planned project:</p>
                <ol className="text-sm text-purple-800 dark:text-purple-200 list-decimal list-inside space-y-1 ml-3">
                  <li>Select expense type "CAPEX"</li>
                  <li>Choose the project from the "Link to CAPEX Project" dropdown</li>
                  <li>If this is the final payment, check "Mark this project as complete"</li>
                  <li>The project will track all linked transactions and show the total spent</li>
                </ol>
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/40 border border-blue-200 dark:border-blue-700/50 rounded-lg p-4">
                <h5 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">Major Maintenance Items</h5>
                <p className="text-sm text-blue-800 dark:text-blue-200 mb-2">For large recurring maintenance:</p>
                <ol className="text-sm text-blue-800 dark:text-blue-200 list-decimal list-inside space-y-1 ml-3">
                  <li>Select expense type "OPEX"</li>
                  <li>Choose the item from "Link to Major Maintenance Item"</li>
                  <li>If all work is complete, check "Mark this item as complete"</li>
                  <li>The system will calculate the next due date automatically</li>
                </ol>
              </div>

              <div className="bg-amber-50 dark:bg-amber-900/40 border border-amber-200 dark:border-amber-700/50 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-amber-900 dark:text-amber-100">
                    <p className="font-semibold mb-1">Multiple Transactions Per Item</p>
                    <p>Projects and maintenance items can have multiple transactions (partial payments,
                    multiple invoices, etc.). Only check "mark as complete" on the final transaction.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-3">Revenue Categories</h4>
            <ul className="space-y-1 text-sm text-slate-700 dark:text-slate-300 list-disc list-inside">
              <li>Membership Dues (automatically created when marking members paid)</li>
              <li>Programs Income (swim lessons, tennis lessons, camps, events)</li>
              <li>Pool Rentals</li>
              <li>Tennis Court Rentals</li>
              <li>Miscellaneous Income</li>
            </ul>
          </div>
        </div>
      )
    },
    {
      id: 'cashflow',
      title: 'Cash Flow & Budget',
      icon: BarChart3,
      content: (
        <div className="space-y-6">
          <div>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-4">Cash Flow Management</h3>
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed mb-4">
              The Cash Flow screen shows monthly budgets vs. actual spending, helping you stay on track.
            </p>
          </div>

          <div>
            <h4 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-3">Budget Editor</h4>
            <p className="text-sm text-slate-700 dark:text-slate-300 mb-3">
              Click "Edit Budget" to set monthly targets for revenue and expenses. The budget helps you:
            </p>
            <ul className="space-y-2 text-sm text-slate-700 dark:text-slate-300 list-disc list-inside ml-4">
              <li>Plan for seasonal variations (higher costs in summer)</li>
              <li>Anticipate large expenses before they occur</li>
              <li>Track variance between planned and actual spending</li>
              <li>Project year-end cash position</li>
            </ul>
          </div>

          <div>
            <h4 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-3">Budget Categories</h4>
            <div className="space-y-2">
              <div className="flex items-start gap-2 text-sm">
                <span className="font-semibold min-w-[80px] text-emerald-700 dark:text-emerald-400">Revenue:</span>
                <span className="text-slate-700 dark:text-slate-300">Expected income from dues, programs, rentals</span>
              </div>
              <div className="flex items-start gap-2 text-sm">
                <span className="font-semibold min-w-[80px] text-rose-700 dark:text-rose-400">OPEX:</span>
                <span className="text-slate-700 dark:text-slate-300">Regular operating costs (utilities, management, landscaping)</span>
              </div>
              <div className="flex items-start gap-2 text-sm">
                <span className="font-semibold min-w-[80px] text-amber-700 dark:text-amber-400">CAPEX:</span>
                <span className="text-slate-700 dark:text-slate-300">Planned capital projects for the month</span>
              </div>
              <div className="flex items-start gap-2 text-sm">
                <span className="font-semibold min-w-[80px] text-slate-700 dark:text-slate-300">G&A:</span>
                <span className="text-slate-700 dark:text-slate-300">Administrative expenses</span>
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-3">Budget Auto-Adjustment</h4>
            <div className="bg-blue-50 dark:bg-blue-900/40 border border-blue-200 dark:border-blue-700/50 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-900 dark:text-blue-100">
                  <p className="font-semibold mb-1">Smart Budget Updates</p>
                  <p className="mb-2">When you link transactions to CAPEX or Major Maintenance items:</p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>The first transaction removes the original budgeted amount from the planned month</li>
                    <li>Each transaction adds its amount to the month it actually occurred</li>
                    <li>This means multi-month projects correctly show spending across all affected months</li>
                  </ul>
                  <p className="mt-2 italic">Example: A $10K project budgeted for June might have $7K spent
                  in June and $3K in July. The budget will show $7K in June and $3K in July.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'capex',
      title: 'CAPEX Projects',
      icon: Building2,
      content: (
        <div className="space-y-6">
          <div>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-4">Capital Expenditure Planning</h3>
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed mb-4">
              CAPEX projects are major investments in assets or improvements that add long-term value.
            </p>
          </div>

          <div>
            <h4 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-3">Creating a CAPEX Project</h4>
            <ol className="space-y-2 text-sm text-slate-700 dark:text-slate-300 list-decimal list-inside">
              <li>Go to Dashboard and click "Manage Projects"</li>
              <li>Click "+ Add CAPEX Project"</li>
              <li>Enter project name, description, and budgeted amount</li>
              <li>Select the fiscal month when you plan to spend the money</li>
              <li>Add vendor quotes or notes</li>
              <li>Click "Save"</li>
            </ol>
          </div>

          <div>
            <h4 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-3">Completing a CAPEX Project</h4>
            <div className="bg-purple-50 dark:bg-purple-900/40 border border-purple-200 dark:border-purple-700/50 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-purple-600 dark:text-purple-400 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-purple-900 dark:text-purple-100">
                  <p className="font-semibold mb-2">Important: No Manual Completion</p>
                  <p className="mb-2">CAPEX projects cannot be manually marked complete. Instead:</p>
                  <ol className="list-decimal list-inside space-y-1 ml-2">
                    <li>Create a CAPEX transaction for each payment/invoice</li>
                    <li>Link each transaction to the project</li>
                    <li>On the FINAL transaction, check "Mark this project as complete"</li>
                    <li>The project will show total spent and completion date</li>
                  </ol>
                  <p className="mt-2">This ensures all spending is properly documented with transaction records.</p>
                </div>
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-3">Replacement Planning</h4>
            <p className="text-sm text-slate-700 dark:text-slate-300 mb-2">
              When a project is completed, you can set a reminder for future replacement:
            </p>
            <ul className="space-y-2 text-sm text-slate-700 dark:text-slate-300 list-disc list-inside ml-4">
              <li>Set a "Reminder Year" for when you want to be alerted about replacement</li>
              <li>The Dashboard will show alerts when the reminder year approaches</li>
              <li>Helps plan for future capital expenditures</li>
              <li>Can be marked as "N/A" if replacement tracking isn't needed</li>
            </ul>
          </div>

          <div>
            <h4 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-3">Examples of CAPEX Projects</h4>
            <ul className="space-y-1 text-sm text-slate-700 dark:text-slate-300 list-disc list-inside ml-4">
              <li>Pool heater replacement</li>
              <li>New tennis court fencing</li>
              <li>Clubhouse HVAC system</li>
              <li>Pool filtration system upgrade</li>
              <li>Court resurfacing equipment</li>
            </ul>
          </div>
        </div>
      )
    },
    {
      id: 'maintenance',
      title: 'Major Maintenance',
      icon: Wrench,
      content: (
        <div className="space-y-6">
          <div>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-4">Major Maintenance Tracking</h3>
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed mb-4">
              Track large, recurring maintenance projects that happen every few years (pool resurfacing,
              deck replacement, etc.)
            </p>
          </div>

          <div>
            <h4 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-3">Creating a Maintenance Item</h4>
            <ol className="space-y-2 text-sm text-slate-700 dark:text-slate-300 list-decimal list-inside">
              <li>Go to Dashboard and click "Manage Projects"</li>
              <li>Switch to "Major Maintenance Schedule" tab</li>
              <li>Click "+ Add Maintenance Item"</li>
              <li>Enter item name, description, and category (Pool, Tennis, Grounds, etc.)</li>
              <li>Enter budgeted amount for this occurrence</li>
              <li>Select the fiscal month when planned</li>
              <li>Set a "Reminder Year" for when you want to plan the next occurrence</li>
              <li>Can mark as "N/A" if tracking isn't needed</li>
              <li>Click "Save"</li>
            </ol>
          </div>

          <div>
            <h4 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-3">Recording Maintenance Work</h4>
            <div className="bg-blue-50 dark:bg-blue-900/40 border border-blue-200 dark:border-blue-700/50 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-900 dark:text-blue-100">
                  <p className="font-semibold mb-2">Completion Process</p>
                  <ol className="list-decimal list-inside space-y-1 ml-2">
                    <li>Create OPEX transactions for each payment/invoice</li>
                    <li>Link each transaction to the maintenance item</li>
                    <li>On the FINAL transaction, check "Mark this item as complete"</li>
                    <li>System automatically calculates next due date based on recurrence period</li>
                    <li>Projects future cost with 3% annual inflation</li>
                  </ol>
                </div>
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-3">Reminder Alerts</h4>
            <p className="text-sm text-slate-700 dark:text-slate-300 mb-3">
              Once a maintenance item is completed with a reminder year set, the system:
            </p>
            <ul className="space-y-2 text-sm text-slate-700 dark:text-slate-300 list-disc list-inside ml-4">
              <li>Records the completion date and actual cost</li>
              <li>Shows dashboard alerts when the reminder year approaches</li>
              <li>Estimates future cost with inflation adjustment (3% annually)</li>
              <li>Helps you plan and budget for upcoming maintenance</li>
            </ul>
          </div>

          <div>
            <h4 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-3">Examples of Major Maintenance</h4>
            <ul className="space-y-1 text-sm text-slate-700 dark:text-slate-300 list-disc list-inside ml-4">
              <li>Pool resurfacing (every 5-7 years)</li>
              <li>Pool deck replacement (every 10-15 years)</li>
              <li>Tennis court resurfacing (every 4-6 years)</li>
              <li>Fence replacement (every 8-12 years)</li>
              <li>Major landscaping projects (every 3-5 years)</li>
            </ul>
          </div>

          <div>
            <h4 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-3">Year-End Behavior</h4>
            <div className="bg-amber-50 dark:bg-amber-900/40 border border-amber-200 dark:border-amber-700/50 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-amber-900 dark:text-amber-100">
                  <p className="font-semibold mb-1">Major Maintenance Does NOT Roll Over</p>
                  <p>Unlike regular OPEX, major maintenance costs do not roll into next year's budget.
                  These are one-time expenses that need to be budgeted individually each time they occur.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'yearend',
      title: 'Year-End Process',
      icon: Calendar,
      content: (
        <div className="space-y-6">
          <div>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-4">Year-End Close & Rollover</h3>
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed mb-4">
              At the end of each fiscal year (September 30), close the books and create next year's budget.
            </p>
          </div>

          <div>
            <h4 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-3">When to Close the Year</h4>
            <ul className="space-y-2 text-sm text-slate-700 dark:text-slate-300 list-disc list-inside ml-4">
              <li>All September transactions have been entered</li>
              <li>All member payments have been recorded</li>
              <li>All vendor invoices for the year have been paid and entered</li>
              <li>Bank account is reconciled</li>
            </ul>
          </div>

          <div>
            <h4 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-3">Year-End Wizard Steps</h4>
            <ol className="space-y-3 text-sm text-slate-700 dark:text-slate-300 list-decimal list-inside">
              <li className="font-medium">
                <span>Review Year</span>
                <p className="font-normal ml-6 mt-1 text-slate-600 dark:text-slate-400">
                  System shows year-end summary: total revenue, expenses broken down by type,
                  net income, major maintenance projects completed, CAPEX spending
                </p>
              </li>
              <li className="font-medium">
                <span>Preview Budget</span>
                <p className="font-normal ml-6 mt-1 text-slate-600 dark:text-slate-400">
                  See the new year's budget based on this year's actuals. Regular OPEX carries forward,
                  CAPEX and Major Maintenance start at $0
                </p>
              </li>
              <li className="font-medium">
                <span>Confirm & Close</span>
                <p className="font-normal ml-6 mt-1 text-slate-600 dark:text-slate-400">
                  Archive current year, create new budget, roll over members (unpaid status),
                  update fiscal year
                </p>
              </li>
            </ol>
          </div>

          <div>
            <h4 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-3">What Rolls Over to Next Year</h4>
            <div className="space-y-3">
              <div className="bg-emerald-50 dark:bg-emerald-900/40 border border-emerald-200 dark:border-emerald-700/50 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  <h5 className="font-semibold text-emerald-900 dark:text-emerald-100">Regular OPEX</h5>
                </div>
                <p className="text-sm text-emerald-800 dark:text-emerald-200 ml-7">
                  Monthly budgets based on actual spending this year. Utilities, management,
                  landscaping - all carried forward.
                </p>
              </div>

              <div className="bg-emerald-50 dark:bg-emerald-900/40 border border-emerald-200 dark:border-emerald-700/50 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  <h5 className="font-semibold text-emerald-900 dark:text-emerald-100">G&A Expenses</h5>
                </div>
                <p className="text-sm text-emerald-800 dark:text-emerald-200 ml-7">
                  Administrative costs roll forward based on actuals.
                </p>
              </div>

              <div className="bg-emerald-50 dark:bg-emerald-900/40 border border-emerald-200 dark:border-emerald-700/50 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  <h5 className="font-semibold text-emerald-900 dark:text-emerald-100">Revenue Projections</h5>
                </div>
                <p className="text-sm text-emerald-800 dark:text-emerald-200 ml-7">
                  Based on this year's membership and program income.
                </p>
              </div>

              <div className="bg-emerald-50 dark:bg-emerald-900/40 border border-emerald-200 dark:border-emerald-700/50 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  <h5 className="font-semibold text-emerald-900 dark:text-emerald-100">Members List</h5>
                </div>
                <p className="text-sm text-emerald-800 dark:text-emerald-200 ml-7">
                  All members carry over with payment status reset to unpaid.
                </p>
              </div>

              <div className="bg-emerald-50 dark:bg-emerald-900/40 border border-emerald-200 dark:border-emerald-700/50 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  <h5 className="font-semibold text-emerald-900 dark:text-emerald-100">Starting Balance</h5>
                </div>
                <p className="text-sm text-emerald-800 dark:text-emerald-200 ml-7">
                  Ending balance becomes starting balance for new year.
                </p>
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-3">What Does NOT Roll Over</h4>
            <div className="space-y-3">
              <div className="bg-rose-50 dark:bg-rose-900/40 border border-rose-200 dark:border-rose-700/50 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <X className="w-5 h-5 text-rose-600 dark:text-rose-400" />
                  <h5 className="font-semibold text-rose-900 dark:text-rose-100">CAPEX Projects</h5>
                </div>
                <p className="text-sm text-rose-800 dark:text-rose-200 ml-7">
                  Capital projects start at $0. Plan new projects in the CAPEX Manager.
                </p>
              </div>

              <div className="bg-rose-50 dark:bg-rose-900/40 border border-rose-200 dark:border-rose-700/50 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <X className="w-5 h-5 text-rose-600 dark:text-rose-400" />
                  <h5 className="font-semibold text-rose-900 dark:text-rose-100">Major Maintenance</h5>
                </div>
                <p className="text-sm text-rose-800 dark:text-rose-200 ml-7">
                  These are one-time expenses. Budget them individually when they're due.
                </p>
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-3">After Year-End Close</h4>
            <ul className="space-y-2 text-sm text-slate-700 dark:text-slate-300 list-disc list-inside ml-4">
              <li>Review and adjust the new budget as needed</li>
              <li>Plan CAPEX projects for the new year</li>
              <li>Budget any scheduled major maintenance</li>
              <li>Update member dues if rates changed</li>
              <li>You can still edit prior year data if corrections needed</li>
            </ul>
          </div>
        </div>
      )
    },
    {
      id: 'reports',
      title: 'Reports & Analysis',
      icon: FileText,
      content: (
        <div className="space-y-6">
          <div>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-4">Financial Reports</h3>
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed mb-4">
              Generate reports to share with board members, analyze trends, and maintain transparency.
            </p>
          </div>

          <div>
            <h4 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-3">Profit & Loss Statement</h4>
            <p className="text-sm text-slate-700 dark:text-slate-300 mb-3">
              Shows income and expenses by category for the fiscal year. Use this to:
            </p>
            <ul className="space-y-2 text-sm text-slate-700 dark:text-slate-300 list-disc list-inside ml-4">
              <li>Present financial status to board and members</li>
              <li>Identify areas of overspending or savings</li>
              <li>Compare year-over-year performance</li>
              <li>Calculate net income and margins</li>
            </ul>
          </div>

          <div>
            <h4 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-3">Year-End Report</h4>
            <p className="text-sm text-slate-700 dark:text-slate-300 mb-3">
              Comprehensive annual summary including:
            </p>
            <ul className="space-y-2 text-sm text-slate-700 dark:text-slate-300 list-disc list-inside ml-4">
              <li>Budget vs. actual comparison for all categories</li>
              <li>Membership statistics and revenue</li>
              <li>Major projects completed</li>
              <li>Cash flow summary</li>
              <li>Recommendations for next year</li>
            </ul>
          </div>

          <div>
            <h4 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-3">Cash Flow Report</h4>
            <p className="text-sm text-slate-700 dark:text-slate-300 mb-3">
              Month-by-month view of cash in and out. Helps identify:
            </p>
            <ul className="space-y-2 text-sm text-slate-700 dark:text-slate-300 list-disc list-inside ml-4">
              <li>Seasonal cash flow patterns</li>
              <li>Months with low reserves (plan carefully)</li>
              <li>Best time to schedule major expenses</li>
              <li>When to build cash reserves for winter</li>
            </ul>
          </div>

          <div>
            <h4 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-3">Exporting Data</h4>
            <div className="bg-blue-50 dark:bg-blue-900/40 border border-blue-200 dark:border-blue-700/50 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-900 dark:text-blue-100">
                  <p className="font-semibold mb-1">Data Export</p>
                  <p>You can export financial data as JSON for backup or analysis in Excel/Google Sheets.
                  Go to Settings (gear icon) → Export Data.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'security',
      title: 'Security & Access',
      icon: Lock,
      content: (
        <div className="space-y-6">
          <div>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-4">Authentication & Security</h3>
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed mb-4">
              Your financial data is protected with secure authentication and role-based access controls.
            </p>
          </div>

          <div>
            <h4 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-3">Logging In</h4>
            <ol className="space-y-2 text-sm text-slate-700 dark:text-slate-300 list-decimal list-inside">
              <li>Navigate to the app URL</li>
              <li>Enter your email address and password</li>
              <li>Click "Sign In" to access the application</li>
              <li>Your email address will be displayed in the header</li>
            </ol>
          </div>

          <div>
            <h4 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-3">Creating an Account</h4>
            <p className="text-sm text-slate-700 dark:text-slate-300 mb-3">
              If you don't have an account yet:
            </p>
            <ol className="space-y-2 text-sm text-slate-700 dark:text-slate-300 list-decimal list-inside ml-4">
              <li>Click "Need an account? Sign up" on the login screen</li>
              <li>Enter your email address</li>
              <li>Create a secure password (at least 6 characters)</li>
              <li>Click "Create Account"</li>
              <li>You'll be automatically signed in</li>
            </ol>
          </div>

          <div>
            <h4 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-3">Password Reset</h4>
            <div className="bg-blue-50 dark:bg-blue-900/40 border border-blue-200 dark:border-blue-700/50 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-900 dark:text-blue-100">
                  <p className="font-semibold mb-2">Forgot Your Password?</p>
                  <ol className="list-decimal list-inside space-y-1 ml-2">
                    <li>On the login screen, click "Forgot password?"</li>
                    <li>Enter your email address</li>
                    <li>Click "Send Reset Link"</li>
                    <li>Check your email inbox for the password reset link</li>
                    <li>Follow the link to create a new password</li>
                  </ol>
                </div>
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-3">Logging Out</h4>
            <p className="text-sm text-slate-700 dark:text-slate-300 mb-2">
              To sign out of the application:
            </p>
            <ul className="space-y-2 text-sm text-slate-700 dark:text-slate-300 list-disc list-inside ml-4">
              <li>Click the "Logout" button in the top right corner of the header</li>
              <li>Confirm when prompted</li>
              <li>You'll be returned to the login screen</li>
              <li>Always log out when using a shared computer</li>
            </ul>
          </div>

          <div>
            <h4 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-3">Security Features</h4>
            <div className="space-y-3">
              <div className="bg-emerald-50 dark:bg-emerald-900/40 border border-emerald-200 dark:border-emerald-700/50 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  <h5 className="font-semibold text-emerald-900 dark:text-emerald-100">Secure Authentication</h5>
                </div>
                <p className="text-sm text-emerald-800 dark:text-emerald-200 ml-7">
                  Email/password authentication powered by Firebase ensures only authorized users can access financial data.
                </p>
              </div>

              <div className="bg-emerald-50 dark:bg-emerald-900/40 border border-emerald-200 dark:border-emerald-700/50 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  <h5 className="font-semibold text-emerald-900 dark:text-emerald-100">Database Security</h5>
                </div>
                <p className="text-sm text-emerald-800 dark:text-emerald-200 ml-7">
                  Firestore security rules require authentication for all read/write operations. Anonymous access is blocked.
                </p>
              </div>

              <div className="bg-emerald-50 dark:bg-emerald-900/40 border border-emerald-200 dark:border-emerald-700/50 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  <h5 className="font-semibold text-emerald-900 dark:text-emerald-100">HTTPS Encryption</h5>
                </div>
                <p className="text-sm text-emerald-800 dark:text-emerald-200 ml-7">
                  All data is transmitted over encrypted HTTPS connections protecting against eavesdropping.
                </p>
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-3">Best Security Practices</h4>
            <ul className="space-y-2 text-sm text-slate-700 dark:text-slate-300 list-disc list-inside ml-4">
              <li>Use a strong, unique password for your account</li>
              <li>Never share your login credentials with others</li>
              <li>Always log out when finished, especially on shared computers</li>
              <li>Keep your password confidential and change it periodically</li>
              <li>Report any suspicious activity immediately</li>
            </ul>
          </div>
        </div>
      )
    },
    {
      id: 'tips',
      title: 'Best Practices',
      icon: AlertCircle,
      content: (
        <div className="space-y-6">
          <div>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-4">Tips for Treasurers</h3>
          </div>

          <div>
            <h4 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-3">Regular Maintenance</h4>
            <ul className="space-y-2 text-sm text-slate-700 dark:text-slate-300 list-disc list-inside ml-4">
              <li>Enter transactions weekly to stay current</li>
              <li>Reconcile with bank statements monthly</li>
              <li>Review budget vs. actual monthly to catch issues early</li>
              <li>Export data regularly for backup</li>
              <li>Update member payment status as checks arrive</li>
            </ul>
          </div>

          <div>
            <h4 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-3">Communication</h4>
            <ul className="space-y-2 text-sm text-slate-700 dark:text-slate-300 list-disc list-inside ml-4">
              <li>Share P&L statement at board meetings</li>
              <li>Alert board early if budget variances appear</li>
              <li>Provide year-end report at annual meeting</li>
              <li>Keep members informed of financial health</li>
            </ul>
          </div>

          <div>
            <h4 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-3">Planning Ahead</h4>
            <ul className="space-y-2 text-sm text-slate-700 dark:text-slate-300 list-disc list-inside ml-4">
              <li>Review major maintenance schedule annually</li>
              <li>Plan CAPEX projects 1-2 years in advance</li>
              <li>Build cash reserves for large upcoming expenses</li>
              <li>Track vendor performance and pricing for future reference</li>
              <li>Document all major decisions in transaction notes</li>
            </ul>
          </div>

          <div>
            <h4 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-3">Transition to New Treasurer</h4>
            <div className="bg-blue-50 dark:bg-blue-900/40 border border-blue-200 dark:border-blue-700/50 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-900 dark:text-blue-100">
                  <p className="font-semibold mb-2">Preparing for Handoff</p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>Export current year data as backup</li>
                    <li>Document any pending transactions or obligations</li>
                    <li>Review upcoming major maintenance items together</li>
                    <li>Share vendor contacts and recurring service details</li>
                    <li>Walk through this Feature Guide together</li>
                    <li>Provide bank account access and check signing authority</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-3">Common Pitfalls to Avoid</h4>
            <div className="space-y-2">
              <div className="bg-amber-50 dark:bg-amber-900/40 border border-amber-200 dark:border-amber-700/50 rounded-lg p-3">
                <h5 className="font-semibold text-amber-900 dark:text-amber-100 text-sm mb-1">Don't Skip Transaction Dates</h5>
                <p className="text-sm text-amber-800 dark:text-amber-200">
                  Always use the actual transaction date, not when you enter it. This keeps monthly reports accurate.
                </p>
              </div>
              <div className="bg-amber-50 dark:bg-amber-900/40 border border-amber-200 dark:border-amber-700/50 rounded-lg p-3">
                <h5 className="font-semibold text-amber-900 dark:text-amber-100 text-sm mb-1">Don't Delay Entering Transactions</h5>
                <p className="text-sm text-amber-800 dark:text-amber-200">
                  Enter transactions promptly. Waiting until month-end makes it harder to remember details and match checks.
                </p>
              </div>
              <div className="bg-amber-50 dark:bg-amber-900/40 border border-amber-200 dark:border-amber-700/50 rounded-lg p-3">
                <h5 className="font-semibold text-amber-900 dark:text-amber-100 text-sm mb-1">Don't Forget to Link Major Expenses</h5>
                <p className="text-sm text-amber-800 dark:text-amber-200">
                  Always link CAPEX and major maintenance transactions to their projects for accurate tracking.
                </p>
              </div>
              <div className="bg-amber-50 dark:bg-amber-900/40 border border-amber-200 dark:border-amber-700/50 rounded-lg p-3">
                <h5 className="font-semibold text-amber-900 dark:text-amber-100 text-sm mb-1">Don't Close the Year Early</h5>
                <p className="text-sm text-amber-800 dark:text-amber-200">
                  Wait until all September transactions are entered before running year-end close.
                </p>
              </div>
            </div>
          </div>
        </div>
      )
    }
  ];

  const activeContent = sections.find(s => s.id === activeSection);
  const Icon = activeContent?.icon || BookOpen;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-[#1e293b] rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] flex overflow-hidden">
        {/* Sidebar Navigation */}
        <div className="w-64 bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 border-r border-slate-200 dark:border-[#334155] flex-shrink-0 overflow-y-auto">
          <div className="p-6 border-b border-slate-200 dark:border-[#334155]">
            <div className="flex items-center gap-3 mb-2">
              <BookOpen className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Feature Guide</h2>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400">Complete reference for treasurers</p>
          </div>

          <nav className="p-4">
            {sections.map((section) => {
              const SectionIcon = section.icon;
              return (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg mb-2 transition-all text-left ${
                    activeSection === section.id
                      ? 'bg-blue-600 text-white shadow-lg'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 hover:shadow'
                  }`}
                >
                  <SectionIcon className="w-5 h-5 flex-shrink-0" />
                  <span className="text-sm font-medium">{section.title}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-6 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-3">
              <Icon className="w-8 h-8" />
              <h2 className="text-2xl font-bold">{activeContent?.title}</h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              title="Close guide"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-8 bg-white dark:bg-[#1e293b]">
            {activeContent?.content}
          </div>
        </div>
      </div>
    </div>
  );
}

export default FeatureGuide;
