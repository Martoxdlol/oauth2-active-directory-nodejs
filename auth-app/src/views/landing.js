import { Link } from 'react-router-dom'
import ethf_img from '../ethf.png'

export default function Landing(props) {

    return <div>
        <img src={ethf_img} />
        <h2>Gestor de usuarios y autenticación de ETHF</h2>
        <Link className='big-link' to='/reset-password'>Cambiar contraseña</Link>
    </div>
}




