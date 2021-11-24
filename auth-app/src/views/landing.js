import { Link } from 'react-router-dom'
import ethf_img from '../ethf.png'

export default function Landing(props) {

    return <div>
        <img src={ethf_img} />
        <Link className='big-link' to='/reset-password'>Cambiar contraseña</Link>
    </div>
}




