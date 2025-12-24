# Lockridge Forest Swim & Tennis Club - Financial Management System

## 🎉 Welcome!

This is your custom-built financial management application. It eliminates the triple-entry problem you've been dealing with in Excel and provides a modern, persistent storage solution.

---

## 📋 What's Included

✅ **Dashboard** - Real-time financial overview with metrics and cash flow visualization
✅ **Transaction Management** - Single-entry system that updates everything automatically  
✅ **Member Tracking** - Payment status, search, and filtering
✅ **Monthly Services** - Recurring expense tracking with auto-pay indicators
✅ **Report Generation** - Monthly board reports with data export
✅ **Persistent Storage** - Data saves automatically to your OneDrive folder
✅ **Audit Trail** - Every transaction tracked with timestamps

---

## 🚀 Getting Started

### Step 1: Extract the Project

1. Download the `lfst-finance-app.tar.gz` file
2. Extract it to your desired location, for example:
   ```
   C:\Users\seant\Projects\lfst-finance-app\
   ```

### Step 2: Open in VS Code

1. Open Visual Studio Code
2. Click `File` → `Open Folder`
3. Select the `lfst-finance-app` folder

### Step 3: Install Dependencies

1. Open the integrated terminal in VS Code (`` Ctrl+` `` or `Terminal` → `New Terminal`)
2. Run:
   ```bash
   npm install
   ```
   This will install all required packages (React, Vite, Tailwind CSS, Lucide icons, etc.)
   
   **Note:** This may take 2-3 minutes the first time.

### Step 4: Start the Development Server

In the terminal, run:
```bash
npm run dev
```

You should see:
```
  VITE v4.4.5  ready in 500 ms

  ➜  Local:   http://localhost:3000/
  ➜  press h to show help
```

### Step 5: Open in Browser

Your default browser should open automatically. If not, navigate to:
```
http://localhost:3000
```

---

## 💾 Data Storage - HOW IT WORKS

### Current Setup (Phase 1)

**Where your data is stored:**
- Currently using browser localStorage (saves to your browser)
- Target location: `C:\Users\seant\OneDrive\LFST-Financial-Data\`

**What this means:**
- ✅ Data persists between sessions (doesn't disappear when you close the app)
- ✅ Changes save automatically as you work
- ✅ Works offline
- ⚠️ Currently tied to your browser on this computer
- ⚠️ Not yet synced to actual OneDrive folder (that's Phase 1.5)

### Phase 1.5: True OneDrive Sync (Next Step)

To enable actual file writing to OneDrive, we need to:

**Option A: Electron Desktop App** (Recommended)
- Package this as a desktop app
- Gets full file system access
- Can write directly to `C:\Users\seant\OneDrive\LFST-Financial-Data\`
- OneDrive automatically syncs to cloud

**Option B: Node.js Backend**
- Add a small local server
- App communicates with server to read/write files
- More complex but gives you API access

Let me know when you're ready for Phase 1.5 and I'll implement it!

### Current Data Files (localStorage)

Your data is organized as:
- `lfst_finance_settings` - App configuration, fiscal year
- `lfst_finance_balance` - Current bank balance
- `lfst_finance_members` - All member records
- `lfst_finance_transactions` - All transactions
- `lfst_finance_services` - Monthly recurring services

---

## 📖 How to Use the App

### Adding a Transaction

1. Click the blue **+** button (bottom right)
2. Select transaction type: **Expense** or **Revenue**
3. Choose category from dropdown
4. Enter description (e.g., "Pool repair")
5. Enter amount
6. Select payment method
7. Click **Save Transaction**

**What happens automatically:**
- ✅ Bank balance updates
- ✅ Transaction appears in history
- ✅ Metrics recalculate
- ✅ Reports update
- ✅ Audit trail created

### Managing Members

1. Go to **Members** tab
2. Click **Add Member** button
3. Enter member details
4. When they pay, record payment which:
   - Updates their status to "Paid"
   - Adds transaction automatically
   - Updates balance
   - Updates revenue metrics

### Monthly Services

1. Go to **Monthly Services** tab
2. View all recurring expenses
3. See which months are paid (✓) vs pending (○)
4. Services with "Auto-Pay Enabled" badge are set up for automatic payment

### Generating Reports

1. Go to **Reports** tab
2. Review the auto-generated monthly report
3. Click **Export Data** to download JSON backup
4. Later: We'll add PDF export and email distribution

---

## 🎨 Customizing the App

### Changing Colors

Edit `src/App.css` or component files. Current theme:
- Primary: Blue (#3b82f6)
- Success: Emerald (#10b981)
- Error: Rose (#f43f5e)
- Warning: Amber (#f59e0b)

### Adding New Categories

Edit `src/utils/helpers.js`:
```javascript
export const CATEGORIES = {
  MEMBER_DUES: 'Member Dues',
  YOUR_NEW_CATEGORY: 'Your New Category Name',
  // ... existing categories
};
```

### Changing Fiscal Year

The app automatically detects fiscal year from settings. To change:
1. In the app, it will detect from data
2. Or manually edit in browser console:
```javascript
localStorage.setItem('lfst_finance_settings', JSON.stringify({
  fiscalYear: 2027,
  startDate: '2026-10-01',
  clubName: 'Lockridge Forest Swim & Tennis Club'
}));
```

---

## 🔧 Troubleshooting

### "npm install" fails

**Error:** `EACCES` permission denied
**Solution:**
```bash
npm install --force
```

### Port 3000 already in use

**Error:** `Port 3000 is already in use`
**Solution:** 
1. Stop other applications using port 3000
2. Or edit `vite.config.js` to use different port:
```javascript
server: {
  port: 3001,  // Change to any available port
  open: true
}
```

### White screen / App won't load

**Check browser console:**
1. Press F12 to open developer tools
2. Look for errors in Console tab
3. Send me the error message

### Data disappeared

**localStorage was cleared:**
- Don't use browser's "Clear browsing data" with "Cookies and other site data" checked
- Use the app's Export Data feature for backups

### Can't see changes after editing code

**Hot reload not working:**
1. Stop the server (Ctrl+C in terminal)
2. Run `npm run dev` again
3. Hard refresh browser (Ctrl+Shift+R)

---

## 📁 Project Structure

```
lfst-finance-app/
├── src/
│   ├── components/         # React components
│   │   ├── Dashboard.jsx   # Main dashboard
│   │   ├── Transactions.jsx
│   │   ├── Members.jsx
│   │   ├── MonthlyServices.jsx
│   │   ├── Reports.jsx
│   │   └── TransactionModal.jsx
│   ├── services/
│   │   └── storage.js      # Data persistence layer
│   ├── utils/
│   │   └── helpers.js      # Utility functions
│   ├── App.jsx             # Main app component
│   ├── App.css             # Styles
│   └── main.jsx            # Entry point
├── public/                 # Static assets
├── index.html              # HTML template
├── package.json            # Dependencies
├── vite.config.js          # Vite configuration
├── tailwind.config.js      # Tailwind CSS config
└── README.md               # This file
```

---

## 🎯 Next Steps (What We'll Build Together)

### Phase 1.5: True File Storage (Next)
- **Time:** 1-2 days
- **What:** Enable actual file writing to OneDrive folder
- **How:** Electron wrapper or Node.js backend
- **Result:** Files appear in `C:\Users\seant\OneDrive\LFST-Financial-Data\`

### Phase 2: Year-End Rollover (Week 2)
- **Time:** 3-4 days  
- **What:** One-click fiscal year transition
- **Result:** 2 hours of manual work → 30 seconds

### Phase 3: Excel Import/Export (Week 3)
- **Time:** 4-5 days
- **What:** Import your current Excel workbook, export anytime
- **Result:** Seamless transition from Excel

### Phase 4: User Authentication (Week 4-5)
- **Time:** 5-6 days
- **What:** Treasurer (edit) + Board Member (view) roles
- **Result:** Secure multi-user access

### Phase 5: Automated Email Reports (Week 6)
- **Time:** 3-4 days
- **What:** Monthly reports auto-sent to board
- **Result:** No more manual report emails

### Phase 6: Website Integration (Week 7)
- **Time:** 3-4 days
- **What:** Public financial transparency page
- **Result:** Members can view reports online

---

## 💡 Development Tips

### Viewing Console Logs

All actions log to browser console. Press F12 and look for:
- `✅ Data loaded successfully`
- `💾 Saved transactions to storage`
- `📊 Stats:` - Current data statistics

### Testing Without Breaking Production

The app uses localStorage, so you can:
1. Test in a different browser (Chrome vs Firefox)
2. Use browser's Incognito/Private mode
3. Export data before testing, import to restore

### Backup Your Data

**Before major changes:**
1. Go to Reports tab
2. Click "Export Data"
3. Save the JSON file
4. To restore: We'll add import feature

---

## 🆘 Getting Help

### During Development Phase

Contact me (Claude) with:
- Screenshots of errors
- Description of what you were trying to do
- Browser console errors (F12 → Console tab)

### Useful Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Check for issues
npm run lint
```

---

## 🎓 Learning Resources

### React

- [React Documentation](https://react.dev)
- [React Tutorial](https://react.dev/learn)

### Vite

- [Vite Guide](https://vitejs.dev/guide/)

### Tailwind CSS

- [Tailwind Documentation](https://tailwindcss.com/docs)
- [Tailwind Cheat Sheet](https://nerdcave.com/tailwind-cheat-sheet)

---

## 📝 Change Log

### Version 1.0.0 (December 17, 2025)

**Initial Release:**
- ✅ Dashboard with real-time metrics
- ✅ Transaction management (single-entry)
- ✅ Member tracking and payment status
- ✅ Monthly services overview
- ✅ Report generation with data export
- ✅ Persistent storage (localStorage)
- ✅ Full CRUD operations
- ✅ Audit trail for all transactions

**Known Limitations:**
- Data stored in browser (not yet to OneDrive files)
- Single user only (no authentication)
- No Excel import yet
- No automated emails yet
- Manual report generation

**Coming Soon:**
- True OneDrive file storage
- Excel import/export
- Year-end rollover wizard
- Multi-user with authentication

---

## 🤝 Contributing

This is your personal app, but if you want to:
- Add features
- Fix bugs
- Improve documentation

Just let me know and we'll work on it together!

---

## 📧 Contact

For questions, issues, or feature requests during development, reach out to me (Claude) in our conversation.

---

## 🎉 You're All Set!

Run `npm run dev` and start using your new financial management system!

**Remember:**
- Data saves automatically
- Use the + button to add transactions
- Export data regularly for backups
- Let me know when you're ready for Phase 1.5 (true OneDrive sync)

Happy financial managing! 🎊
"# lfst-finance-app" 
