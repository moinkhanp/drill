import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server'
import { redirect } from 'next/navigation'


function Dashboard() {
    const {getUser} = getKindeServerSession()
    const user = getUser()

    if(!user) redirect('/auth-callback?origin=dashboard');

  return (
    <div>Dashboard {user.email}</div>
  )
}

export default Dashboard