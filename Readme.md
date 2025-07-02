# Research Lab Management Dashboard

This is a web-based dashboard system for managing laboratory information, groups, employees, and repositories. Built with the MERN stack (MongoDB, Express.js, React.js, Node.js), it includes user role-based access, file uploads, and admin management.

---

## 📁 Project Structure

```
/
├── clean/           # React frontend for employee/user interface
├── DRDOApp/         # React frontend for admin panel
├── backend/         # Node.js + Express backend (optional)
├── package.json     # Root package file (if using monorepo structure)
└── README.md
```

---

## 🔧 Features

* User registration and login (JWT-based)
* Role-based access (admin, employee)
* Manage labs, research groups, directors, and manpower
* Upload and view:

  * Publications, patents, courses, projects, technologies
* Software repository management
* Admin panel for updating and deleting content
* Offline deployment support using PM2

---

## 🚀 Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/Anurag915/YourRepoName.git
cd YourRepoName
```

### 2. Install dependencies

For both folders (`clean` and `DRDOApp`):

```bash
cd clean
npm install

cd ../DRDOApp
npm install
```

### 3. Run the applications

```bash
cd clean
npm start
```

In another terminal:

```bash
cd DRDOApp
npm start
```

---

## 📦 Deployment

You can use `pm2` to run both frontends persistently and offline:

```bash
pm2 start npm --name "user-panel" -- start
pm2 start npm --name "admin-panel" -- start
```

---

## 🧑‍💻 Author

**Anurag Prajapati**
Full-stack developer and contributor to this lab management system project.

---

## 📜 License

MIT License (or replace with your preferred license)
