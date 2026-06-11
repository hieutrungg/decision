// scripts/seedData.js
// Seed dữ liệu mẫu vào Firestore. Chạy 1 lần từ máy dev:
//   node scripts/seedData.js
// Yêu cầu: điền firebaseConfig bên dưới (lấy từ Firebase Console).
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, addDoc } = require('firebase/firestore');

const firebaseConfig = {
  apiKey: 'YOUR_FIREBASE_API_KEY',
  authDomain: 'YOUR_PROJECT.firebaseapp.com',
  projectId: 'YOUR_PROJECT_ID',
};

const SAMPLE = [
  {
    title: 'The Workshop Coffee',
    description: 'Cafe specialty yên tĩnh, view phố cổ, hợp làm việc và đọc sách.',
    images: [],
    category: 'cafe',
    budget: 80000,
    duration: 60,
    mood: ['relax'],
    location: { lat: 21.0301, lng: 105.8525, address: 'Hoàn Kiếm, Hà Nội' },
  },
  {
    title: 'Workshop làm nến thơm',
    description: 'Tự tay làm nến thơm mang về, có hướng dẫn, phù hợp đi 1 mình hoặc nhóm nhỏ.',
    images: [],
    category: 'workshop',
    budget: 150000,
    duration: 90,
    mood: ['relax', 'social'],
    location: { lat: 21.0356, lng: 105.8203, address: 'Ba Đình, Hà Nội' },
  },
  {
    title: 'Ramen Hakata',
    description: 'Ramen chuẩn vị Nhật, nước dùng tonkotsu, không gian ấm cúng.',
    images: [],
    category: 'food',
    budget: 70000,
    duration: 45,
    mood: ['relax', 'social'],
    location: { lat: 21.0152, lng: 105.8271, address: 'Đống Đa, Hà Nội' },
  },
  {
    title: 'Bi-a & Board game cafe',
    description: 'Quán board game đông vui, nhiều trò mới, hợp nhóm bạn.',
    images: [],
    category: 'entertainment',
    budget: 100000,
    duration: 120,
    mood: ['energetic', 'social'],
    location: { lat: 21.0078, lng: 105.8431, address: 'Hai Bà Trưng, Hà Nội' },
  },
  {
    title: 'Chạy bộ quanh Hồ Tây + cafe trứng',
    description: 'Combo vận động nhẹ buổi chiều rồi thưởng cafe trứng ven hồ.',
    images: [],
    category: 'entertainment',
    budget: 50000,
    duration: 90,
    mood: ['energetic', 'relax'],
    location: { lat: 21.0587, lng: 105.8229, address: 'Tây Hồ, Hà Nội' },
  },
  // TODO: thêm cho đủ 30–50 experiences (doc mục 4.1) — chia nhau mỗi member nhập 6–10 chỗ
];

async function seed() {
  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);
  for (const exp of SAMPLE) {
    const ref = await addDoc(collection(db, 'experiences'), { ...exp, rating: 0, createdAt: new Date() });
    console.log('Đã thêm:', exp.title, '→', ref.id);
  }
  console.log('Xong! Tổng:', SAMPLE.length);
  process.exit(0);
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
