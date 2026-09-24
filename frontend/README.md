# 📚 Library Management System — Frontend

React + Vite + TailwindCSS + DaisyUI দিয়ে তৈরি Library Management System এর Frontend।

## 🛠 Tech Stack
- **Framework:** React 19 + Vite
- **Styling:** TailwindCSS + DaisyUI
- **Routing:** React Router v7
- **Notifications:** react-hot-toast
- **Icons:** react-icons

## ⚙️ Setup করার নিয়ম

### ১. Dependencies install করো

```bash
npm install
```

### ২. `.env` file configure করো

`.env` file এ backend URL দাও:

```env
VITE_API_URL=http://localhost:8000
```

### ৩. Development server চালু করো

```bash
npm run dev
```

Frontend চলবে: **http://localhost:5173**

## 📁 Project Structure

```
src/
├── components/          # Reusable components
│   ├── Navbar.jsx
│   ├── Footer.jsx
│   ├── BookCard.jsx
│   ├── HeroBanner.jsx
│   └── FeatureBooks.jsx
├── context/
│   └── AuthProvider.jsx # Global auth state
├── layout/
│   ├── Root.jsx         # Main layout (Navbar + Footer)
│   └── AdminLayout.jsx  # Admin panel layout
├── pages/
│   ├── Home.jsx
│   ├── Login.jsx
│   ├── Signup.jsx
│   ├── BrowseBooks.jsx
│   ├── BookDetails.jsx
│   ├── MyReserve.jsx
│   ├── MyIssues.jsx
│   ├── UserProfile.jsx
│   ├── ChangePassword.jsx
│   └── admin/
│       ├── MangeBook.jsx
│       ├── EditBook.jsx
│       ├── IssueBook.jsx
│       └── ManageIssue.jsx
├── routes/
│   ├── Routes.jsx       # All route definitions
│   ├── PrivateRoutes.jsx
│   └── AdminProtected.jsx
└── services/
    └── BaseUrl.jsx      # Backend API URL
```

## 🔗 Pages & Routes

| Route | Page | Access |
|-------|------|--------|
| `/` | Home | Public |
| `/login` | Login | Public |
| `/signup` | Signup | Public |
| `/books` | Browse Books | Public |
| `/books/:id` | Book Details | Logged in |
| `/reserve/my` | My Reservations | Logged in |
| `/issues/my` | My Issues | Logged in |
| `/user/profile` | Profile | Logged in |
| `/change-password` | Change Password | Logged in |
| `/admin/manage-book` | Manage Books | Admin only |
| `/admin/issue-book` | Issue Book | Admin only |
| `/admin/manage-issue` | Manage Issues | Admin only |

## 🔌 Backend Connection

Frontend backend এর সাথে connect হয় `http://localhost:8000` এ।
Backend আলাদাভাবে চালু করতে হবে।
