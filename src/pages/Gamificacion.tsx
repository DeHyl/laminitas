import type { AppUser } from '../App'
export default function Gamificacion({ user, onUserUpdate: _ }: { user: AppUser; onUserUpdate: (u: AppUser) => void }) {
  return <div className="p-4"><h1 className="text-xl font-bold">Goles</h1><p>{user.puntos_total} goles</p></div>
}
