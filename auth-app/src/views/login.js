import { Link } from 'react-router-dom'
import axios from 'axios'
import ethf_img from '../ethf.png'
import React, { useState } from 'react'

export default function Login(props) {
    const key = (new URL(window.location.href)).searchParams.get('key')
    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')

    async function handleSubmit(e) {
        e.preventDefault()
        try {
            const response = await axios.post('/oauth2/login/api/login', { username, password }, {
                params: {
                    key
                }
            })
            window.location.href = response.data
        } catch (error) {
            if(error.response) console.log(error.response.data)
            alert("ERR")
        }

    }

    return <div>
        <img src={ethf_img} />
        <form onSubmit={handleSubmit}>
            <label class="floating-label" htmlFor="username">Nombre de usuario</label>
            <input type="text" name="username" id="username" value={username} onChange={e => setUsername(e.target.value)} />            
            <label class="floating-label" htmlFor="password">Contraseña</label>
            <input type="password" name="password" id="password" value={password} onChange={e => setPassword(e.target.value)} />
            <input type="submit" value="Continuar" />
        </form>
        <div id="actions">
            <Link className='big-link' to='/reset-password'>Cambiar contraseña</Link>
        </div>
    </div>
}




