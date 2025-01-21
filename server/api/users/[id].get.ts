import { getFirestore } from 'firebase-admin/firestore';

export default defineEventHandler(async (event) => {
  const userId = event.context.params?.id;
  const db = getFirestore();

  // Obtener usuario
  const userSnapshot = await db.collection('usuarios').doc(userId).get();
  if (!userSnapshot.exists) throw new Error('Usuario no encontrado');
  const userData = userSnapshot.data();

  // Resolver rol
  const roleSnapshot = await userData.rol.get(); // Resolver referencia al rol
  if (!roleSnapshot.exists) throw new Error('Rol no encontrado');
  const roleData = roleSnapshot.data();

  // Resolver permisos
  const permissionsRefs = roleData.permisos || [];
  const permissionsSnapshots = await Promise.all(permissionsRefs.map(ref => ref.get()));
  const permissions = permissionsSnapshots.map(doc => ({
    id: doc.id,
    ...doc.data(),
  }));

  // Combinar todo
  return {
    id: userSnapshot.id,
    ...userData,
    rol: {
      id: roleSnapshot.id,
      ...roleData,
      permisos: permissions,
    },
  };
});
