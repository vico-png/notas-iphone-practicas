# 📝 iNotes App - Réplica de Notas de iPhone

Una aplicación de notas moderna y potente construida con **React Native** y **Expo**, diseñada con una estética premium inspirada en el ecosistema iOS. Gestiona tus tareas, ideas y listas de la compra con una interfaz fluida y minimalista.

![Banner](https://img.shields.io/badge/Status-Complete-success?style=for-the-badge)
![React Native](https://img.shields.io/badge/React_Native-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Expo](https://img.shields.io/badge/Expo-000020?style=for-the-badge&logo=expo&logoColor=white)

---

## ✨ Características Principales

### 📋 Gestión de Notas Avanzada
- **Checklists Inteligentes**: Modo de lista de tareas estilo iPhone. Al pulsar "Intro" se crea un nuevo elemento automáticamente. Marca tus tareas completadas con un solo toque.
- **Auto-guardado Inteligente**: No pierdas nunca nada. La app guarda automáticamente tus cambios al salir, pero solo si has modificado el contenido real.
- **Organización por Colores**: Personaliza cada nota con una paleta de colores curada al estilo iOS (Arena, Amarillo, Verde, Azul, etc.).
- **Notas Fijadas**: Mantén tus notas más importantes siempre en la parte superior.

### 🖼️ Multimedia y UX
- **Soporte de Imágenes**: Añade fotos de tu galería a tus notas. Incluye un visor de imágenes a pantalla completa con zoom.
- **Interacciones Nativas**:
  - **Deslizar para borrar**: Swipe lateral para eliminar notas rápidamente.
  - **Modo Selección**: Mantén pulsada una nota para entrar en modo selección y borrar varias notas a la vez.
- **Búsqueda en Tiempo Real**: Encuentra cualquier nota al instante filtrando por título o contenido.

### 📱 Diseño Premium
- **Estética iOS 17**: Tipografía Inter/Roboto, sombras suaves y efectos de difuminado (glassmorphism).
- **Modo Independiente**: Las notas completadas y pendientes se separan automáticamente para mantener tu espacio de trabajo limpio.

---

## 🚀 Instalación y Prueba

Para ejecutar este proyecto localmente:

1. **Clonar el repositorio**:
   ```bash
   git clone https://github.com/vuestro-usuario/notas-iphone-practicas.git
   cd notas-iphone-practicas
   ```

2. **Instalar dependencias**:
   ```bash
   npm install
   ```

3. **Ejecutar con Expo**:
   ```bash
   npx expo start
   ```

4. **Abrir en tu dispositivo**:
   Escanea el código QR con la app **Expo Go** (disponible en iOS App Store y Google Play Store).

---

## 🛠️ Tecnologías Utilizadas

- **Framework**: React Native (Expo SDK 50+)
- **Navegación**: React Navigation (Stacks & Modals)
- **Almacenamiento**: AsyncStorage (Persistencia local de datos)
- **Gestos**: React Native Gesture Handler (Swipe-to-delete)
- **Multimedia**: Expo Image Picker & React Native Image Zoom Viewer
- **IDs**: React Native UUID

---

## 📈 Próximas Mejoras (Roadmap)
- [ ] Sincronización con iCloud/Google Drive.
- [ ] Soporte para grabación de audio.
- [ ] Modo Oscuro automático (Dark Mode).
- [ ] Categorías personalizables y carpetas.

---

## 📄 Licencia
Este proyecto es una práctica educativa. Puedes usar el código libremente para aprender y mejorar tus habilidades en React Native.

---
*Desarrollado con ❤️ para amantes del diseño limpio y funcional.*
