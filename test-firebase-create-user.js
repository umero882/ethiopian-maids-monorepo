/**
 * Test Firebase - Create or update admin user
 */

const { initializeApp } = require('firebase/app');
const { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, sendPasswordResetEmail } = require('firebase/auth');

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

async function main() {
  console.log('========================================');
  console.log('Firebase Admin User Setup');
  console.log('========================================\n');
  console.log('Email:', EMAIL);
  console.log('Password:', PASSWORD);
  console.log('');

  // First try to sign in
  console.log('Step 1: Trying to sign in...');
  try {
    const userCredential = await signInWithEmailAndPassword(auth, EMAIL, PASSWORD);
    console.log('✅ Login successful!');
    console.log('User ID:', userCredential.user.uid);
    process.exit(0);
  } catch (signInError) {
    console.log('Sign in failed:', signInError.code);

    if (signInError.code === 'auth/user-not-found') {
      // User doesn't exist, create them
      console.log('\nStep 2: User not found. Creating new user...');
      try {
        const newUser = await createUserWithEmailAndPassword(auth, EMAIL, PASSWORD);
        console.log('✅ User created successfully!');
        console.log('User ID:', newUser.user.uid);
        process.exit(0);
      } catch (createError) {
        console.log('❌ Failed to create user:', createError.code, createError.message);
        process.exit(1);
      }
    } else if (signInError.code === 'auth/invalid-credential' || signInError.code === 'auth/wrong-password') {
      // Password is wrong - send reset email
      console.log('\nPassword is incorrect. Sending password reset email...');
      try {
        await sendPasswordResetEmail(auth, EMAIL);
        console.log('✅ Password reset email sent to:', EMAIL);
        console.log('');
        console.log('Please check your email and reset the password to:', PASSWORD);
        process.exit(0);
      } catch (resetError) {
        console.log('❌ Failed to send reset email:', resetError.code, resetError.message);
        process.exit(1);
      }
    } else {
      console.log('❌ Unexpected error:', signInError.code, signInError.message);
      process.exit(1);
    }
  }
}

main();
