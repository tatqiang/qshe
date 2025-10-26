# 📄 Quick Start: Member Registration Report

## How to View & Print Reports

### **Option 1: From Admin Dashboard** (Recommended)

1. **Go to**: `/admin/member-application-tokens`
2. **Find your token** in the list
3. **Click**: 👥 Green users icon
4. **See**: Modal with all registered members
5. **Click**: Green "Report" button on any member
6. **Result**: New tab opens with formatted report

### **Option 2: Direct URL**

Navigate to:
```
/public/member-report?id={member_id}
```

Example:
```
/public/member-report?id=277d6f76-a154-455d-b45...
```

---

## 🖨️ How to Print

1. **Open report** (using steps above)
2. **Click**: "พิมพ์" (Print) button in top-right
3. **Select**: Your printer
4. **Set**: Paper size to A4
5. **Click**: Print

**Tip:** The action bar will automatically hide when printing!

---

## 💾 How to Save as PDF

### **Method 1: Using Print Dialog** (All Browsers)

1. **Open report**
2. **Click**: "บันทึก PDF" (Save PDF) button
3. **In print dialog**:
   - Destination: **"Save as PDF"**
   - Paper size: **A4**
4. **Click**: Save
5. **Choose**: Save location and filename

### **Method 2: Browser Print** (Quick)

1. **Open report**
2. **Press**: `Ctrl + P` (Windows) or `Cmd + P` (Mac)
3. **Select**: "Save as PDF"
4. **Click**: Save

---

## 📱 Mobile Usage

### **On Mobile Phone:**

1. **Open report** in mobile browser
2. **Tap**: "พิมพ์" button
3. **Select**: "Save to Files" or "Save as PDF"
4. **Choose**: Location (Downloads, Drive, etc.)
5. **Done**: PDF saved to your phone!

**Supported Apps:**
- Chrome (Android)
- Safari (iOS)
- Edge
- Firefox

---

## 📋 Report Contents

### **Page 1: Main Form**
- Personal information (name, phone, address)
- Birth date and age
- Education, nationality, religion
- ID card number
- Applied position
- Work experience questions
- Health questions (checkboxes)
- Signatures (applicant & supervisor)
- Footer with submission info

### **Page 2: ID Card**
- Full-size image of uploaded ID card
- Title: "สำเนาบัตรประชาชน"

### **Page 3: Medical Certificate**
- Full-size image of medical certificate
- Title: "ใบรับรองแพทย์"

**Note:** Pages 2 & 3 only appear if documents were uploaded!

---

## ⚙️ Print Settings (Recommended)

| Setting | Value |
|---------|-------|
| Paper Size | **A4** |
| Orientation | **Portrait** |
| Margins | **Default** |
| Scale | **100%** |
| Background Graphics | **✓ Enabled** |
| Headers & Footers | **✗ Disabled** |

---

## 🎯 Quick Tips

### **For Best Results:**

1. ✅ **Always use A4 paper size**
2. ✅ **Keep scale at 100%**
3. ✅ **Enable background graphics** (to show borders)
4. ✅ **Disable headers/footers** (cleaner look)
5. ✅ **Use latest browser version**

### **Common Issues:**

**Q: Logo doesn't show?**
- A: Enable "Background graphics" in print settings

**Q: Pages cut off?**
- A: Make sure paper size is set to A4

**Q: Text too small?**
- A: Don't change scale - keep at 100%

**Q: Can't see documents?**
- A: Check if files were uploaded during registration

---

## 🔗 Related Links

- Token Management: `/admin/member-application-tokens`
- Edit Member: `/public/member-form?token={token}&id={member_id}`
- View Report: `/public/member-report?id={member_id}`

---

## 📞 Need Help?

Check the full documentation:
- `MEMBER_REPORT_FEATURE_COMPLETE.md` - Complete technical details
- `MEMBER_REGISTRATION_COMPLETE.md` - System overview

---

**Happy Reporting! 📄✨**
