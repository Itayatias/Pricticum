# Pricticum

Practicum Project

## Node.js Website Setup

הפרויקט הזה הוא אתר פשוט ב-Node.js שמשרת דפי HTML סטטיים דרך Express.

### פקודות זמינות

- `npm install` - מתקין את התלויות
- `npm run dev` - מפעיל את השרת עם reload אוטומטי (nodemon)
- `npm start` - מפעיל את השרת ב-node רגיל

### פתיחת האתר

לאחר התקנה, פתח את:

- `http://localhost:3000`

### קבצי פרויקט

- `server.js` - קונפיגורציית שרת Express
- `public/index.html` - דף הבית
- `public/style.css` - סגנונות בסיסיים
- `public/script.js` - JavaScript בצד הלקוח
- `data/database.db` - מסד נתונים SQLite שנוצר אוטומטית

## מסד נתונים SQLite

הפרויקט עכשיו משתמש ב-SQLite דרך `sqlite3` כדי לשמור הודעות בנתונים.

- `GET /api/messages` - מביא את כל ההודעות מהמסד
- `POST /api/messages` - שומר הודעה חדשה

הכנס הודעה בטופס בדף הבית והיא תשמר במסד הנתונים.
