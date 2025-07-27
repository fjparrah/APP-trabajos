# APP-trabajos

Registro y gestión de trabajos realizados en diferentes ubicaciones, con backend en Django y frontend en React (Vite + TypeScript).

## 📦 Estructura del Proyecto

APP-trabajos/
├── backend/ # Proyecto Django (API)
│ └── requirements.txt
├── frontend/ # Proyecto React (Vite + TypeScript)
│ └── package.json
└── README.md

---

## 🚀 Requisitos Previos

- [Python 3.10+](https://www.python.org/downloads/)
- [Node.js 18+ y npm](https://nodejs.org/) (o [Yarn](https://yarnpkg.com/))
- [Git](https://git-scm.com/)

---

## 🛠️ Instalación Backend (Django)

1. **Ir a la carpeta del backend:**
    ```bash
    cd backend
    ```

2. **Crear y activar un entorno virtual (opcional pero recomendado):**
    - **Windows:**
      ```bash
      python -m venv venv
      .\venv\Scripts\activate
      ```
    - **Linux/Mac:**
      ```bash
      python3 -m venv venv
      source venv/bin/activate
      ```

3. **Instalar dependencias:**
    ```bash
    pip install -r requirements.txt
    ```

4. **Aplicar migraciones de la base de datos:**
    ```bash
    python manage.py migrate
    ```

5. **Crear superusuario (opcional, para panel admin):**
    ```bash
    python manage.py createsuperuser
    ```

6. **Correr el servidor local:**
    ```bash
    python manage.py runserver
    ```

---

## 🖥️ Instalación Frontend (React + Vite + TypeScript)

1. **Ir a la carpeta del frontend:**
    ```bash
    cd frontend
    ```

2. **Instalar dependencias:**
    ```bash
    npm install
    ```
    o, si usas yarn:
    ```bash
    yarn install
    ```

3. **Correr la aplicación en modo desarrollo:**
    ```bash
    npm run dev
    ```
    o, si usas yarn:
    ```bash
    yarn dev
    ```

---

## 🌍 Uso

- Accede al backend en: [http://localhost:8000](http://localhost:8000)
- Accede al frontend en: [http://localhost:5173](http://localhost:5173) (o el puerto que indique Vite)

---

## 💡 Notas

- Modifica las variables de entorno (`.env`) según sea necesario para conectar frontend y backend.
- **No subas tus archivos `.env`, contraseñas o claves secretas a GitHub.**

---

## 🙌 Autor

- Francisco Parra ([github.com/fjparrah](https://github.com/fjparrah))

---

