# 🌐 PHASE 3: FRONTEND DEPLOYMENT CHECKLIST

## ✅ **PHASE 2 COMPLETED**
- **Backend URL**: https://mentorverse-backend-tq0o.onrender.com/
- **Health Check**: https://mentorverse-backend-tq0o.onrender.com/api/health
- **API Test**: https://mentorverse-backend-tq0o.onrender.com/api/test

---

## 🚀 **PHASE 3: VERCEL DEPLOYMENT** (10 minutes)

### **Step 3.1: Create Vercel Account** (2 minutes)
1. Go to https://vercel.com
2. Click **"Start Deploying"**
3. **Sign up with GitHub** (recommended)

### **Step 3.2: Import Project** (3 minutes)
1. Click **"Add New..."** → **"Project"**
2. **Import Git Repository** → Find your **MentorVerse repository**
3. Click **"Import"**

### **Step 3.3: Configure Project Settings** (3 minutes)
**🚨 CRITICAL**: Set these **EXACT** settings:

```
Framework Preset: Vite
Root Directory: frontend
Build Command: npm run build
Output Directory: dist
Install Command: npm install
```

### **Step 3.4: Set Environment Variables** (2 minutes)
Add these environment variables in Vercel:

```
VITE_API_URL=https://mentorverse-backend-tq0o.onrender.com/api
VITE_GEMINI_API_KEY=your_gemini_api_key_here
```

**🔑 Get Gemini API Key:**
1. Go to https://makersuite.google.com/app/apikey
2. Click "Create API Key"
3. Copy the key and paste it in Vercel

### **Step 3.5: Deploy Frontend** (3 minutes)
1. Click **"Deploy"**
2. **Wait for deployment** (2-3 minutes)
3. **Your frontend URL** will be something like: `https://mentorverse-xyz123.vercel.app`

---

## 🧪 **PHASE 4: TESTING** (5 minutes)

### **Step 4.1: Test Frontend**
1. **✅ Frontend loads**: Visit your Vercel URL
2. **✅ No console errors**: Open browser DevTools → Console
3. **✅ API connection**: Should see no CORS errors

### **Step 4.2: Test Features**
1. **✅ Homepage loads**: Should see MentorVerse landing page
2. **✅ Role selection**: Try clicking "Get Started as Mentor/Mentee"
3. **✅ Registration**: Try creating a test account
4. **✅ Login**: Test login functionality

### **Step 4.3: Update Backend CORS** (if needed)
If you get CORS errors:
1. Go to **Render Dashboard** → **mentorverse-backend**
2. **Environment** → Add:
```
CORS_ORIGIN=https://your-actual-vercel-url.vercel.app
```
3. **Save** → Backend will auto-redeploy

---

## 🎯 **EXPECTED FINAL URLS**
- **🗄️ Database**: MongoDB Atlas (3 databases) ✅
- **🖥️ Backend**: https://mentorverse-backend-tq0o.onrender.com ✅
- **🌐 Frontend**: https://mentorverse-xyz123.vercel.app (after Phase 3)

---

## 🚨 **TROUBLESHOOTING**

### **Issue: Frontend Build Fails**
**Solution**: 
- Verify Root Directory = `frontend`
- Verify Framework Preset = `Vite`
- Check `frontend/package.json` exists

### **Issue: CORS Errors**
**Solution**:
- Add your Vercel URL to `CORS_ORIGIN` in Render
- Wait 2-3 minutes for backend to redeploy

### **Issue: API Calls Fail**
**Solution**:
- Verify `VITE_API_URL` in Vercel environment variables
- Check browser Network tab for failed requests

---

## 🎉 **YOU'RE ALMOST DONE!**

Your backend is live and ready. Just deploy the frontend and you'll have a fully functional MentorVerse platform!

**Next**: Follow Phase 3 steps above to deploy your frontend to Vercel.