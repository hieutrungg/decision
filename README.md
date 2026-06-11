# Random Experience 🎲

> "Google Maps giúp tìm nơi bạn đã muốn tới. Random Experience giúp tìm nơi bạn chưa từng nghĩ tới."

App mobile (React Native + Expo) gợi ý trải nghiệm ngoài đời thực theo budget / thời gian / mood.
Môn MMA301 — FPT University — nhóm 5 thành viên — 2 tuần.

## Quy trình dev (đọc kỹ!)

**Code bằng VS Code → test bằng Expo Go → build APK bằng EAS.** Không cần Android Studio.

1. Code trên VS Code như bình thường
2. `npx expo start` → quét QR bằng app **Expo Go** trên điện thoại Android → app chạy live, sửa code là thấy ngay (Fast Refresh)
3. Cuối tuần 2: `eas build -p android --profile preview` → nhận link tải file APK để demo

## Setup lần đầu (mỗi thành viên)

```bash
# 1. Clone repo rồi cài dependencies
npm install

# 2. Cài Expo Go trên điện thoại (Google Play)

# 3. Chạy dev server
npx expo start
# Quét QR code bằng Expo Go (điện thoại + máy tính cùng mạng WiFi)
```

## Cấu hình Firebase (làm 1 lần, leader làm)

1. Tạo project tại https://console.firebase.google.com
2. Bật **Authentication → Email/Password**
3. Tạo **Firestore Database** (chế độ production)
4. Vào Project Settings → thêm Web app → copy config
5. Điền config vào `app.json` mục `extra` (các key `firebase...`)
6. Deploy security rules: copy nội dung `firestore.rules` vào tab Rules trong Console
7. Seed dữ liệu mẫu: điền config vào `scripts/seedData.js` rồi chạy `node scripts/seedData.js`
8. Khi app báo lỗi thiếu index khi query (mood + budget) → bấm vào link trong lỗi để Firebase tự tạo composite index

## Cấu hình Google Maps (leader làm)

1. Tạo API key tại https://console.cloud.google.com (bật Maps SDK for Android + Directions API)
2. Điền vào `app.json`: `android.config.googleMaps.apiKey` và `extra.googleMapsApiKey`
3. Lưu ý: bản đồ Google chỉ hiện đầy đủ trong **development build / APK**, trong Expo Go có thể bị giới hạn — phần M3 nên test sớm bằng EAS build

## Phân chia module (mỗi người 1 folder, hạn chế đụng shared code)

| Member | Module | Folder chính |
|---|---|---|
| M1 | Auth + Profile | `src/screens/auth/`, `src/services/authService.js`, `src/context/` |
| M2 | Recommendation | `src/screens/discover/`, `src/services/recommendService.js`, `src/hooks/useShake.js`, `useRecommend.js` |
| M3 | Map & Location | `src/screens/map/`, `src/api/maps.js` |
| M4 | Experience CRUD | `src/screens/experience/`, `src/services/experienceService.js` |
| M5 | Social & Gamification | `src/screens/social/`, `src/services/socialService.js` |

**Shared (KHÔNG tự ý sửa, bàn trong nhóm trước):** `src/utils/theme.js`, `src/utils/constants.js`, `src/navigation/`, `src/components/common/`, `App.js`, `app.json`

## Quy ước Git

- Mỗi member 1 branch: `feature/m1-auth`, `feature/m2-recommend`, ...
- Merge vào `main` qua Pull Request, ít nhất 1 người review
- Chạy `npm run format` trước khi commit

## Build APK demo

```bash
npm install -g eas-cli
eas login            # tài khoản Expo (tạo free tại expo.dev)
eas build -p android --profile preview
# Chờ ~10-15 phút → nhận link tải APK
```

## TODO còn lại (theo kế hoạch 2 tuần)

- [ ] Điền Firebase + Google Maps config thật
- [ ] Seed đủ 30–50 experiences ở Hà Nội
- [ ] M3: vẽ route (Polyline) cho mini itinerary trên map
- [ ] M4: form tạo experience + viết review
- [ ] M5: màn hình achievement, nút "Đã trải nghiệm" ở detail
- [ ] Nâng cấp FilterBottomSheet lên @gorhom/bottom-sheet (hiện dùng Modal cho đơn giản)
- [ ] Test trên thiết bị thật, build APK
