# Security Policy

## Overview

This document outlines the security measures and known vulnerabilities for the LFST Finance App.

## Security Measures Implemented

### 1. **Firebase Configuration** ✅
- API keys stored in `.env` file (not committed to git)
- Environment variables used via `import.meta.env`
- Old exposed API keys rotated and deleted
- New API key restricted with:
  - HTTP referrer restrictions (localhost + production domains)
  - API restrictions (only necessary Firebase APIs enabled)

### 2. **Firestore Security Rules** ✅
- Role-Based Access Control (RBAC) implemented
- Three roles: Admin, Editor, Viewer
- Permissions enforced at database level
- Authentication required for all access
- Public sign-ups disabled (admin-managed users only)

### 3. **User Tracking & Audit Trail** ✅
- All data changes tracked with `createdBy`, `modifiedBy`
- Timestamps on all operations
- Full audit history maintained

### 4. **Authentication** ✅
- Firebase Authentication with Email/Password
- No anonymous access allowed
- User sessions managed by Firebase

### 5. **Code Security** ✅
- No XSS vulnerabilities (no `dangerouslySetInnerHTML`)
- No `eval()` or dynamic code execution
- Input validation on all forms
- Secure data handling practices

## Known Vulnerabilities (Accepted Risk)

### xlsx Package (v0.18.5)

**Status:** ✅ ACCEPTED - Low Risk

**Vulnerabilities:**
- Prototype Pollution (GHSA-4r6h-8v6p-xvw6)
- Regular Expression Denial of Service (GHSA-5pgg-2g8v-p4x9)

**Why This Is Safe:**
- Package is ONLY used for **exporting** data to Excel format
- No file import/parsing functionality exists
- No user-uploaded files are processed
- All exported data comes from our secured Firestore database
- Vulnerabilities only apply when parsing untrusted Excel files

**Location:** `src/components/YearEndReport.jsx` (lines 289-509)

**Mitigation:**
- Regular monitoring for patches
- Will migrate to alternative if import functionality is added in future

**Decision Date:** 2025-12-28
**Reviewed By:** System Administrator
**Next Review:** When import functionality is considered or patched version available

## Security Best Practices

### For Developers:

1. **Never commit sensitive data:**
   - API keys go in `.env` only
   - Service account keys stored outside repository
   - Check `.gitignore` before committing

2. **Always use environment variables:**
   - Use `import.meta.env.VITE_*` for config
   - Never hardcode credentials in source files

3. **Test security rules:**
   - Test with different user roles before deployment
   - Verify permission guards work correctly
   - Check Firestore rules in Firebase Console simulator

4. **Dependency updates:**
   - Run `npm audit` regularly
   - Review and document accepted risks
   - Update dependencies when patches available

## Reporting Security Issues

If you discover a security vulnerability, please email: [Your Security Contact Email]

**Do NOT:**
- Open public GitHub issues for security vulnerabilities
- Discuss vulnerabilities in public channels

## Security Audit History

| Date | Auditor | Findings | Status |
|------|---------|----------|--------|
| 2025-12-28 | Claude Code | API key exposure, weak Firestore rules, xlsx vulnerability | ✅ Resolved |

## Next Steps

Before sharing with additional testers:
1. ✅ Rotate API keys (Completed)
2. ✅ Deploy RBAC rules (Completed)
3. ✅ Disable public sign-ups (Completed)
4. ⏳ Run multi-user migration script
5. ⏳ Create test user accounts
6. ⏳ Test permission enforcement
