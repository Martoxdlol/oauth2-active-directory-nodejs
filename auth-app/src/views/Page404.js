import { Link } from 'react-router-dom'
import ethf_img from '../ethf.png'

export default function Page404(props) {

    return <div>
        <img src={ethf_img} />
        <h2>Página inexistente</h2>
        <Link className='big-link' to='/'>Inicio</Link>
    </div>
}




