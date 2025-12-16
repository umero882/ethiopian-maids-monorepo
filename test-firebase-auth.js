/**
 * Test Firebase Authentication directly
 */

const { initializeApp } = require('firebase/app');
const { getAuth, signInWithEmailAndPassword } = require('firebase/auth');

const firebaseConfig = {
  apiKey: "REMOVED_API_KEY",
  authDomain: "ethiopian-maids.firebaseapp.com",
  projectId: "ethiopian-maids",
  storageBucket: "ethiopian-maids.firebasestorage.app",
  messagingSenderId: "227663902586",
  appId: "1:227663902586:web:3d100f09f205d5833988c3"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

const EMAIL = 'info@ethiopianmaids.com';
const PASSWORD = '231978@EthioAdmin';

async function testLogin() {
  console.log('Testing Firebase login...');
  console.log('Email:', EMAIL);
  console.log('Password:', PASSWORD);
  console.log('');

  try {
    const userCredential = await signInWithEmailAndPassword(auth, EMAIL, PASSWORD);
    console.log('✅ SUCCESS! Login worked!');
    console.log('User ID:', userCredential.user.uid);
    console.log('Email:', userCredential.user.email);
    process.exit(0);
  } catch (error) {
    console.log('❌ LOGIN FAILED');
    console.log('Error code:', error.code);
    console.log('Error message:', error.message);
    console.log('');
    console.log('This means the password in Firebase does not match "231978@EthioAdmin"');
    console.log('Please reset the password using the Firebase Console or the test HTML page.');
    process.exit(1);
  }
}

testLogin();
