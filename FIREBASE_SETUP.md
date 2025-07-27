# Firebase Setup Guide for Bicycle Workshop Management

## 🔥 Firebase Configuration

To use Firebase with your Bicycle Workshop Management system, follow these steps:

### 1. Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project" or "Add project"
3. Enter your project name (e.g., "bicycle-workshop")
4. Enable Google Analytics (optional)
5. Click "Create project"

### 2. Enable Firestore Database

1. In your Firebase project console, click "Firestore Database"
2. Click "Create database"
3. Choose "Start in test mode" (for development)
4. Select a location for your database
5. Click "Done"

### 3. Get Your Firebase Configuration

1. In your Firebase project console, click the gear icon ⚙️ (Project settings)
2. Scroll down to "Your apps" section
3. Click the web icon `</>` to add a web app
4. Enter an app nickname (e.g., "workshop-web")
5. Click "Register app"
6. Copy the configuration object

### 4. Update firebase-config.js

Replace the placeholder values in `firebase-config.js` with your actual Firebase configuration:

```javascript
const firebaseConfig = {
  apiKey: "your-actual-api-key",
  authDomain: "your-project-id.firebaseapp.com",
  projectId: "your-actual-project-id",
  storageBucket: "your-project-id.appspot.com",
  messagingSenderId: "your-actual-sender-id",
  appId: "your-actual-app-id"
};
```

### 5. Set Up Firestore Security Rules (Optional)

For production, update your Firestore security rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow read/write access to all documents
    // Update these rules based on your security requirements
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

### 6. Test Your Setup

1. Open your application in a web browser
2. Go to the "Database" tab
3. If you see a migration section, your local data can be migrated to Firebase
4. If you see Firebase connection status, you're ready to go!

## 🚀 Features Enabled with Firebase

- **Cloud Storage**: Your data is stored in Google's secure cloud infrastructure
- **Real-time Sync**: Data updates in real-time across all devices
- **Automatic Backups**: Firebase handles backups automatically
- **Scalability**: Handles growing amounts of data seamlessly
- **Cross-device Access**: Access your workshop data from any device
- **Data Migration**: Easy migration from local storage to Firebase

## 🔧 Troubleshooting

### Common Issues:

1. **"Firebase not configured" error**
   - Make sure you've updated the configuration in `firebase-config.js`
   - Check that all configuration values are correct

2. **"Permission denied" error**
   - Check your Firestore security rules
   - Make sure you're in test mode for development

3. **"Network error" error**
   - Check your internet connection
   - Verify your Firebase project is active

4. **Migration not working**
   - Make sure you have local data to migrate
   - Check browser console for detailed error messages

### Getting Help:

- Check the browser console (F12) for detailed error messages
- Verify your Firebase project settings
- Ensure your Firestore database is properly set up
- Check that your domain is authorized in Firebase settings

## 📊 Data Structure

Firebase will create the following collections:

- `customers` - Customer information
- `bicycles` - Bicycle registrations
- `jobOffers` - Repair job offers and tickets
- `repairHistory` - Completed repair records
- `repairServices` - Custom repair services (if added)

## 🔒 Security Considerations

- Update Firestore security rules for production use
- Consider implementing Firebase Authentication for user management
- Regularly review access logs and usage patterns
- Keep your Firebase configuration secure

## 💡 Next Steps

Once Firebase is set up:

1. Test the migration from local storage
2. Create some test data to verify everything works
3. Set up proper security rules for production
4. Consider adding user authentication
5. Explore Firebase's other features like Cloud Functions or Analytics

---

**Need help?** Check the Firebase documentation at https://firebase.google.com/docs