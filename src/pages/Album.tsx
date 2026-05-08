import type { AppUser } from '../App'
export default function Album({ user }: { user: AppUser }) {
  return <div className="p-4"><h1 className="text-xl font-bold">Mi Álbum</h1><p className="text-gray-500">{user.apodo}</p></div>
}
